# AudioGenie 公网部署文档

## 目录

1. [项目架构概览](#1-项目架构概览)
2. [技术栈说明](#2-技术栈说明)
3. [部署平台：Fly.io](#3-部署平台flyio)
4. [服务器是否一直运行？](#4-服务器是否一直运行)
5. [如何启动和关闭服务器](#5-如何启动和关闭服务器)
6. [Fly.io 计费说明](#6-flyio-计费说明)
7. [日常运维命令速查](#7-日常运维命令速查)
8. [更新部署流程](#8-更新部署流程)
9. [环境变量与 Secrets 管理](#9-环境变量与-secrets-管理)
10. [常见问题排查](#10-常见问题排查)

---

## 1. 项目架构概览

```
用户浏览器
    │
    │ HTTPS (443)
    ▼
Fly.io 反向代理（TLS 终止）
    │
    │ HTTP (8080)
    ▼
┌─────────────────────────────────────────┐
│         Fly.io Machine (sin 新加坡)      │
│                                         │
│  FastAPI + Uvicorn (port 8080)          │
│  ├── 静态文件服务：React 前端 (dist/)   │
│  ├── API 路由：/upload, /generations    │
│  └── 后台线程：多智能体 pipeline        │
│                                         │
│  持久化 Volume (/data, 10GB)            │
│  ├── audiogenie.db  (SQLite)            │
│  ├── uploads/       (上传的视频/图像)   │
│  └── outputs/       (生成的音频)        │
└─────────────────────────────────────────┘
    │                    │
    │ Gradio API         │ LLM API
    ▼                    ▼
HuggingFace Spaces    Kimi / Gemini / OpenAI
(MMAudio, InspireMusic,
 DiffRhythm, CosyVoice3)
```

**关键设计决策：前后端合并为单一服务**

- React 前端在 Docker 构建阶段编译为静态文件（`dist/`），由 FastAPI 直接托管
- 所有 API 请求使用相对路径（`/generations`、`/upload/video`），无需跨域配置
- 重型 ML 推理（音频生成）运行在 HuggingFace Spaces（外部 GPU 服务器），Fly.io 机器只做协调调度

---

## 2. 技术栈说明

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 5 | 类型安全 |
| Vite | 6 | 构建工具，编译为静态 `dist/` |
| Tailwind CSS | v4 | 样式 |

构建时 `VITE_API_BASE_URL=""` 被烤入 JS bundle，使前端使用相对路径请求同域 API。

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11 | 运行时 |
| FastAPI | 0.109 | Web 框架 + API |
| Uvicorn | 0.27 | ASGI 服务器 |
| SQLite | 内置 | 任务状态存储（单文件数据库） |
| Pydantic | v2 | 请求/响应数据验证 |

### 多智能体 Pipeline

| 组件 | 说明 |
|------|------|
| Kimi K2.5 | 主 LLM，负责 Stage-1 规划（解析输入 → 生成音频事件列表） |
| Gradio Client | 调用 HuggingFace Spaces 上的音频生成模型 |
| MMAudio | SFX / 环境音生成 |
| InspireMusic | 背景音乐生成 |
| DiffRhythm | 节奏型音乐生成 |
| CosyVoice3 | TTS 语音合成（需参考音频） |
| Tree-of-Thought (ToT) | Stage-3 多候选生成 + 评分筛选 |
| moviepy / pydub | 最终混音与合成 |

### 部署基础设施

| 技术 | 用途 |
|------|------|
| Docker（多阶段构建） | 标准化构建环境 |
| Fly.io | 云主机平台（新加坡区域） |
| Fly.io Volume | 持久化存储（SQLite + 文件） |

---

## 3. 部署平台：Fly.io

### 为什么选 Fly.io

| 需求 | Fly.io 的解决方案 |
|------|-----------------|
| 后台任务运行时间不定（可能 10-30 分钟） | 后台线程不受 HTTP 超时影响，机器设置为永不自动停机 |
| 需要持久化存储（数据库 + 音频文件） | Fly Volume（加密持久化块存储） |
| 费用低，学生演示场景 | 免费额度足够低频使用 |
| 无需自定义域名 | 自动分配 `*.fly.dev` 子域名 + HTTPS |
| 地理位置靠近 NUS | 新加坡（sin）区域 |

### 当前部署信息

| 项目 | 值 |
|------|----|
| 应用名称 | `audiogenie-demo` |
| 访问地址 | https://audiogenie-demo.fly.dev |
| 区域 | `sin`（新加坡） |
| Machine ID | `78139e4a507d98` |
| 规格 | 1 shared CPU，1GB RAM |
| 持久化 Volume | `audiogenie_data`，10GB，挂载于 `/data` |

### Docker 构建流程（三阶段）

```
Stage 1: frontend-builder (Node 20-slim)
  └── npm ci && npm run build
  └── 输出: dist/（React 静态文件）

Stage 2: py-builder (Python 3.11-slim)
  └── 安装所有 Python 依赖

Stage 3: runtime (Python 3.11-slim)
  ├── 复制 dist/（前端）
  ├── 复制所有 Python 源码
  ├── 安装 ffmpeg（混音依赖）
  └── CMD: uvicorn backend.app.main:app --host 0.0.0.0 --port 8080 --workers 1
```

---

## 4. 服务器是否一直运行？

**是的，服务器 7×24 小时持续运行，完全独立于你的本地终端。**

### 为什么关闭终端不会影响服务？

Fly.io 是云平台，机器运行在 Fly.io 的数据中心（新加坡），不依赖你的电脑。你的 `fly deploy` 命令只是把代码打包上传，上传完成后本地终端可以随时关闭。

### 为什么设置为永不自动停机？

在 `fly.toml` 中：
```toml
[http_service]
  auto_stop_machines  = false   # 永不因空闲而停机
  auto_start_machines = true
  min_machines_running = 1      # 始终保持至少 1 台运行
```

**原因：** 多智能体 pipeline 需要 10-30 分钟运行，如果 Fly.io 因"空闲"停机（默认行为），正在进行的生成任务会被直接杀掉，导致静默失败。因此关闭了自动停机。

### 数据持久化

Volume 挂载在 `/data`，`fly deploy` 或机器重启**不会**删除数据：

```
/data/audiogenie.db    ← 任务历史记录（SQLite）
/data/uploads/         ← 用户上传的视频/图像
/data/outputs/         ← 生成的音频文件
```

---

## 5. 如何启动和关闭服务器

> **注意：** `fly` 命令在 Windows PowerShell 中需要用完整路径 `~\.fly\bin\fly.exe`，或者将 `~\.fly\bin\` 加入 PATH 环境变量。以下命令均假设已加入 PATH；若未加入，把 `fly` 替换为 `~\.fly\bin\fly.exe`。

### 查看当前状态

```powershell
fly status
```

输出示例：
```
App
 Name     │ audiogenie-demo
 Hostname  │ audiogenie-demo.fly.dev

Machines
 PROCESS │ ID             │ STATE   │ REGION
 app     │ 78139e4a507d98 │ started │ sin
```

`started` 表示运行中，`stopped` 表示已停止。

### 停止服务器（节省费用）

```powershell
fly machine stop 78139e4a507d98
```

停止后 Machine 处于 `stopped` 状态，**不会计费**（Fly.io 按运行时长计费，停止即停止计费）。Volume 存储费用仍然计算（约 $0.15/GB/月）。

### 启动服务器

```powershell
fly machine start 78139e4a507d98
```

启动约需 5-10 秒，启动后即可访问 https://audiogenie-demo.fly.dev。

### 重启服务器（代码没变，只是重置进程）

```powershell
fly machine restart 78139e4a507d98
```

### 查看实时日志

```powershell
fly logs
```

按 `Ctrl+C` 退出日志流（不会影响服务器运行）。

### 查看历史日志（不实时跟踪）

```powershell
fly logs --no-tail
```

---

## 6. Fly.io 计费说明

### 为什么你目前没看到扣费？

Fly.io 有**免费额度**，每月包含：

| 资源 | 免费额度 |
|------|---------|
| shared-CPU-1x 机器运行时长 | **每月 2340 小时**（约 3 台机器 × 720 小时，足够 1 台 7×24 运行整月） |
| 出站流量 | 100 GB/月 |
| Volume 存储 | 3 GB |
| IPv4 地址 | 3 个（共享 IP） |

**你当前的配置（1 台 shared-1x-1gb 机器）完全在免费额度内**，所以没有扣费。

### 超出免费额度后的计费标准

| 资源 | 价格 |
|------|------|
| shared-CPU-1x，1GB RAM | ~$5.70/月（如果连续运行整月） |
| 额外 Volume 存储 | $0.15/GB/月 |
| 超出的出站流量 | $0.02/GB |

当前 10GB Volume 中，3GB 免费，超出的 7GB = **$1.05/月**。

> **实际预期费用：$0 - $2/月**（演示场景下流量极低，机器在免费额度内）

### 查看当前用量

```powershell
fly billing show
```

### 绑定信用卡的原因

Fly.io 要求绑卡才能使用完整功能（包括关闭 5 分钟 Trial 限制）。绑卡后若不超出免费额度，**不会产生实际扣费**。可以在 https://fly.io/dashboard/billing 随时查看账单。

---

## 7. 日常运维命令速查

```powershell
# ── 查看状态 ──────────────────────────────────
fly status                          # 查看 app 和机器状态
fly machine list                    # 列出所有机器
fly volumes list                    # 列出持久化 Volume

# ── 启停机器 ──────────────────────────────────
fly machine stop 78139e4a507d98     # 停止（停止计费）
fly machine start 78139e4a507d98    # 启动
fly machine restart 78139e4a507d98  # 重启

# ── 日志 ──────────────────────────────────────
fly logs                            # 实时日志（Ctrl+C 退出）
fly logs --no-tail                  # 历史日志快照

# ── Secrets（API Keys）──────────────────────────
fly secrets list                    # 查看已设置的 secret 名称（不显示值）
fly secrets set KEY="value"         # 设置/更新 secret（自动触发机器重启）
fly secrets unset KEY               # 删除 secret

# ── 部署 ──────────────────────────────────────
fly deploy                          # 重新构建并部署（代码有改动时用）
fly deploy --no-cache               # 强制不使用构建缓存

# ── 计费 ──────────────────────────────────────
fly billing show                    # 查看当前月账单

# ── SSH 进入容器（调试用）────────────────────
fly ssh console                     # 进入运行中的容器 shell
fly ssh console -C "ls /data/"      # 执行单条命令后退出
```

---

## 8. 更新部署流程

每次修改代码后，只需运行：

```powershell
cd D:\HuaweiMoveData\Users\h\Desktop\CS5260\Audiogenie
~\.fly\bin\fly.exe deploy
```

`fly deploy` 会自动完成以下步骤：
1. 在本地用 Docker 三阶段构建新镜像（前端编译 + Python 打包）
2. 把镜像推送到 Fly.io 镜像仓库
3. 用滚动更新（rolling update）替换旧机器，**零停机**
4. 健康检查通过后完成部署

**注意：** 每次 `fly deploy` 都会重新编译前端（`npm run build`），无需手动 `npm run build`。

---

## 9. 环境变量与 Secrets 管理

### 非敏感配置（存于 fly.toml，可提交 git）

```toml
[env]
  DATABASE_PATH = "/data/audiogenie.db"
  UPLOAD_DIR    = "/data/uploads"
  OUTPUT_DIR    = "/data/outputs"
```

### 敏感配置（Fly.io Secrets，不存于代码）

| Secret 名称 | 用途 |
|-------------|------|
| `KIMI_API_KEY` | Kimi K2.5 LLM API key |
| `HF_TOKEN` | HuggingFace Token（访问 Gradio Spaces） |
| `OPENAI_API_KEY` | OpenAI API key（如使用） |
| `GEMINI_API_KEY` | Google Gemini API key（如使用） |
| `NVIDIA_API_KEY` | NVIDIA API key（如使用） |
| `DASHSCOPE_API_KEY` | 阿里云 DashScope key（如使用） |

设置或更新 Secret：
```powershell
~\.fly\bin\fly.exe secrets set KIMI_API_KEY="sk-你的key"
~\.fly\bin\fly.exe secrets set HF_TOKEN="hf_你的token"
```

`config.yaml` 中使用 `${KIMI_API_KEY}` 占位符，运行时从环境变量自动读取，**API key 永远不会硬编码进代码或 Docker 镜像**。

---

## 10. 常见问题排查

### 访问 https://audiogenie-demo.fly.dev 显示 502/503

机器可能停止了，运行：
```powershell
fly machine start 78139e4a507d98
```

### 生成任务一直转圈不完成

查看日志找原因：
```powershell
fly logs --no-tail | Select-String "error|Error|failed"
```

常见原因：
- `exceeded your free GPU quota`：HuggingFace 免费 GPU 配额耗尽，等到次日 UTC 00:00（北京时间 08:00）重置
- `KIMI_API_KEY` 无效：重新设置 `fly secrets set KIMI_API_KEY="新key"`

### Export 下载没反应

确认浏览器没有拦截弹窗。也可直接在浏览器地址栏访问下载链接：
```
https://audiogenie-demo.fly.dev/generations/{job_id}/export/download?format=WAV&sample_rate=48+kHz&bit_depth=24+bit&channels=Stereo
```

### 想查看服务器上的数据库内容

```powershell
fly ssh console -C "sqlite3 /data/audiogenie.db 'SELECT id, status, stage FROM generations ORDER BY created_at DESC LIMIT 10;'"
```

### 部署后前端显示旧版本

强制刷新浏览器缓存：`Ctrl+Shift+R`（Windows）或 `Cmd+Shift+R`（Mac）。

---

*文档最后更新：2026-04-13*
*部署环境：Fly.io Singapore (sin)，audiogenie-demo.fly.dev*
