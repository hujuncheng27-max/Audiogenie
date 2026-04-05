from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
import logging
import os
import shutil
import time
from pathlib import Path

import yaml

log = logging.getLogger(__name__)


class _SafeDict(dict):
    def __missing__(self, key: str) -> str:
        return "{" + key + "}"


@dataclass
class ToolSpec:
    name: str
    task: str
    command: str = ""
    inputs: List[str] = field(default_factory=list)
    conda_env: str = ""
    notes: str = ""
    provider: str = ""
    default_model: str = ""
    parameters: Dict[str, Any] = field(default_factory=dict)
    runtime: Any = field(default=None, repr=False, compare=False)


class ToolRunError(RuntimeError):
    """Normalized tool execution error used by callers across local and online tools."""

    def __init__(self, message: str, *, cmd: str, returncode: int, stdout: str = "", stderr: str = ""):
        super().__init__(message)
        self.cmd = cmd
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


class BaseTool:
    """Base class for all online tools.

    Subclasses only need to implement `run`, while shared validation,
    logging, and output materialization stay here.
    """

    def __init__(self, spec: ToolSpec, **config: Any):
        self.spec = spec
        self.config = config

    def run(self, args: Dict[str, Any], output_wav: Optional[str] = None) -> str:
        """Execute the tool and return a local output path."""
        raise NotImplementedError

    def _sanitize_args(self, args: Dict[str, Any]) -> Dict[str, Any]:
        redacted = {}
        for key, value in (args or {}).items():
            lk = str(key).lower()
            if any(token in lk for token in ("key", "token", "secret", "password")):
                redacted[key] = "***"
            else:
                redacted[key] = value
        return redacted

    def _request_label(self) -> str:
        provider = self.spec.provider or self.config.get("provider") or "unknown"
        target = self.config.get("space") or self.config.get("api_url") or self.spec.default_model or self.spec.name
        api_name = self.config.get("api_name", "")
        return f"{provider}:{target}{api_name}"

    def _log_start(self, args: Dict[str, Any], output_wav: Optional[str]) -> float:
        """Log the normalized request context before calling the remote API."""
        started = time.time()
        log.info(
            "Running tool %s (%s) via %s with args=%s output=%s",
            self.spec.name,
            self.spec.task,
            self._request_label(),
            self._sanitize_args(args),
            output_wav or "",
        )
        return started

    def _log_success(self, started: float, output_path: str, status_code: Optional[int] = None) -> None:
        """Log a successful tool execution with elapsed time and output path."""
        elapsed = time.time() - started
        log.info(
            "Tool %s succeeded status=%s elapsed=%.2fs output=%s",
            self.spec.name,
            status_code if status_code is not None else "unknown",
            elapsed,
            output_path,
        )

    def _tool_error(
        self,
        message: str,
        *,
        status_code: Optional[int] = None,
        stdout: str = "",
        stderr: str = "",
    ) -> ToolRunError:
        """Build a ToolRunError so downstream callers can handle one error type."""
        request_label = self._request_label()
        code = status_code if status_code is not None else -1
        full_message = f"Tool '{self.spec.name}' failed via {request_label} with status {code}. {message}"
        log.error(full_message)
        return ToolRunError(
            full_message,
            cmd=request_label,
            returncode=code,
            stdout=stdout,
            stderr=stderr,
        )

    def _require(self, args: Dict[str, Any], key: str) -> Any:
        value = args.get(key)
        if value in (None, ""):
            raise self._tool_error(f"Missing required argument: {key}")
        return value

    def _materialize_output(self, result_path: str, output_wav: Optional[str]) -> str:
        """Normalize the remote tool output into a stable local file path."""
        if not result_path:
            raise self._tool_error("API returned an empty output path.")
        src = Path(result_path).expanduser()
        if not src.exists():
            raise self._tool_error(f"API output path does not exist: {src}")
        if not output_wav:
            return str(src)
        dst = Path(output_wav).expanduser()
        dst.parent.mkdir(parents=True, exist_ok=True)
        if src.resolve() != dst.resolve():
            shutil.copyfile(src, dst)
        return str(dst)


class GradioTool(BaseTool):
    """Shared Gradio-based tool transport.

    This class owns client initialization and the common `predict` wrapper,
    so concrete tools only need to map project arguments to Gradio inputs.
    """

    def __init__(self, spec: ToolSpec, **config: Any):
        super().__init__(spec, **config)
        self.space = config.get("space") or spec.default_model
        self.api_name = config.get("api_name", "")
        self.hf_token = config.get("hf_token") or os.environ.get("HF_TOKEN")
        self._client = None
        self._init_client()

    def _init_client(self) -> None:
        """Initialize the gradio client once and reuse it for later calls."""
        try:
            from gradio_client import Client
        except Exception as e:
            raise RuntimeError("gradio_client not installed. pip install gradio_client") from e
        kwargs = {}
        if self.hf_token:
            kwargs["hf_token"] = self.hf_token
        self._client = Client(self.space, **kwargs)

    def _predict(self, **kwargs: Any) -> Any:
        """Send one Gradio API request and normalize client exceptions."""
        if self._client is None:
            self._init_client()
        try:
            return self._client.predict(**kwargs)
        except Exception as e:
            raise self._tool_error(f"API request error: {type(e).__name__}: {e}") from e


