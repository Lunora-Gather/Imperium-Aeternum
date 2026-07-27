# 文档导航

本目录按用途分区保留当前维护资料、设计参考、规划、审查和发布记录。后续工作应先看“当前事实”，历史资料只用于追溯，不应直接作为实施依据。

## 当前事实源

| 文档 | 用途 |
| --- | --- |
| [`../README.md`](../README.md) | 产品定位、运行方式和发布状态 |
| [`maintenance/README.md`](maintenance/README.md) | 当前架构、核心入口、验证命令和改动规则 |
| [`maintenance/ROADMAP.md`](maintenance/ROADMAP.md) | 后续底层、玩法、体验和发布路线 |
| [`maintenance/SHARED-WORLD.md`](maintenance/SHARED-WORLD.md) | 共享版图、国家控制与自动推进的当前设计 |
| [`maintenance/AUTH-AND-SOCIAL.md`](maintenance/AUTH-AND-SOCIAL.md) | 邮箱验证注册、账号反馈、好友与版图聊天体验 |
| [`maintenance/BUG-AUDIT-CHECKLIST.md`](maintenance/BUG-AUDIT-CHECKLIST.md) | 漏洞复现、检查、修复和回归清单 |
| [`maintenance/PROJECT-STRUCTURE.md`](maintenance/PROJECT-STRUCTURE.md) | 当前目录职责、命名规则和依赖方向 |
| [`reference/04-architecture.md`](reference/04-architecture.md) | 引擎与模块的详细历史架构说明 |
| [`reference/formulas.md`](reference/formulas.md) | 数值公式 |
| [`reference/decisions.md`](reference/decisions.md) | 架构与玩法决策记录 |
| [`planning/POST_1_0_BACKLOG.md`](planning/POST_1_0_BACKLOG.md) | 1.0 之后的原始需求池 |

## 目录分区

| 目录 | 内容 | 使用规则 |
| --- | --- | --- |
| [`maintenance/`](maintenance/README.md) | 当前架构、操作边界、路线图和审查清单 | 实施前优先阅读 |
| [`reference/`](reference/README.md) | 规则、公式、数据、架构决策与 UI 设计资产 | 与当前代码交叉核对 |
| [`planning/`](planning/README.md) | 阶段计划、扩展构想、迁移研究和需求池 | 先经路线图重新确认 |
| [`audits/`](audits/README.md) | 历史玩法、体验与架构审查 | 用于追溯问题与验证方法 |
| [`releases/`](releases/README.md) | 发布说明、QA、交付报告和打标记录 | 用于版本追溯 |

## 当前发布资料

- [`releases/release-checklist.md`](releases/release-checklist.md)
- [`releases/release-qa-v1.1.1.md`](releases/release-qa-v1.1.1.md)
- [`releases/release-notes-v1.1.1.md`](releases/release-notes-v1.1.1.md)
- [`releases/TAGGING_CHECKLIST.md`](releases/TAGGING_CHECKLIST.md)
- [`releases/FINAL_QA.md`](releases/FINAL_QA.md)

## 维护原则

- 新增维护结论优先更新 `maintenance/`。
- 需要解释永久架构或玩法决策时，追加 `reference/decisions.md`。
- 尚未排期的构想放入 `planning/`，不要提前创建空源码模块。
- 版本完成后，将 QA 与发布说明放入 `releases/`。
- 不删除仍有玩法、规则或决策价值的历史资料；通过目录和 README 明确其时效性。
