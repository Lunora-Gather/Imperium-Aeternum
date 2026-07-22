# 共享活版图：当前设计与实施边界

> 本文是共享版图、国家控制权、自动推进、好友与聊天的唯一当前事实源。历史设想或讨论不得覆盖本文；永久性取舍另记入 `docs/decisions.md`。

## 1. 产品目标

- 一个版图实例代表一条所有成员共享的历史线，只有一个统一年份和世界修订号。
- 一个账号可加入多个版图，并在每个版图控制多个国家；每个版图可配置上限。
- 同一国家同一时间只能由一个账号控制。主动释放或租约到期后重新开放。
- 只要版图存在在线控制者，未受玩家直接操作的国家仍由 AI 推进。
- 离线玩家国进入保守托管，避免停摆，也避免 AI 擅自进行高风险不可逆决策。
- 同版图成员可以实时聊天；全局好友通过好友码建立，不暴露登录邮箱。

## 2. 不可破坏的边界

1. `WorldState` 不保存某个浏览器用户身份。现有 `playerNationId` 只属于单机兼容路径，不能扩成共享世界的玩家数组。
2. 共享会话独立保存 `worldId / controlledNationIds / activeNationId`。
3. 浏览器不能直接修改控制权、成员关系、好友关系、消息或权威世界快照。
4. 所有写操作必须经过 Appwrite Function，校验调用用户、控制权、世界修订和幂等键。
5. 世界结算只能由服务端执行一次；客户端只提交命令和显示结果。
6. 云存档继续服务单机模式；共享世界使用服务端快照和命令日志，不提供个人回滚覆盖公共历史。

## 3. 领域模型

| 领域 | 核心对象 | 说明 |
| --- | --- | --- |
| 版图 | `SharedWorldInstance` | 模板、年份、修订、阶段、结算截止时间和规则 |
| 成员 | `WorldMembership` | 用户加入某个版图及角色、最近在线时间 |
| 控制权 | `NationControl` | 国家唯一控制者、租约、最后活动和版本 |
| 命令 | `SharedWorldCommandEnvelope` | 用户意图、国家、基础修订、幂等键和载荷 |
| 社交 | `GameProfile / Friendship` | 好友码、申请、接受和移除 |
| 聊天 | `WorldChatMessage` | 仅版图成员可读写的纯文本消息 |

当前纯领域代码位于 `src/shared-world/` 与 `src/social/`；Appwrite 适配位于 `src/services/appwrite/`；UI 位于对应的 `src/components/sharedWorld/` 和 `src/components/social/`。

## 4. 自动推进规则

每个国家在结算计划中只有三种运行状态：

- `human_active`：控制者在线，等待其提交并确认本回合命令。
- `human_away`：控制权有效但玩家离线，由保守 AI 托管并自动准备。
- `ai_autonomous`：无人控制或租约过期，完整 AI 自主决策并自动准备。

版图为空且 `pauseWhenEmpty=true` 时停止计划结算。有人在线后，在线玩家控制的国家全部准备完成即可提前结算；否则在截止时间统一结算。任何国家不得拥有独立于版图的年份。

禁止以普通按钮点击触发 AI 时间脉冲，否则玩家可通过点击频率加速世界。国内设置可以即时登记，但经济、人口、战争、外交结果和事件必须在统一结算中产生。

## 5. 托管 AI 权限

托管 AI 可以维持税收、粮食、基础建设、防御、科研延续和既有外交义务。默认不得主动宣战、割地、废除核心法律、进行破产级投资或接受改变国家主权的协议。玩家恢复在线后立即收回直接控制。

## 6. Appwrite 数据与权限

| 资源 | 客户端权限 | 权威写入 |
| --- | --- | --- |
| `shared_worlds` | 登录用户读取 | 世界结算 Function |
| `nation_controls` | 登录用户读取占用状态 | Shared World Gateway |
| `world_memberships` | 仅本人读取 | Shared World Gateway |
| `world_commands` | 仅提交者读取 | 命令/结算 Function |
| `game_profiles` | 仅本人直接读取；好友码搜索经 Function | Social Gateway |
| `friendships` | 双方读取 | Social Gateway |
| `world_messages` | 成员读取 | Social Gateway |
| `world_snapshots` | 无客户端写权限 | 世界结算 Function |

首版聊天室最多向 100 名成员配置行级读取权限；超过此规模前必须迁移为每版图 Appwrite Team 或专用聊天服务。

## 7. 当前交付状态

### 已落地

- 共享版图、控制权租约、世界时钟和运行状态的 TypeScript 领域模型。
- “无人在线暂停；有人在线时 AI/托管国自动准备”的纯逻辑与测试。
- Appwrite 控制权网关、社交网关、数据表、快照桶和部署声明。
- 标题页共享版图大厅、国家占用状态、认领/释放入口。
- 好友码、好友申请处理与版图聊天室 UI/Realtime 适配。
- 首张版图 seed；单机和原云存档路径保持不变。

### 下一阶段（上线真正共享结算前必须完成）

1. 从 `GameState.playerNationId` 提取共享会话的 `activeNationId`，逐页验证顾问、事件、年报和胜利路线。
2. 将所有共享行动序列化为有版本和幂等键的 `world_commands`。
3. 建立 World Resolver Function，加载快照、生成 AI/托管命令、调用确定性引擎并原子提交新修订。
4. 把 `pendingEventOptions`、`lastReport/history` 与胜利结果按国家作用域存储。
5. 增加在线心跳、准备状态、聊天举报/屏蔽、消息保留和管理员回收控制权。
6. 完成两个账号并发认领、断线托管、重复结算、旧修订命令和聊天权限的端到端测试。

## 8. 托管选择

当前继续使用 GitHub Pages + Appwrite。静态托管不限制 Auth、TablesDB、Functions 和 Realtime。只有需要常驻进程、自管 WebSocket、SSR 或超过 Appwrite Function 执行模型时，才评估 Vercel；迁移托管不是实现好友或版图聊天的前置条件。
