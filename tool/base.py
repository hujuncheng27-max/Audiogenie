from __future__ import annotations

import logging
import os
import shutil
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

log = logging.getLogger(__name__)


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
			kwargs["token"] = self.hf_token
		self._client = Client(self.space, **kwargs)

	def _predict(self, **kwargs: Any) -> Any:
		"""Send one Gradio API request and normalize client exceptions."""
		if self._client is None:
			self._init_client()
		
		return self._client.predict(**kwargs)
		# except Exception as e:
		# 	raise self._tool_error(f"API request error: {type(e).__name__}: {e}") from e


__all__ = ["ToolSpec", "ToolRunError", "BaseTool", "GradioTool"]
