# Appwrite 资源

`appwrite.config.json` 是远端资源的唯一声明源；本目录只保存 Function 源码配套资料和可重复使用的初始化数据。

- `../functions/shared-world-gateway/`：加入版图、控制权、权威快照、共享行动和统一年度结算。
- `../functions/social-gateway/`：玩家资料、好友申请、好友私聊、版图频道和图片媒体。
- `../functions/cloud-save-gateway/`：以登录会话确定存档所有者，负责私有存档文件与元数据的原子替换。
- `../functions/account-gateway/`：邮箱 OTP 验证后的受限密码找回。
- `../functions/ai-diplomacy-gateway/`：受限的 Hugging Face 元首会谈简报；只解释规则事实，不参与结算。
- `seeds/living-world-v1.json`：首张共享版图及首批开放国家的初始化数据。

日常发版按变更更新现有 Function。记录当前部署 ID，上传候选代码，确认构建成功后激活，再检查执行状态。1.1.2 涉及 `cloud-save-gateway`、`shared-world-gateway` 和 `social-gateway`。已有版图继续使用原来的数据库行、快照和国家控制权。

新建环境时，按下列顺序初始化资源。

1. `appwrite push tables --all --force`（CLI 误判列类型时停止整表推送，按 `appwrite tables-db` 子命令逐项修复）
2. `appwrite push buckets --all --force`
3. `appwrite push functions --all --force --activate`
4. 新建版图时按 seed 创建 `shared_worlds` 与 `nation_controls` 行。已有快照的版图以快照中的国家 ID 和名称为准，保留现有玩家租约和历史。旧版图中的 `n_79` 是当时生成的国家，不能直接替换成新剧本的 `n_me_persia`。

AI Function 的 `HF_TOKEN` 必须保存为远端 Function 变量。部署普通代码时不要使用 `--with-variables`，详细边界见 [`../docs/maintenance/AI-INFERENCE.md`](../docs/maintenance/AI-INFERENCE.md)。

浏览器只读取获授权的数据并调用 Functions。`cloud_saves`、`nation_controls`、`world_memberships`、`world_commands`、`friendships`、`world_messages`、`direct_messages` 及对应文件桶不允许客户端直接写入。
