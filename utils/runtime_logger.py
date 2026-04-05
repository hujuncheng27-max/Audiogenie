import logging
import os
import sys
import time
from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, Optional

_RESET = "\033[0m"
_STEP_COLOR = "\033[36m"
_LLM_COLOR = "\033[33m"


def _supports_color() -> bool:
    if os.environ.get("NO_COLOR"):
        return False
    return hasattr(sys.stdout, "isatty") and sys.stdout.isatty()


def _colored_prefix(tag: str, color: str) -> str:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    prefix = f"[{now}] [{tag}]"
    if _supports_color():
        return f"{color}{prefix}{_RESET}"
    return prefix


def _logger() -> logging.Logger:
    logger = logging.getLogger("audiogenie")
    if logger.handlers:
        return logger

    level_name = os.environ.get("AUDIOGENIE_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(message)s"))

    logger.setLevel(level)
    logger.addHandler(handler)
    logger.propagate = False
    return logger


def log_step(message: str) -> None:
    _logger().info("%s %s", _colored_prefix("STEP", _STEP_COLOR), message)


def _shorten(text: Any, max_len: int = 220) -> str:
    s = "" if text is None else str(text)
    s = s.replace("\n", "\\n")
    if len(s) <= max_len:
        return s
    return s[: max_len - 3] + "..."


def _media_summary(media: Optional[Dict[str, Any]]) -> str:
    if not media:
        return "none"

    items = []
    for k in ("texts", "images", "videos", "audio"):
        if k not in media or media.get(k) is None:
            continue
        v = media.get(k)
        if isinstance(v, list):
            items.append(f"{k}[{len(v)}]")
        elif isinstance(v, str):
            items.append(f"{k}=path:{_shorten(v, 80)}")
        elif isinstance(v, bytes):
            items.append(f"{k}=bytes:{len(v)}")
        else:
            items.append(f"{k}={type(v).__name__}")
    return ", ".join(items) if items else "none"


def decorate_chat(chat_fn: Callable[..., str], model_label: str) -> Callable[..., str]:
    @wraps(chat_fn)
    def wrapper(*args, **kwargs):
        system = kwargs.get("system")
        user = kwargs.get("user")

        if system is None and len(args) >= 1:
            system = args[0]
        if user is None and len(args) >= 2:
            user = args[1]

        media = kwargs.get("media")

        _logger().info(
            "%s request model=%s system=%s user=%s media=%s",
            _colored_prefix("LLM", _LLM_COLOR),
            model_label,
            _shorten(system, 120),
            _shorten(user, 160),
            _media_summary(media),
        )

        start = time.perf_counter()
        try:
            result = chat_fn(*args, **kwargs)
            elapsed = time.perf_counter() - start
            _logger().info(
                "%s response model=%s elapsed=%.2fs chars=%d body=%s",
                _colored_prefix("LLM", _LLM_COLOR),
                model_label,
                elapsed,
                len(result or ""),
                _shorten(result, 260),
            )
            return result
        except Exception as exc:
            elapsed = time.perf_counter() - start
            _logger().exception(
                "%s error model=%s elapsed=%.2fs error=%s",
                _colored_prefix("LLM", _LLM_COLOR),
                model_label,
                elapsed,
                exc,
            )
            raise

    setattr(wrapper, "_audiogenie_logged", True)
    return wrapper


def instrument_llm_chat(llm_obj: Any) -> Any:
    chat_fn = getattr(llm_obj, "chat", None)
    if chat_fn is None:
        return llm_obj

    if getattr(chat_fn, "_audiogenie_logged", False):
        return llm_obj

    model_name = getattr(llm_obj, "model", llm_obj.__class__.__name__)
    label = f"{llm_obj.__class__.__name__}({model_name})"
    llm_obj.chat = decorate_chat(chat_fn, label)
    return llm_obj
