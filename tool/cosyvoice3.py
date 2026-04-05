from __future__ import annotations

from typing import Any, Dict, Optional

from .base import GradioTool


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


__all__ = ["CosyVoice3Tool"]
