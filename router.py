import os
import yaml
from llm import (
    GeminiLLM, OpenaiLLM, NvidiaLLM, HuggingfaceLLM, GradioLLM
)
from utils.runtime_logger import instrument_llm_chat, log_step

_CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.yaml")


def load_llm(name: str):
    log_step(f"Loading LLM config for key={name}")
    with open(_CONFIG_PATH, encoding="utf-8") as f:
        config = yaml.safe_load(f)

    llm_config = config["llms"].get(name)
    if not llm_config:
        raise ValueError(f"LLM '{name}' not found in config.yaml")

    basic_cfg = dict(config.get("basic") or config.get("basic_config") or {})
    llm_params = dict(basic_cfg)
    llm_params.update(llm_config.get("parameters") or {})

    provider = llm_config["provider"]
    api_key = llm_config.get("api_key")
    model = llm_config.get("default_model")
    log_step(f"Creating provider={provider}, model={model}")

    if provider == "openai":
        llm = OpenaiLLM(
            model=model,
            api_key=api_key,
            base_url=llm_config.get("api_url"),
            stream=llm_config.get("stream", False),
            **llm_params,
        )
    elif provider == "google":
        llm = GeminiLLM(model=model, api_key=api_key, **llm_params)
    elif provider == "nvidia":
        llm = NvidiaLLM(
            model=model,
            api_key=api_key,
            base_url=llm_config.get("api_url"),
            **llm_params,
        )
    elif provider == "huggingface":
        llm = HuggingfaceLLM(model=model, **llm_params)
    elif provider == "gradio":
        llm = GradioLLM(model=model, **llm_params)
    else:
        raise ValueError(f"Unsupported provider: {provider}")

    llm = instrument_llm_chat(llm)
    log_step(f"LLM ready: {llm.__class__.__name__}")
    return llm