class CosyVoice3Tool(GradioTool):
    """CosyVoice3 zero-shot TTS wrapper backed by the Gradio API."""

    def _mode_value(self, args: Dict[str, Any]) -> str:
        return str(args.get("mode_value") or args.get("mode") or "zero_shot")

    def _instruct_text(self, args: Dict[str, Any]) -> str:
        return str(
            args.get("instruct_text")
            or self.config.get("parameters", {}).get("instruct_text")
            or "You are a helpful assistant. <|endofprompt|>"
        )

    def _ui_lang(self, args: Dict[str, Any]) -> str:
        return str(args.get("ui_lang") or self.config.get("parameters", {}).get("ui_lang") or "Zh")

    def _stream_value(self, args: Dict[str, Any]) -> str:
        stream = args.get("stream")
        if stream is None:
            stream = self.config.get("parameters", {}).get("stream", "false")
        return "true" if str(stream).lower() == "true" else "false"

    def _seed_value(self, args: Dict[str, Any]) -> float:
        seed = args.get("seed", self.config.get("parameters", {}).get("seed", 0))
        try:
            return float(seed)
        except Exception:
            return 0.0

    def _prompt_wav_upload(self, prompt_wav: str):
        from gradio_client import handle_file
        return handle_file(prompt_wav)

    def _prompt_wav_record(self, prompt_wav: str):
        from gradio_client import handle_file
        return handle_file(prompt_wav)

    def run(self, args: Dict[str, Any], output_wav: Optional[str] = None) -> str:
        """Map project-side TTS args to CosyVoice3's `/generate_audio` API."""
        args = dict(args or {})
        started = self._log_start(args, output_wav)

        target_text = args.get("target_text") or args.get("text") or args.get("tts_text")
        if not target_text:
            raise self._tool_error("Missing required argument: target_text/text/tts_text")
        prompt_wav = str(self._require(args, "prompt_wav"))
        prompt_text = str(args.get("prompt_text") or args.get("prompt_transcript") or "")

        result = self._predict(
            tts_text=str(target_text),
            mode_value=self._mode_value(args),
            prompt_text=prompt_text,
            prompt_wav_upload=self._prompt_wav_upload(prompt_wav),
            prompt_wav_record=self._prompt_wav_record(prompt_wav),
            instruct_text=self._instruct_text(args),
            seed=self._seed_value(args),
            stream=self._stream_value(args),
            ui_lang=self._ui_lang(args),
            api_name=self.api_name or "/generate_audio",
        )

        if isinstance(result, (list, tuple)):
            result_path = result[0] if result else ""
        else:
            result_path = result
        final_path = self._materialize_output(str(result_path), output_wav)
        self._log_success(started, final_path)
        return final_path


class ToolLibrary:
    """Config-driven registry that binds ToolSpec records to runtime tool objects."""

    def __init__(self, config_path: Optional[str] = None):
        self.tools: Dict[str, ToolSpec] = {}
        self.config_path = config_path or os.path.join(os.path.dirname(__file__), "config.yaml")
        self._load_from_config(self.config_path)

    def _load_from_config(self, config_path: str) -> None:
        """Load tool definitions from the top-level `tools` section in config.yaml."""
        if not os.path.exists(config_path):
            return
        with open(config_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f) or {}
        for name, tool_config in (config.get("tools") or {}).items():
            provider = tool_config.get("provider")
            spec = ToolSpec(
                name=name,
                task=tool_config.get("task", ""),
                command=tool_config.get("command", ""),
                inputs=list(tool_config.get("inputs", []) or []),
                conda_env=tool_config.get("conda_env", ""),
                notes=tool_config.get("notes", ""),
                provider=provider or "",
                default_model=tool_config.get("default_model", ""),
                parameters=dict(tool_config.get("parameters", {}) or {}),
            )
            spec.runtime = self._build_runtime(spec, tool_config)
            self.tools[name] = spec

    def _build_runtime(self, spec: ToolSpec, tool_config: Dict[str, Any]) -> BaseTool:
        """Select the concrete tool implementation from the provider field."""
        provider = tool_config.get("provider")
        if provider == "gradio":
            return CosyVoice3Tool(spec, **tool_config)
        raise ValueError(f"Unsupported tool provider: {provider}")

    def has(self, name: str) -> bool:
        return name in self.tools

    def get(self, name: str) -> ToolSpec:
        if name not in self.tools:
            raise KeyError(f"Tool {name} not found")
        return self.tools[name]


def run_tool(tool: ToolSpec, args: Dict[str, Any], output_wav: Optional[str] = None) -> str:
    """Compatibility entrypoint that dispatches through the bound runtime object."""
    runtime = getattr(tool, "runtime", None)
    if runtime is None:
        raise RuntimeError(f"Tool '{tool.name}' has no runtime bound in tools_v2")
    return runtime.run(args or {}, output_wav=output_wav)
