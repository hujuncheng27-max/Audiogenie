# Memory-Tree 算法说明

## 旧算法问题

AudioGenie 原始存在bug：（1）原始代码将所有节点（包括 refinement 节点）都直接挂在 root 下，整棵树实际是扁平，refinement 节点没有正确记录自己的前驱节点，导致路径回溯完全失效；（2）每个模型无论表现如何都会耗尽分配的重试次数，且每个新模型会从头开始，不知道前序模型失败的原因；（3）refinement时无论哪个维度失败都用同一种改写方式；（4）最优结果的选择用的是三维得分简单求和，这在配音场景下不合理，因为时空对齐（alignment）的重要性远高于其他两个维度。

Memory Tree 新算法核心改变是引入了一个跨节点、跨模型的历史记忆模块，并用这个记忆模块来驱动搜索决策。此外，添加了3个小修改优化（2）、（3）和（4）问题。

## 新增 tree_memory.py

新增了 `tree_memory.py`，负责在整个音频事件的生成过程中积累并提供历史信息。基本数据单元是 `NodeRecord`，记录一次生成的文本提示、完整参数、三维评分和 MLLM 建议，并通过 `weighted_score` 属性计算加权综合分。

```python
SCORE_WEIGHTS = {"alignment": 0.5, "quality": 0.35, "aesthetics": 0.15}

@dataclass
class NodeRecord:
    node_id: str; model: str; attempt: int; node_type: str
    parent_id: Optional[str]; text_used: str
    scores: Dict[str, float]; suggestions: List[str]

    @property
    def weighted_score(self) -> float:
        return sum(self.scores.get(k, 0.0) * w for k, w in SCORE_WEIGHTS.items())
```

`TreeMemory` 管理所有 `NodeRecord`，核心查询接口是 `to_refinement_context`，它将当前路径历史、全树最优记录和去重建议打包后传给 LLM 作为精化上下文。

```python
def to_refinement_context(self, current_node_id: str) -> Dict[str, Any]:
    return {
        "path_history":    [r.to_dict() for r in self.get_path_history(current_node_id)],
        "global_best":     self.get_best_record().to_dict(),
        "all_suggestions": self.get_all_suggestions(deduplicate=True),
    }
```

## tot.py 中修改内容

**树层级结构修复（对应问题1）：** 原始代码中 `prev_node_id` 始终指向 root，导致每个节点都挂在 root 下，树完全扁平。修复后维护 `prev_node_id` 随循环更新，refinement 节点正确挂在前一个节点下。

```python
# 修复前（每次都用 root）：
node = self._new_node("refinement", parent=root.node_id, ...)

# 修复后：
node = self._new_node(
    "generation" if attempt == 0 else "refinement",
    parent=prev_node_id,   # generation → root, refinement → 前一节点
    ...
)
...
prev_node_id = node.node_id  # 循环末尾更新
```

结果：同一模型的多次尝试形成一条纵向链，`get_path_history` 能完整回溯该模型的探索轨迹。

**加权评分与早停阈值（对应问题4）：** 新增 `_weighted_score` 函数，最优候选选择和早停均改用加权分。alignment 阈值提高至 0.7，quality/aesthetics 降至 0.6。

```python
def _weighted_score(scores):
    return sum(scores.get(k, 0.0) * w for k, w in SCORE_WEIGHTS.items())

def _best_threshold_met(scores):
    return (scores.get("alignment", 0.0) >= 0.7 and
            scores.get("quality",   0.0) >= 0.6 and
            scores.get("aesthetics",0.0) >= 0.6)
```

**记忆驱动的早期模型放弃（和memory一起对应问题2）：** 新增 `_should_abandon_model`，若当前模型连续两次加权分无改善则立即切换，不再耗尽重试预算。

```python
def _should_abandon_model(self, memory, model):
    history = memory.get_model_history(model)
    if len(history) < 2:
        return False
    return history[-1].weighted_score - history[-2].weighted_score <= 0.0
```

新模型开始前，`_prewarm_initial_args` 从 memory 取出全部历史建议，通过 LLM 生成一个规避前序失败模式的初始提示，解决新模型冷启动的问题。

**维度诊断定向（对应问题3）：** `_diagnose_failure` 返回得分最低的维度，`_revise_text_prompt` 新增 `focus` 参数，将对应的定向指令注入 LLM prompt。

```python
def _diagnose_failure(self, scores):
    return min(("alignment", "quality", "aesthetics"),
               key=lambda k: scores.get(k, 0.0))

# 精化时：
failure_dim = self._diagnose_failure(prev_scores)
args = self._revise_text_prompt(model, base_args, event, mem_context, focus=failure_dim)
```

`_revise_text_prompt` 中的 `_FOCUS_HINTS` 字典将维度名映射到具体的 LLM 指令，例如 alignment 对应"FOCUS on temporal precision and semantic match"。

## 新算法运行流程

```
memory ← TreeMemory()

FOR model IN candidates:
    base_args ← deepcopy(event.refined_inputs)
    IF len(memory) > 0:                                      # 跨模型预热
        base_args ← prewarm_initial_args(model, ...)

    FOR attempt IN [0 .. max_tries-1]:
        node ← new_node(parent=prev_node_id)                 # 正确层级
        args ← base_args  if attempt==0
             else revise_text_prompt(..., focus=diagnose_failure(prev_scores))

        wav ← call_model(model, args)
        scores ← {0,0,0}  if wav invalid
               else critic.evaluate(event, wav)

        memory.record(node, scores, suggestions)

        IF weighted_score(scores) > weighted_score(best_scores):
            best_wav, best_scores ← wav, scores
        IF threshold_met(scores): return best_wav, best_scores
        IF should_abandon_model(memory, model): break        # 早期放弃

        prev_node_id ← node.node_id
        prev_scores  ← scores;  base_args ← args

return best_wav, best_scores
```

## 接口兼容

`ToTExecutor.__init__` 和 `run(event, workdir)` 签名完全不变，`agents.py` 无需修改。JSON 输出新增 `nodes._memory` 字段和 `NodeRecord.weighted_score` 字段，均为向后兼容增量。
