# Appwrite 资源

`appwrite.config.json` 是远端资源的唯一声明源；本目录只保存 Function 源码配套资料和可重复使用的初始化数据。

- `../functions/shared-world-gateway/`：加入版图、认领、续租和释放国家控制权。
- `../functions/social-gateway/`：玩家资料、好友申请和版图聊天室。
- `seeds/living-world-v1.json`：首张共享版图及首批开放国家的初始化数据。

部署顺序：

1. `appwrite push tables --all --force`
2. `appwrite push buckets --all --force`
3. `appwrite push functions --all --force --activate`
4. 管理员按 seed 创建 `shared_worlds` 与 `nation_controls` 行。

浏览器只读取大厅数据并调用 Functions。`nation_controls`、`world_memberships`、`friendships` 和 `world_messages` 不允许客户端直接写入。
