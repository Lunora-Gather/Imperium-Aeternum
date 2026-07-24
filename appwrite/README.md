# Appwrite 资源

`appwrite.config.json` 是远端资源的唯一声明源；本目录只保存 Function 源码配套资料和可重复使用的初始化数据。

- `../functions/shared-world-gateway/`：加入版图、控制权、权威快照、共享行动和统一年度结算。
- `../functions/social-gateway/`：玩家资料、好友申请、好友私聊、版图频道和图片媒体。
- `../functions/ai-diplomacy-gateway/`：受限的 Hugging Face 元首会谈简报；只解释规则事实，不参与结算。
- `seeds/living-world-v1.json`：首张共享版图及首批开放国家的初始化数据。

部署顺序：

1. `appwrite push tables --all --force`（CLI 误判列类型时停止整表推送，按 `appwrite tables-db` 子命令逐项修复）
2. `appwrite push buckets --all --force`
3. `appwrite push functions --all --force --activate`
4. 管理员按 seed 创建 `shared_worlds` 与 `nation_controls` 行。

AI Function 的 `HF_TOKEN` 必须保存为远端 Function 变量。部署普通代码时不要使用 `--with-variables`，详细边界见 [`../docs/maintenance/AI-INFERENCE.md`](../docs/maintenance/AI-INFERENCE.md)。

浏览器只读取大厅数据并调用 Functions。`nation_controls`、`world_memberships`、`world_commands`、`friendships`、`world_messages`、`direct_messages` 和媒体桶不允许客户端直接写入。
