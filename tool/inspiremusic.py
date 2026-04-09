from __future__ import annotations

from typing import Any, Dict, Optional

from .base import GradioTool


class InspireMusicTool(GradioTool):
	"""InspireMusic text-to-music wrapper backed by the Gradio t2m endpoint."""

	_ALLOWED_MODEL_NAMES = {
		"InspireMusic-1.5B-Long",
		"InspireMusic-1.5B",
		"InspireMusic-Base",
		"InspireMusic-1.5B-24kHz",
		"InspireMusic-Base-24kHz",
	}
	_ALLOWED_CHORUS = {"intro", "verse", "chorus", "outro"}
	_ALLOWED_SAMPLE_RATE = {"48000", "24000"}

	def _text(self, args: Dict[str, Any]) -> str:
		return str(args.get("text") or args.get("prompt") or "").strip()

	def _model_name(self, args: Dict[str, Any]) -> str:
		value = str(
			args.get("model_name")
			or self.config.get("parameters", {}).get("model_name")
			or "InspireMusic-1.5B-Long"
		).strip()
		if value in self._ALLOWED_MODEL_NAMES:
			return value
		return "InspireMusic-1.5B-Long"

	def _chorus(self, args: Dict[str, Any]) -> str:
		value = str(
			args.get("chorus")
			or self.config.get("parameters", {}).get("chorus")
			or "intro"
		).strip()
		if value in self._ALLOWED_CHORUS:
			return value
		return "intro"

	def _output_sample_rate(self, args: Dict[str, Any]) -> str:
		value = str(
			args.get("output_sample_rate")
			or self.config.get("parameters", {}).get("output_sample_rate")
			or "48000"
		).strip()
		if value in self._ALLOWED_SAMPLE_RATE:
			return value
		return "48000"

	def _max_generate_audio_seconds(self, args: Dict[str, Any]) -> float:
		seconds = args.get(
			"max_generate_audio_seconds",
			args.get(
				"seconds",
				self.config.get("parameters", {}).get("max_generate_audio_seconds", 30),
			),
		)
		try:
			value = float(seconds)
		except Exception:
			return 30.0
		if value <= 0:
			return 30.0
		return value

	def run(self, args: Dict[str, Any], output_wav: Optional[str] = None) -> str:
		"""Call InspireMusic /demo_inspiremusic_t2m and return local output path."""
		args = dict(args or {})

		tool_args = args.get(self.spec.name)
		if isinstance(tool_args, dict):
			args = {k: v for k, v in args.items() if k != self.spec.name}
			args.update(tool_args)

		started = self._log_start(args, output_wav)

		text = self._text(args)
		if not text:
			raise self._tool_error("Missing required argument: text/prompt")

		result = self._predict(
			text=text,
			model_name=self._model_name(args),
			chorus=self._chorus(args),
			output_sample_rate=self._output_sample_rate(args),
			max_generate_audio_seconds=self._max_generate_audio_seconds(args),
			api_name=self.api_name or "/demo_inspiremusic_t2m",
		)

		if isinstance(result, (list, tuple)):
			result_path = str(result[0]) if result else ""
		else:
			result_path = str(result)

		final_path = self._materialize_output(result_path, output_wav)
		self._log_success(started, final_path)
		return final_path


__all__ = ["InspireMusicTool"]
