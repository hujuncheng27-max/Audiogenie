# AudioGenie 项目技术报告

> 生成日期：2026-04-15

---

## 目录

1. [项目概述](#1-项目概述)
2. [整体架构](#2-整体架构)
3. [目录结构](#3-目录结构)
4. [数据模型](#4-数据模型)
5. [三阶段流水线](#5-三阶段流水线)
   - [Stage 1 — 多模态规划](#stage-1--多模态规划)
   - [Stage 2 — 专家分配与精化](#stage-2--专家分配与精化)
   - [Stage 3 — ToT 合成](#stage-3--tot-合成)
6. [核心调度算法：Memory-Tree-of-Thought（M-ToT）](#6-核心调度算法memory-tree-of-thoughtm-tot)
   - [算法动机](#61-算法动机)
   - [数据结构](#62-数据结构)
   - [完整执行流程](#63-完整执行流程)
   - [关键子过程详解](#64-关键子过程详解)
   - [评分体系](#65-评分体系)
   - [算法伪代码](#66-算法伪代码)
   - [算法流程图](#67-算法流程图)
7. [LLM 层](#7-llm-层)
8. [工具层](#8-工具层)
9. [音频混合与输出](#9-音频混合与输出)
10. [质量控制：Critics 体系](#10-质量控制critics-体系)
11. [输出文件说明](#11-输出文件说明)
12. [设计原则与亮点](#12-设计原则与亮点)
13. [完整使用例子](#13-完整使用例子)
    - [场景描述](#131-场景描述)
    - [环境配置](#132-环境配置)
    - [编程调用](#133-编程调用python)
    - [命令行调用](#134-命令行调用)
    - [执行过程与输出](#135-执行过程与输出)
    - [检查结果质量](#136-检查结果质量)
    - [自定义调参](#137-自定义调参)

---

## 1. 项目概述

**AudioGenie**（`audioGnew/`）是一个**无需训练的多智能体音频生成系统**。给定任意组合的文本、图像或视频输入，系统能够：

1. **规划**：分析输入内容，识别所有应当出现的音频事件（语音、音效、音乐、歌曲）；
2. **分配**：将每类音频事件路由到对应的专家 Agent，填充模型候选与精化参数；
3. **合成**：对每个音频事件，通过带 LLM 评审器的 **Memory-Tree-of-Thought（M-ToT）搜索**迭代生成并择优；
4. **混音**：将所有音频片段按时间戳叠加混音，可选地与原始视频合并输出。

系统的核心理念是**一切智能来自冻结的 LLM 推理**——无需对任何模型进行微调，所有决策均在推理时通过多轮 LLM 调用完成。

---

## 2. 整体架构

```
                     ┌──────────────────────────────────────┐
                     │         AudioGenieSystem              │
                     │  ┌─────────────┐  ┌───────────────┐  │
  多模态输入          │  │GenerationTeam│  │SupervisorTeam │  │
  text/image/video ──►  │             │  │               │  │
                     │  │  plan()     │  │ review_plan() │  │
                     │  │  assign_    │  │ get_domain_   │  │
                     │  │  refine()   │  │ critic()      │  │
                     │  │  synthesize │  │ get_eval_     │  │
                     │  │  _with_tot()│  │ critic()      │  │
                     │  └──────┬──────┘  └───────────────┘  │
                     └─────────┼────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
         [LLM Layer]    [Expert Layer]    [Tool Layer]
         llm.py          experts.py       tools_v2.py
         router.py       ├─ SFXExpert     tool/mmaudio.py
                         ├─ SpeechExpert  tool/cosyvoice3.py
                         ├─ MusicExpert   tool/inspiremusic.py
                         └─ SongExpert    tool/diffrhythm.py
                               │
                               ▼
                         [ToT Layer]
                         tot.py
                         tree_memory.py
                         critiquers.py (AudioEvalCritic)
                               │
                               ▼
                         [Mixer Layer]
                         mixer.py
                         → final_mixed_audio.wav
                         → final_video_with_audio.mp4
```

---

## 3. 目录结构

```
audioGnew/
├── run.py                  # CLI 入口
├── config.yaml             # LLM 与工具配置
├── agents.py               # 流水线总控（GenerationTeam, SupervisorTeam, AudioGenieSystem）
├── plan.py                 # 数据模型（Plan, AudioEvent）
├── experts.py              # 领域专家（SFXExpert, SpeechExpert, MusicExpert, SongExpert）
├── tot.py                  # M-ToT 执行器（核心调度算法）
├── tree_memory.py          # 节点记忆存储（TreeMemory, NodeRecord）
├── critiquers.py           # 质量评审器（AudioEvalCritic 等）
├── llm.py                  # LLM 抽象层（Gemini/OpenAI/NVIDIA/HuggingFace/Gradio）
├── router.py               # LLM 工厂（读取 config.yaml 实例化 LLM）
├── mixer.py                # 音频混合与视频合并
├── tools_v2.py             # 工具注册中心（ToolLibrary, run_tool）
├── tool/
│   ├── base.py             # BaseTool, GradioTool, ToolSpec, ToolRunError
│   ├── mmaudio.py          # 音效工具（文本/视频条件）
│   ├── inspiremusic.py     # 音乐生成工具
│   ├── diffrhythm.py       # 歌曲生成工具（LRC 对齐）
│   ├── cosyvoice2.py       # 语音合成工具 v2
│   └── cosyvoice3.py       # 语音合成工具 v3（零样本克隆）
├── utils/
│   ├── runtime_logger.py   # 彩色结构化日志 + LLM/Tool 埋点装饰器
│   ├── media.py            # 视频时长探针（ffprobe / moviepy）
│   └── media_uploader.py   # HuggingFace / DashScope 媒体上传
├── bin/                    # 各工具的独立运行脚本
└── tests/                  # 测试脚本与样本媒体
```

---

## 4. 数据模型

### 4.1 `AudioEvent`（`plan.py`）

原子级音频事件，贯穿整个流水线：

```python
@dataclass
class AudioEvent:
    audio_type: str          # "speech" | "sound_effect" | "music" | "song"
    start_time: float        # 事件起始时间（秒）
    end_time: float          # 事件结束时间（秒）
    description: str         # 对声音内容的文本描述
    volume_db: float         # 混音音量偏移量（如 -10 表示背景音压低）
    object: Optional[str]    # 对象标签（如 "Character 1"、"Footstep"）
    model_candidates: list   # Stage-2 填充的候选模型名称列表
    refined_inputs: dict     # 每个候选模型对应的参数字典，Stage-2 填充
```

`AudioEvent` 还可以在运行时动态附加字段，例如：

| 字段 | 说明 |
|------|------|
| `keep: bool` | SFX 视频探针结果标记为"保留"时为 `True` |
| `keep_wav: str` | 探针生成的 WAV 路径，Stage-3 直接复用 |
| `ref_audio_path: str` | 歌曲专家使用的参考音频路径 |
| `ref_prompt: str` | 歌曲专家使用的风格提示词 |

### 4.2 `Plan`（`plan.py`）

`AudioEvent` 的容器，附带可选的视觉描述字段：

```python
@dataclass
class Plan:
    events: List[AudioEvent]
    visual_caption: Optional[str]  # LLM 对输入画面的文字描述
```

提供 `to_json()` / `from_json()` 双向序列化，`from_json` 可容忍多种 LLM 输出格式（裸列表、`audio_seg` 键、`events` 键）。

---

## 5. 三阶段流水线

`AudioGenieSystem.run()` 是整个系统的顶层入口，依次执行三个阶段：

```
多模态输入
    │
    ▼ Stage 1 ─ plan()
  LLM 分析输入 → Plan（AudioEvent 列表）
  保存 stage1_output.json
    │
    ▼ Stage 2 ─ assign_and_refine()
  SFXExpert / SpeechExpert / MusicExpert / SongExpert
  填充 model_candidates + refined_inputs
  DomainCritic 合规校验
  保存 stage2_output.json
    │
    ▼ Stage 3 ─ synthesize_with_tot()
  对每个 AudioEvent → ToTExecutor.run()
  保存 stage3_output.json
    │
    ▼ mix_and_maybe_mux()
  合并所有 WAV 片段 → final_mixed_audio.wav
  可选：叠加到视频  → final_video_with_audio.mp4
```

### Stage 1 — 多模态规划

**入口**：`GenerationTeam.plan(multimodal_context)`

1. 若输入包含视频，先用 `probe_video_seconds()` 获取总时长，作为约束注入 prompt；
2. 将文本、图片、视频一并送入 LLM（`llm.chat(system, user, media=...)`），要求返回符合预设格式的 JSON 音频事件列表；
3. `_to_canonical_plan_json()` 对 LLM 输出进行鲁棒解析，支持四种格式变体（`audio_seg=...` 赋值式、`{"audio_seg":[...]}` 对象、`{"events":[...]}` 对象、裸列表）；
4. 解析结果构造 `Plan` 对象，写入 `stage1_output.json`；
5. 可选的 `SupervisorTeam.review_plan()` 由 `LLMPlanningReviewer` 对规划结果做二次校验（内容适配、时间对齐、类别纠错），失败则回退到规则化的 `PlanningCritic`（修复负时长等）。

**LLM Prompt 结构**（用户侧 prompt 节选）：

```
Your task is to analyze all given inputs and identify every distinct audio event implied.
For each audio event, determine its audio_type (one of "speech", "sound effect", "music", "song"),
its object, its start and end times, its duration, and a detail description...
[Output Format Example]: audio_seg=[{"audio_type": "Sound effect", "Object": "Footstep", ...}]
```

### Stage 2 — 专家分配与精化

**入口**：`GenerationTeam.assign_and_refine(plan, critics, plan_ctx, outdir)`

按 `audio_type` 将事件分桶，依次交给对应专家处理：

| 桶 | 专家类 | 核心逻辑 |
|----|--------|----------|
| `sfx` | `SFXExpert` | 视频探针 → LLM 决策 KEEP/DISCARD → 填充 MMAudio 参数 |
| `speech` | `SpeechExpert` | LLM 提取话语文本 + 说话人 ID + 音色风格 → 填充 TTS 参数 |
| `music` | `MusicExpert` | LLM 生成音乐描述文本 + 段落类型 → 填充 InspireMusic 参数 |
| `song` | `SongExpert` | LLM 生成 LRC 歌词文件 + 风格提示词 → 填充 DiffRhythm 参数 |

处理完成后，`DomainCritic` 对每个事件做合规检查（确保 `model_candidates` 非空，为空候选补充空 `refined_inputs` 字典），最终按 `start_time` 重排，写入 `stage2_output.json`。

**SFX 视频探针流程**（`SFXExpert.process_batch` 核心逻辑）：

```
1. 有视频输入？
   ├── 是 → 用 MMAudio（视频条件）生成全段音效 probe WAV/MP4
   │        → LLM 看 probe_mp4 与原始 SFX 规划 → KEEP or DISCARD
   │        ├── KEEP → merged_video_event（视频覆盖的 SFX 合并为一条 keep 事件，
   │        │           Stage-3 直接复用 probe_wav，跳过重新生成）
   │        │          + residual_events（屏外/隐式 SFX，走文本生成路径）
   │        └── DISCARD → 所有 SFX 走文本生成路径
   └── 否 → 全部走文本生成路径
```

---

## 6. 核心调度算法：Memory-Tree-of-Thought（M-ToT）

### 6.1 算法动机

单次调用音频生成模型往往无法保证输出质量，尤其在以下场景下易出现偏差：
- 文本提示描述模糊，语义与场景不匹配（alignment 低）；
- 生成模型输出噪声或伪影（quality 低）；
- 风格与场景氛围不符（aesthetics 低）。

M-ToT 的核心思想是：**以 LLM 作为批评者（Critic）驱动搜索**——每次生成后由 LLM 评分，诊断最弱维度，定向改写提示词，并利用跨模型的历史记忆（TreeMemory）避免重复犯同类错误，直到质量满足阈值或搜索资源耗尽。

### 6.2 数据结构

#### `ToTNode`（`tot.py`）

树中的单个节点，记录一次生成尝试：

```python
@dataclass
class ToTNode:
    node_id: str         # 随机 8 位 UUID 前缀
    node_type: str       # "initial" | "generation" | "refinement"
    model: Optional[str] # 使用的模型名称
    output_wav: Optional[str]  # 生成的 WAV 文件路径
    parent: Optional[str]      # 父节点 node_id
    children: List[str]        # 子节点 node_id 列表
    meta: Dict[str, Any]       # 存储参数、分数、建议、运行信息等
```

节点类型说明：

| `node_type` | 含义 |
|-------------|------|
| `"initial"` | 虚根节点，代表事件搜索的起点，不对应具体生成 |
| `"generation"` | 每个模型的第 0 次尝试（使用原始精化参数） |
| `"refinement"` | 第 1+ 次尝试（LLM 改写提示词后的重新生成） |
| `"kept"` | Stage-2 视频探针保留的节点，直接复用，不属于搜索产物 |

#### `NodeRecord`（`tree_memory.py`）

TreeMemory 中持久化的记录单元：

```python
@dataclass
class NodeRecord:
    node_id: str
    model: str
    attempt: int           # 尝试编号（0 = 初次生成）
    node_type: str
    parent_id: Optional[str]
    text_used: str         # 本次实际使用的文本提示词
    args_used: Dict        # 完整的工具调用参数
    scores: Dict[str, float]    # {"quality": ..., "alignment": ..., "aesthetics": ...}
    suggestions: List[str]      # LLM 评审器给出的改进建议
    timestamp: float
```

`NodeRecord` 提供两个计算属性：
- `score_sum`：三维分数之和；
- `weighted_score`：加权分数 `= 0.5×alignment + 0.35×quality + 0.15×aesthetics`。

#### `TreeMemory`（`tree_memory.py`）

每个 `AudioEvent` 独立持有一个 `TreeMemory` 实例，负责跨节点的信息聚合：

| 方法 | 作用 |
|------|------|
| `record(...)` | 记录一次节点生成结果 |
| `get_path_history(node_id)` | 沿父链回溯，返回祖先节点有序列表 |
| `get_model_history(model)` | 返回指定模型的所有尝试记录（按尝试编号排序） |
| `get_all_suggestions(deduplicate=True)` | 汇总所有节点的 LLM 建议，可去重 |
| `get_best_record()` | 返回 `weighted_score` 最高的节点记录 |
| `to_refinement_context(node_id)` | 构建用于 LLM 提示词改写的上下文字典 |
| `to_dict()` | 序列化全部记录，写入 `stage3_output.json` |

`to_refinement_context` 返回：
```python
{
    "path_history":    [NodeRecord.to_dict(), ...],  # 当前节点祖先链
    "global_best":     NodeRecord.to_dict(),          # 全局最优节点
    "all_suggestions": ["建议1", "建议2", ...]        # 去重后的全部建议
}
```

### 6.3 完整执行流程

`ToTExecutor.run(event, workdir)` 的完整执行逻辑如下：

**输入**：
- `event`：包含 `model_candidates` 与 `refined_inputs` 的音频事件字典
- `workdir`：本次事件的工作目录（如 `outputs/event_00/`）

**输出**：
- `(best_wav_path, best_scores, nodes_snapshot)`

**步骤**：

```
1. 快速路径检查
   └── 若 event["keep"] == True 且 keep_wav 存在
       → 直接返回 keep_wav，scores 全 1.0，跳过搜索

2. 创建虚根节点 root（node_type="initial"）

3. 截取候选模型列表 candidates = model_candidates[:max_siblings]
   初始化 TreeMemory memory，best_wav = None，best_scores = {0,0,0}

4. 对每个 model_name in candidates：
   ├── 预热（Pre-warm）
   │   └── 若 memory 非空（之前有模型已尝试过）
   │       → _prewarm_initial_args()：LLM 根据历史建议为当前模型写改良初始提示词
   │
   ├── 循环 tries = 1 + prompt_max_retries 次：
   │   ├── attempt == 0（首次生成）
   │   │   └── args = base_args（直接使用精化参数）
   │   │
   │   ├── attempt >= 1（提示词精化）
   │   │   ├── 诊断最弱维度：failure_dim = argmin(prev_scores)
   │   │   ├── 构建记忆上下文：mem_context = memory.to_refinement_context(prev_node_id)
   │   │   └── 改写提示词：args = _revise_text_prompt(model, base_args, event, mem_context, focus=failure_dim)
   │   │
   │   ├── 调用工具：wav_path = _call_model(model_name, args, out_wav, workdir)
   │   │   └── 封装 ToolRunError 异常，记录 stderr/returncode 等诊断信息
   │   │
   │   ├── 评估：scores, suggestions = AudioEvalCritic.evaluate(event, wav_path, llm)
   │   │   └── wav 不存在 → scores 全 0，suggestion 标注工具失败
   │   │
   │   ├── 记录：memory.record(node_id, model, attempt, ...)
   │   │
   │   ├── 更新全局最优：
   │   │   └── 若 weighted_score(scores) > weighted_score(best_scores)
   │   │       → best_wav = wav_path, best_scores = scores
   │   │
   │   ├── 早停检查：_best_threshold_met(scores)
   │   │   └── alignment >= 0.7 AND quality >= 0.6 AND aesthetics >= 0.6
   │   │       → 立即返回当前 wav 与分数
   │   │
   │   └── 放弃检查：_should_abandon_model(memory, model_name)
   │       └── 连续两次加权分数无提升（delta <= 0）
   │           → break，切换下一候选模型
   │
5. 返回 (best_wav, best_scores, nodes_snapshot + memory.to_dict())
```

### 6.4 关键子过程详解

#### 6.4.1 提示词改写（`_revise_text_prompt`）

只对支持文本提示词改写的模型生效（`MMAudio`、`InspireMusic`、`CosyVoice2`、`DiffRhythm`）。

**触发条件**：`attempt >= 1`

**定向改写机制**：先通过 `_diagnose_failure` 找到分数最低的维度，再将对应的聚焦指令注入 LLM prompt：

```python
_FOCUS_HINTS = {
    "alignment":  "FOCUS on temporal precision and semantic match with the event's described start/end time and object.",
    "quality":    "FOCUS on acoustic clarity, sound fidelity, and richness of audio detail.",
    "aesthetics": "FOCUS on stylistic appropriateness and emotional fit with the scene.",
    "general":    "Improve overall audio quality, alignment, and aesthetic appeal.",
}
```

LLM 收到的上下文包括：
- 当前模型名称与参数；
- 事件的 `audio_type`、`description`、时间戳；
- `memory_context`（祖先链、全局最优、全部建议）；
- 精化焦点指令；
- 四条约束要求（保持结构、尊重时序、避免泛化、从历史中学习）。

LLM 返回 `{"text": "改写后的提示词"}`，仅替换 `args` 中的文本字段（`text`/`prompt`/`ref_prompt`/`tts_text`）。

#### 6.4.2 跨模型预热（`_prewarm_initial_args`）

**触发条件**：`len(memory) > 0`（当前候选模型不是第一个）

在切换到新候选模型时，系统将前序模型积累的所有建议（`memory.get_all_suggestions(deduplicate=True)`）注入 LLM，让其在首次调用该模型之前就写出规避已知缺陷的初始提示词，从而实现跨模型知识迁移。

#### 6.4.3 模型放弃检查（`_should_abandon_model`）

```python
def _should_abandon_model(self, memory: TreeMemory, model: str) -> bool:
    history = memory.get_model_history(model)
    if len(history) < 2:
        return False
    delta = history[-1].weighted_score - history[-2].weighted_score
    return delta <= 0.0
```

若连续两次尝试的加权分数没有提升（`delta <= 0`），视为该模型在当前事件上已达上限，立即切换下一候选。

### 6.5 评分体系

#### 分数维度

| 维度 | 含义 | 权重 |
|------|------|------|
| `alignment` | 音频内容与事件描述、时间戳的语义匹配程度 | **0.50** |
| `quality` | 音频音质、清晰度、细节丰富度 | **0.35** |
| `aesthetics` | 风格与场景情感氛围的契合度 | **0.15** |

**加权分数**：
```
weighted_score = 0.50 × alignment + 0.35 × quality + 0.15 × aesthetics
```

#### 早停阈值

```
alignment >= 0.7  AND  quality >= 0.6  AND  aesthetics >= 0.6
```

满足以上条件立即终止搜索，返回当前最优结果。

#### 评分来源：`AudioEvalCritic.evaluate()`

```
输入：event 字典 + wav_path + llm 实例
  │
  ▼
LLM System Prompt：
  "You are an audio critic. Evaluate the following audio on quality,
   alignment to the described event, and overall aesthetics.
   Return JSON like: {"quality":0.7, "alignment":0.6, "aesthetics":0.5,
                      "suggestions": ["..."]}."
  │
LLM User：event 的 JSON 描述
LLM Media：wav_path（音频文件直接送入多模态 LLM）
  │
  ▼
_parse_response()：
  1. 优先解析 markdown 代码块内的 JSON
  2. 回退到直接 json.loads
  3. 终极回退：正则提取数字 + 逐行收集建议

输出：({"quality":..., "alignment":..., "aesthetics":...}, ["建议1", ...])
```

### 6.6 算法伪代码

```
function M_ToT(event, workdir):
    if event.keep and exists(event.keep_wav):
        return (event.keep_wav, {all=1.0}, {kept_node})

    root = new_node("initial")
    candidates = event.model_candidates[:max_siblings]
    memory = TreeMemory()
    best_wav, best_scores = None, {all=0.0}

    for model in candidates:
        if len(memory) > 0:
            base_args = prewarm(model, base_args, memory.all_suggestions())

        prev_node = root
        prev_scores = {}

        for attempt in range(1 + prompt_max_retries):
            if attempt == 0:
                args = base_args
            else:
                dim = argmin(prev_scores)           // 诊断最弱维度
                ctx = memory.to_refinement_context(prev_node.id)
                args = revise_text_prompt(model, base_args, event, ctx, focus=dim)

            node = new_node("generation" if attempt==0 else "refinement",
                            parent=prev_node)
            wav = call_model(model, args)           // 调用音频工具
            scores, suggestions = llm_eval(event, wav)

            memory.record(node.id, model, attempt, args, scores, suggestions)

            if weighted(scores) > weighted(best_scores):
                best_wav, best_scores = wav, scores

            if threshold_met(scores):               // 早停
                return (wav, scores, snapshot())

            if no_improvement(memory, model):       // 放弃当前模型
                break

            prev_node, prev_scores = node, scores
            base_args = args                        // 将改写后的 args 作为下轮基础

    return (best_wav, best_scores, snapshot())
```

### 6.7 算法流程图

```
┌──────────────────────────────────────────────────────────────────────┐
│                       ToTExecutor.run(event)                         │
│                                                                      │
│  event.keep?  ──是──► 直接返回 keep_wav                             │
│       │否                                                            │
│       ▼                                                              │
│  创建 root 节点（"initial"）                                         │
│  candidates = model_candidates[:max_siblings]                        │
│  memory = TreeMemory()                                               │
│       │                                                              │
│       ▼                                                              │
│  ┌──── for model in candidates ────────────────────────────────┐    │
│  │                                                              │    │
│  │  memory 非空？ ──是──► _prewarm_initial_args()              │    │
│  │       │                  （LLM 写改良初始提示词）            │    │
│  │       ▼                                                      │    │
│  │  ┌── for attempt in range(1 + retries) ──────────────────┐  │    │
│  │  │                                                        │  │    │
│  │  │  attempt==0？ ──是──► args = base_args                │  │    │
│  │  │       │否                                              │  │    │
│  │  │       ▼                                                │  │    │
│  │  │  dim = argmin(prev_scores)    （诊断最弱维度）         │  │    │
│  │  │  ctx = memory.to_refinement_context()                  │  │    │
│  │  │  args = _revise_text_prompt(focus=dim)                 │  │    │
│  │  │                                                        │  │    │
│  │  │  wav = _call_model(model, args)                        │  │    │
│  │  │  scores, suggestions = AudioEvalCritic.evaluate()      │  │    │
│  │  │  memory.record(...)                                    │  │    │
│  │  │                                                        │  │    │
│  │  │  weighted(scores) > best？ ──是──► 更新 best_wav       │  │    │
│  │  │                                                        │  │    │
│  │  │  threshold_met(scores)？ ──是──► ★ 早停返回           │  │    │
│  │  │                                                        │  │    │
│  │  │  no_improvement(memory,model)？──是──► break           │  │    │
│  │  │                                                        │  │    │
│  │  └────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│       │                                                              │
│       ▼                                                              │
│  返回 (best_wav, best_scores, nodes_snapshot + memory)               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. LLM 层

### 7.1 抽象基类（`llm.py`）

所有 LLM 实现继承自 `LLM` 基类，提供：
- 媒体上传配置（HuggingFace / DashScope），用于将音视频文件发送给不支持内联的 API；
- `_run_request_with_retry()`：指数退避重试，最大尝试次数和延迟秒数均来自 `config.yaml`；
- 抽象方法 `chat(system, user, media={...})`。

### 7.2 具体实现

| 类名 | Provider | 特点 |
|------|----------|------|
| `GeminiLLM` | Google Gemini | 使用 `google-genai` SDK；小文件内联，大文件用 Files API；支持音频内联 |
| `OpenaiLLM` | OpenAI / 兼容接口 | 标准 `openai` SDK；支持图片/视频/音频 base64 或 URL；兼容 DashScope/Qwen |
| `NvidiaLLM` | NVIDIA API | 直接 REST；仅支持图片（base64）和文本 |
| `HuggingfaceLLM` | 本地 HuggingFace | 加载 `Qwen3VLForConditionalGeneration`，8-bit 量化 |
| `GradioLLM` | HF Gradio Spaces | 通过 `gradio_client` 调用 Qwen3.5-Omni 等多模态模型 |

### 7.3 `router.py`：`load_llm(name)`

读取 `config.yaml` → 按 `provider` 字段实例化对应类 → 用 `instrument_llm_chat()` 装饰（添加计时/日志埋点）。

---

## 8. 工具层

### 8.1 `ToolLibrary`（`tools_v2.py`）

初始化时读取 `config.yaml` 的 `tools:` 段，为每个工具条目构建 `ToolSpec`（元数据），并按名称匹配绑定对应的 `BaseTool` 子类实现。

### 8.2 `run_tool(tool, args, output_wav)`

统一调用入口，负责解包 `{tool_name: {...}}` 嵌套约定后转发给 `tool.runtime.run(args, output_wav)`。

### 8.3 工具实现（`tool/`）

所有工具继承 `GradioTool`（`tool/base.py`），通过 `gradio_client` 调用 HuggingFace Space：

| 工具类 | Gradio Space | 任务 | 主要输入 | 主要输出 |
|--------|-------------|------|---------|---------|
| `MMAudioTool` | `xscdvfaaqqq/MMAudio` | 音效生成（文本/视频条件） | `prompt`, `video`（可选）, `seconds`, `cfg_strength` | WAV（视频条件时从 MP4 提取） |
| `InspireMusicTool` | `xscdvfaaqqq/InspireMusic` | 背景音乐生成 | `text`, `model_name`, `chorus`, `max_generate_audio_seconds` | WAV（后处理截断到目标时长） |
| `DiffRhythmTool` | `xscdvfaaqqq/DiffRhythm` | 歌曲生成（LRC 对齐） | `lrc`, `ref_audio_path`/`text_prompt`, `Music_Duration` | MP3/WAV（后处理截断） |
| `CosyVoice3Tool` | `FunAudioLLM/Fun-CosyVoice3-0.5B` | TTS（零样本克隆） | `target_text`, `prompt_text`, `prompt_wav` | WAV |
| `CosyVoice2Tool` | 类似 | TTS | `text`, `prompt_transcript`, `prompt_wav`, `instruct_text` | WAV |

所有工具共享 `BaseTool` 辅助方法：`_trim_audio_to_seconds()`（音频截断）、`_materialize_output()`（下载/复制输出文件）、`_trim_wav_in_place()`（就地截断）。

---

## 9. 音频混合与输出

**`mix_and_maybe_mux(video_path, audio_segments, output_audio_path, output_video_path)`**（`mixer.py`）：

1. 对每个片段：加载 WAV → 应用 `volume_db` 偏移 → 计算在混音轨道中的 `start_position_ms`；
2. 创建时长为 `max(end_time)` 的静音 `AudioSegment`；
3. 依次 `overlay()` 叠加每条音轨（pydub）；
4. 导出 `final_mixed_audio.wav`；
5. 若提供了 `video_path`：用 moviepy 将音频嵌入视频，生成 `final_video_with_audio.mp4`。

---

## 10. 质量控制：Critics 体系

| 类 | 类型 | 角色 |
|----|------|------|
| `PlanningCritic` | 规则 | 修复负时长、将 start_time 截断到 ≥ 0 |
| `DomainCritic` | 规则 | 确保每个事件有 `model_candidates`；为空条目补充空 `refined_inputs` |
| `AudioEvalCritic` | LLM | 送入音频文件 + 事件描述 → 返回三维分数 + 改进建议（供 ToT 使用） |
| `LLMPlanningReviewer` | LLM | Stage-1 规划结果的二次审查：内容适配、时序对齐、类别纠错 |

---

## 11. 输出文件说明

| 文件 / 目录 | 描述 |
|------------|------|
| `stage1_output.json` | Stage-1 规划结果（`AudioEvent` 列表） |
| `stage2_output.json` | Stage-2 精化结果（含 `model_candidates` 与 `refined_inputs`） |
| `stage2_sfx_probe/` | SFX 视频探针生成的 WAV/MP4 |
| `stage2_sfx_probe_keep.json` | 被标记为保留的探针结果 |
| `stage2_song_lrc/` | SongExpert 生成的 `.lrc` 歌词文件 |
| `stage3_mix_segments.json` | 最终音频片段元数据（含时间戳、路径、音量） |
| `stage3_output.json` | 完整结果（ToT 节点树 + TreeMemory + 混音信息） |
| `event_NN/` | 每个音频事件的工作目录，存放每次尝试的 WAV |
| `final_mixed_audio.wav` | 最终混合音频输出 |
| `final_video_with_audio.mp4` | 最终视频（仅当有视频输入时生成） |

---

## 12. 设计原则与亮点

### 无需训练（Training-Free）
所有决策智能来自冻结 LLM 的推理能力——规划、分配、提示词改写、质量评估均在推理时通过多轮 LLM 调用实现，无需针对任何音频任务进行微调。

### 多智能体协作
系统采用分工明确的多 Agent 架构：`GenerationTeam`（生成）、`SupervisorTeam`（监督）、4 类领域专家（SFX/Speech/Music/Song），各自持有领域特定的 LLM Prompt 策略与工具路由逻辑。

### Memory-Tree-of-Thought 搜索
M-ToT 是本系统的核心创新：通过 `TreeMemory` 实现跨节点、跨模型的历史感知，结合定向维度诊断（`_diagnose_failure`）与焦点式提示词改写（`_revise_text_prompt`），在有限的搜索预算内高效逼近质量阈值。与标准 ToT 的区别在于引入了**全局记忆池**，使不同模型候选之间能共享和继承改进经验。

### 多模态感知
支持文本、图像、视频混合输入；SFX 生成支持视频条件（MMAudio），在保留视觉同步的前提下自动决策是否复用探针结果。

### 提供商无关设计
所有 LLM 和工具均隐藏在统一接口后，通过 `config.yaml` 进行配置，可在不修改代码的情况下切换模型提供商（Google、OpenAI、NVIDIA、本地模型等）。

---

## 13. 完整使用例子

### 13.1 场景描述

**任务**：生成一个 10 秒的视频配音，场景为"森林中的两个人对话，伴有鸟叫声和背景音乐"。

**输入信息**：
- **视频**：`forest_scene.mp4`（10 秒，显示两个人坐在森林中说话）
- **文本描述**：`"A dialog between two people in a forest with bird sounds and ambient music"`
- **预期输出**：MP4 视频 + 合成音轨

### 13.2 环境配置

**第 1 步**：准备 `config.yaml`，配置 LLM 和音频工具

```yaml
basic:
  hf_token: "hf_xxxxxxxxxxxxxxxxxxxxxxxx"
  request_max_attempts: 3
  request_retry_delay_seconds: 2.0
  media_upload:
    method: huggingface
    enabled: true

llms:
  google_gemini:
    provider: "google"
    api_key: "AIzaSy_xxxxxxxxxxxxxxxxxxxxxxxx"
    default_model: "gemini-1.5-pro"
    parameters:
      temperature: 0.2
      max_tokens: 4096

tools:
  # 音效生成（文本/视频条件）
  mmaudio:
    provider: "gradio"
    task: "sound_effect"
    space: "xscdvfaaqqq/MMAudio"
    api_name: "/generate_audio"
    inputs:
      - prompt
      - video
      - seconds
    parameters:
      cfg_strength: 7.5

  # 语音合成（零样本克隆）
  cosyvoice3_online:
    provider: "gradio"
    task: "tts"
    space: "FunAudioLLM/Fun-CosyVoice3-0.5B"
    api_name: "/generate_audio"
    inputs:
      - target_text
      - prompt_transcript
      - prompt_wav
    parameters:
      mode_value: "zero_shot"

  # 背景音乐生成
  inspiremusic:
    provider: "gradio"
    task: "music"
    space: "xscdvfaaqqq/InspireMusic"
    api_name: "/generate"
    inputs:
      - text
      - model_name
    parameters:
      chorus: 1
      max_generate_audio_seconds: 20
```

**第 2 步**：安装依赖

```bash
pip install -r requirements.txt
```

### 13.3 编程调用（Python）

```python
from router import load_llm
from agents import AudioGenieSystem
import os

# 配置 API 密钥（从环境变量或直接赋值）
os.environ['GEMINI_API_KEY'] = 'AIzaSy_xxxxxxxxxxxxxxxxxxxxxxxx'

# 加载 LLM
llm = load_llm('google_gemini')

# 创建系统实例
system = AudioGenieSystem(llm=llm, outdir='/path/to/outputs')

# 准备多模态输入
context = {
    "text": "A dialog between two people in a forest with bird sounds and ambient music",
    "video": "/path/to/forest_scene.mp4"
}

# 执行完整流水线
result = system.run(
    context,
    max_depth=3,      # M-ToT 最大自动改写轮数
    max_siblings=2    # 每事件最多尝试的模型数
)
```

### 13.4 命令行调用

```bash
python run.py \
  --text "A dialog between two people in a forest with bird sounds and ambient music" \
  --video /path/to/forest_scene.mp4 \
  --outdir /path/to/outputs \
  --llm google_gemini \
  --max_depth 3 \
  --max_siblings 2
```

### 13.5 执行过程与输出

#### Stage 1：规划（Multimodal Planning）

**LLM 输入**：
- 文本 + 视频文件
- System Prompt 指导 LLM 识别所有音频事件

**LLM 可能输出**（伪代码）：
```json
{
  "events": [
    {
      "audio_type": "speech",
      "object": "Person 1",
      "start_time": 1.0,
      "end_time": 3.2,
      "description": "First person says: 'Look at the beautiful forest, listen to the birds singing.'",
      "volume_db": 0.0
    },
    {
      "audio_type": "speech",
      "object": "Person 2",
      "start_time": 3.5,
      "end_time": 5.8,
      "description": "Second person replies: 'Yes, it's so peaceful and serene here.'",
      "volume_db": 0.0
    },
    {
      "audio_type": "sound_effect",
      "object": "Bird Sounds",
      "start_time": 0.0,
      "end_time": 10.0,
      "description": "Natural ambient bird chirping in a dense forest, mixed with rustling leaves.",
      "volume_db": -8.0
    },
    {
      "audio_type": "music",
      "object": "Ambient Music",
      "start_time": 0.0,
      "end_time": 10.0,
      "description": "Soft, calm acoustic ambient music underscore for forest ambiance.",
      "volume_db": -12.0
    }
  ]
}
```

**输出文件**：`stage1_output.json`

#### Stage 2：专家分配与精化（Expert Refinement）

系统按 `audio_type` 分桶：

| 事件类型 | 专家 | 处理结果 |
|---------|------|---------|
| `speech` (×2) | `SpeechExpert` | LLM 提取话语 + 说话人 ID → 填充 CosyVoice3 参数 |
| `sound_effect` | `SFXExpert` | 有视频 → MMAudio 生成 probe_mp4 → LLM 决策 KEEP/DISCARD → 确定是否复用 |
| `music` | `MusicExpert` | LLM 生成音乐描述 → 填充 InspireMusic 参数 |

**SFXExpert 预处理示例**：

```
1. 用 MMAudio（视频条件）生成全段探针：
   - 输入：forest_scene.mp4 + prompt="Natural ambient bird chirping in a dense forest"
   - 输出：probe_bird_sounds.wav 或 probe_bird_sounds.mp4

2. LLM 看视频 + probe_mp4：
   - "这个音效探针与原视频是否匹配？如果匹配，我们可以在 Stage 3 直接复用它，避免重复生成。"
   - LLM 可能回复：KEEP（这个探针很好，复用它）
   - 则 SFX 事件被标记 keep=True + keep_wav=probe_bird_sounds.wav

3. 若 LLM 回复 DISCARD：
   - 则 SFX 事件走文本生成路径，Stage 3 调用 MMAudio 生成

4. 最终 model_candidates 和 refined_inputs 填充：
   {
     "audio_type": "sound_effect",
     "model_candidates": ["mmaudio"],
     "refined_inputs": {
       "mmaudio": {
         "prompt": "Natural ambient bird chirping in a dense forest, mixed with rustling leaves.",
         "seconds": 10.0,
         "cfg_strength": 7.5
       }
     },
     "keep": True,
     "keep_wav": "stage2_sfx_probe/probe_bird_sounds.wav"
   }
```

**SpeechExpert 处理**：

```
Person 1 speech 事件：
  LLM 提取的参数 →
  {
    "model_candidates": ["cosyvoice3_online"],
    "refined_inputs": {
      "cosyvoice3_online": {
        "target_text": "Look at the beautiful forest, listen to the birds singing.",
        "mode_value": "zero_shot"
        // prompt_wav 若有参考可提供
      }
    }
  }
```

**输出文件**：`stage2_output.json`、`stage2_sfx_probe/probe_bird_sounds.wav`

#### Stage 3：M-ToT 合成与选优（ToT Search + Synthesis）

对每个事件调用 `ToTExecutor.run()`：

**Event: Bird Sounds**

```
1. 快速路径：keep == True
   → 直接返回 keep_wav = stage2_sfx_probe/probe_bird_sounds.wav
   → 跳过 M-ToT 搜索

2. 评估 keep_wav：
   AudioEvalCritic 给与 (alignment=0.8, quality=0.75, aesthetics=0.8)
   → 加权分数 = 0.5×0.8 + 0.35×0.75 + 0.15×0.8 = 0.7825

3. 若评分满足阈值，直接返回并记录
```

**Event: Person 1 Speech**

```
1. 非 keep 事件，启动 M-ToT 搜索
2. candidates = ["cosyvoice3_online"]，max_retries = 2

尝试 1（attempt=0）：
  - model = cosyvoice3_online
  - args = 从 refined_inputs 取：{"target_text": "Look at the beautiful forest...", "mode_value": "zero_shot"}
  - 调用工具生成 output_1.wav
  - 评估得分：alignment=0.68, quality=0.72, aesthetics=0.65 → 加权分数=0.6910
  - 未达早停阈值

尝试 2（attempt=1，单模型重试）：
  - LLM 诊断最弱维度：alignment（0.68 最低）
  - 改写建议：提高文本与时间戳的精确度
  - 改写 prompt："A person in a forest environment warmly says within 2.2 seconds: 
                  Look at the beautiful forest, listen to the birds singing."
  - 重新调用 cosyvoice3_online → output_2.wav
  - 评估得分：alignment=0.75, quality=0.73, aesthetics=0.68 → 加权分数=0.7169
  - 仍未达阈值但有改进，继续

尝试 3（attempt=2）：
  - 诊断最弱维度：aesthetics（0.68）
  - 改写建议：调整音色风格使其更匹配角色气质和场景
  - 改写 prompt："...使用温暖、自然的男性音色，带有对自然的敬畏感..."
  - 重新调用 → output_3.wav
  - 评估得分：alignment=0.76, quality=0.74, aesthetics=0.72 → 加权分数=0.7420
  - alignment >= 0.7 ✓, quality >= 0.6 ✓, aesthetics >= 0.6 ✓ → 触发早停！
  - 返回 output_3.wav 作为最优结果

TreeMemory 记录（用于后续事件参考）：
  [
    NodeRecord(node_id="abc123", model="cosyvoice3_online", attempt=0, 
               weighted_score=0.6910, suggestions=["..."]),
    NodeRecord(node_id="def456", model="cosyvoice3_online", attempt=1,
               weighted_score=0.7169, suggestions=["..."]),
    NodeRecord(node_id="ghi789", model="cosyvoice3_online", attempt=2,
               weighted_score=0.7420, suggestions=["..."])
  ]
```

**Event: Person 2 Speech**

```
1. 同样启动 M-ToT
2. TreeMemory 已有 Person 1 的经验（suggestions 包括"温暖、自然的男性音色"等）
3. 预热：LLM 根据之前的建议预先改写初始 prompt 为 Person 2 版本
   → 初始 prompt 已经更优质，可能第 1 次尝试就达到阈值
```

**Event: Ambient Music**

```
1. model_candidates = ["inspiremusic"]
2. Attempt 1：生成 music_1.wav，评分 0.7 → 达阈值，返回
```

**输出文件**：
- `event_00` 目录：Bird Sounds 处理结果（若不复用 keep）
- `event_01` 目录：Person 1 Speech 处理结果（output_3.wav 最优）
- `event_02` 目录：Person 2 Speech 处理结果
- `event_03` 目录：Ambient Music 处理结果
- `stage3_output.json`：完整 ToT 树与所有节点分别评分

#### Stage 4：混音与视频合并

```
1. 从 stage3_output.json 读取各事件的最优 WAV 路径和时间戳
2. 加载所有 WAV：
   - Bird Sounds [0.0-10.0s] @ -8dB
   - Person 1 [1.0-3.2s] @ 0dB
   - Person 2 [3.5-5.8s] @ 0dB
   - Ambient Music [0.0-10.0s] @ -12dB

3. 构建混音轨道（10 秒总长）
   - Person 1 从 1.0s 位置叠加
   - Person 2 从 3.5s 位置叠加
   - Bird Sounds 全程 -8dB 背景
   - Ambient Music 全程 -12dB 底层

4. 导出 final_mixed_audio.wav

5. 用 moviepy 将音轨嵌入原始视频：
   - 输入：forest_scene.mp4 + final_mixed_audio.wav
   - 输出：final_video_with_audio.mp4
```

**最终输出文件**：

```
outputs/
├── stage1_output.json              # 规划结果
├── stage2_output.json              # 精化结果
├── stage2_sfx_probe/
│   └── probe_bird_sounds.wav       # SFX 视频探针
├── stage3_output.json              # ToT 完整记录
├── stage3_mix_segments.json        # 混音元数据
├── event_00/
│   └── ...                         # 若不复用 keep，则有探索轨迹
├── event_01/
│   ├── output_1.wav
│   ├── output_2.wav
│   ├── output_3.wav                # ⭐ 最优
│   └── tree_memory.json            # 搜索树
├── event_02/
│   ├── output_1.wav                # ⭐ 已达阈值
│   └── tree_memory.json
├── event_03/
│   ├── music_1.wav                 # ⭐ 最优
│   └── tree_memory.json
├── final_mixed_audio.wav           # 🎵 混合后的纯音频
└── final_video_with_audio.mp4      # 🎬 最终视频（包含合成音轨）
```

### 13.6 检查结果质量

可以手动侦查 `stage3_output.json` 中的所有事件评分：

```python
import json

with open('outputs/stage3_output.json') as f:
    result = json.load(f)

# 查看各事件最优分数
for event_idx, event in enumerate(result.get('events', [])):
    best_record = event.get('best_record', {})
    scores = best_record.get('scores', {})
    print(f"Event {event_idx}: alignment={scores.get('alignment', 0):.3f}, "
          f"quality={scores.get('quality', 0):.3f}, "
          f"aesthetics={scores.get('aesthetics', 0):.3f}")
```

**预期输出示例**：
```
Event 0: alignment=0.800, quality=0.750, aesthetics=0.800
Event 1: alignment=0.760, quality=0.740, aesthetics=0.720
Event 2: alignment=0.780, quality=0.750, aesthetics=0.730
Event 3: alignment=0.700, quality=0.680, aesthetics=0.780
```

所有事件均满足早停条件 → 搜索高效收敛。

### 13.7 自定义调参

若需要调整搜索策略，可修改 `run.py` 或直接在 Python 中传参：

```python
# 更激进的搜索（多尝试、多模型）
result = system.run(context, max_depth=5, max_siblings=3)

# 保守的搜索（快速返回）
result = system.run(context, max_depth=1, max_siblings=1)
```

参数含义：
- `max_depth`：M-ToT 每个事件的最大自动改写轮数（越大搜索越深）
- `max_siblings`：每个事件最多尝试的模型数（越大覆盖越广）
