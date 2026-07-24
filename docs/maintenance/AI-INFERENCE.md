# Hugging Face 推理边界

## 当前落点

首个推理功能是元首会谈里的“AI 书记官”。确定性规则仍先计算：

- 是否满足会谈前提与冷却；
- 对方意愿、影响因素与成本；
- 最终会谈结果、协议强度、资源和关系变化。

Hugging Face 只把上述事实整理为对方立场、建议开场、风险和依据。模型输出不得写回 `GameState`，不得成为共享版图命令，也不得覆盖规则结算。

## 架构

`GitHub Pages → Appwrite Function → Hugging Face Inference Providers`

- 浏览器不保存或接触 `HF_TOKEN`。
- Function `ai-diplomacy-gateway` 仅允许已登录用户执行。
- 请求只包含当前会谈所需的最小外交事实，不包含邮箱、聊天、好友或完整存档。
- `ai_usage` 保存散列用户键和每日次数，默认每用户每天 5 次。
- 推理超时、配额耗尽、Token 未配置或响应格式异常时，客户端自动返回规则简报。
- AI 客户端只进入懒加载外交块；总 JS 预算为此登记 8 KiB，外交块另设 34 KiB 硬上限，首屏与 CSS 预算不变。

## Appwrite 变量

变量只配置在 Function，不得使用 `VITE_*`：

```text
HF_TOKEN=<Hugging Face user access token>
HF_MODEL=Qwen/Qwen2.5-7B-Instruct
AI_DAILY_LIMIT=5
```

更新 Function 源码时默认不传 `--with-variables`，避免意外覆盖远端密钥。只有明确需要同步本地 `.env` 时才使用该参数。

## 适合继续扩展的功能

1. 年报叙事摘要：把已经结算的年度差异整理成三段式复盘。
2. 外交来函润色：按国家性格生成措辞，但提案内容仍来自规则模板。
3. 新手顾问问答：仅基于当前可见面板和维护文档回答，不执行操作。
4. 编年史文风：为已发生事件生成可选叙事版本，规范事件仍保留。

暂不允许模型直接承担 AI 国家回合、战争胜负、政策效果、版图结算或存档修复。
