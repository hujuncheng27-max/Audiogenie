# AudioGenie

## 快速开始

### 1. 基础配置（`basic`）

`config.yaml` 的 `basic:` 字段存放全项目共用的基础参数：

| 字段 | 默认值 | 说明 |
|---|---|---|
| `hf_token` | `""` | HuggingFace Token，访问私有 Space / 上传数据集时必填 |
| `request_max_attempts` | `3` | LLM 请求失败后的最大重试次数（含首次请求） |
| `request_retry_delay_seconds` | `2.0` | 首次重试前的等待秒数；后续重试按指数退避递增（`delay × 2^(n-1)`） |
| `media_upload.method` | `"huggingface"` | 媒体文件上传方式，目前支持 `huggingface` / `dashscope` |
| `media_upload.enabled` | `true` | 是否启用媒体上传（关闭后本地路径直接传给模型） |
| `media_upload.types` | `["videos"]` | 需要上传的媒体类型列表 |

#### 自定义媒体上传
需要继承 `BaseMediaUploader` 类并实现 `upload(file_path: str) -> str` 方法，返回上传后的 URL 地址。用ai即可。

---

### 2. 配置 LLM

将模板复制到项目根目录并编辑：

```bash
cp template/config_template.yaml ./config.yaml
```

`config.yaml` 的 `llms:` 字段下存放所有命名的 LLM 配置项，格式如下：

```yaml
llms:
  <名称>:              # 自定义键名——即 --llm 参数传入的值
    provider: "..."    # 见下方支持的 provider 列表
    api_key: "..."     # API 密钥（本地模型可留空）
    api_url: "..."     # 接口地址（可选，按 provider 而定）
    default_model: "..." # 模型标识符
    parameters:        # 可选的生成参数
      temperature: 0.7
      max_tokens: 2048
```

**支持的 provider：**

| `provider` 值 | 对应类 | 说明 |
|---|---|---|
| `google` | `GeminiLLM` | 需要 `GEMINI_API_KEY` 环境变量或配置中的 `api_key` |
| `openai` | `OpenaiLLM` | 需要 `OPENAI_API_KEY` 或 `api_key`；设置 `api_url` 可对接兼容接口 |
| `nvidia` | `NvidiaLLM` | 需要 `NVIDIA_API_KEY` 或 `api_key` |
| `huggingface` | `HuggingfaceLLM` | 本地运行，`default_model` 为 HuggingFace 模型 ID |
| `gradio` | `GradioLLM` | 连接 Gradio Space，`default_model` 为 Space ID（如 `Qwen/Qwen3.5-Omni-Offline-Demo`） |

**配置示例：**

```yaml
llms:
  google_gemini:
    provider: "google"
    api_key: "AIzaSy..."
    default_model: "gemini-2.5-flash"

  hf-qwen3-vl-8b:
    provider: "huggingface"
    default_model: "Qwen/Qwen3-VL-8B-Instruct"
    parameters:
      device_map: "auto"

  qwen_omni_gradio:
    provider: "gradio"
    default_model: "Qwen/Qwen3.5-Omni-Offline-Demo"
    api_key: ""          # HuggingFace Token，私有 Space 时必填
    parameters:
      temperature: 0.7
      top_p: 0.8
      top_k: 20
```

原理：
经过`router.py`选择对应的类，实例化一个LLM对象。

---

### 配置tool
> [!WARNING] 
> 前tool的配置已完成，最好不需要改动。

---

### 3. 运行

```bash
python run.py \
    --text   "输入提示词" \
    --llm    "<config.yaml 中的名称>" \
    --outdir "输出目录"
```

可参考 `tests/api_tests.sh` 中的示例：

```bash
export CUDA_VISIBLE_DEVICES=0,1

python run.py \
    --text   "诗人带着不甘回忆道：你我年少相逢，都有凌云之志" \
    --llm    "hf-qwen3-vl-8b" \
    --outdir "test_outputs"
```

**`run.py` 全部参数说明：**

| 参数 | 默认值 | 说明 |
|---|---|---|
| `--text` | `None` | 文本提示 / 输入语句 |
| `--image` | `None` | 图片文件路径 |
| `--video` | `None` | 视频文件路径（`.mp4`） |
| `--llm` | `google_gemini` | `config.yaml` 中的 LLM 名称 |
| `--outdir` | `outputs/` | 生成文件的保存目录 |
| `--max_depth` | `3` | 多智能体树的最大递归深度 |
| `--max_siblings` | `1` | 每个节点的最大并行分支数 |
