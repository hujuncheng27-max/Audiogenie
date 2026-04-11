import yaml
from llm import (
    GeminiLLM, OpenaiLLM, NvidiaLLM, HuggingfaceLLM, GradioLLM
)
from utils.runtime_logger import instrument_llm_chat, log_step


def load_llm(name: str):
    log_step(f"Loading LLM config for key={name}")
    with open("config.yaml") as f:
        config = yaml.safe_load(f)

    llm_config = config["llms"].get(name)
    if not llm_config:
        raise ValueError(f"LLM '{name}' not found in config.yaml")

    provider = llm_config["provider"]
    api_key = llm_config.get("api_key")
    model = llm_config.get("default_model")
    log_step(f"Creating provider={provider}, model={model}")

    if provider == "openai":
        llm = OpenaiLLM(model=model, api_key=api_key, base_url=llm_config.get("api_url"))
    elif provider == "google":
        llm = GeminiLLM(model=model, api_key=api_key)
    elif provider == "nvidia":
        llm = NvidiaLLM(model=model, api_key=api_key, base_url=llm_config.get("api_url"))
    elif provider == "huggingface":
        llm = HuggingfaceLLM(model=model, **llm_config.get("parameters", {}))
    elif provider == "gradio":
        llm = GradioLLM(model=model, **llm_config.get("parameters", {}))
    else:
        raise ValueError(f"Unsupported provider: {provider}")

    llm = instrument_llm_chat(llm)
    log_step(f"LLM ready: {llm.__class__.__name__}")
    return llm
