from __future__ import annotations

import os
from typing import Any, Dict, Optional

import yaml

from tool.base import BaseTool, ToolSpec
from tool.cosyvoice3 import CosyVoice3Tool


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


__all__ = ["ToolLibrary", "run_tool", "ToolSpec"]
