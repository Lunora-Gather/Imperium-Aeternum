# Appwrite 账号与云存档维护

## 已部署资源

- Cloud 项目：`imperium-aeternum`，区域 `fra`
- Web 平台：`localhost`、`127.0.0.1`、`lunora-gather.github.io`
- TablesDB：数据库 `imperium_game`，私有表 `cloud_saves`
- Storage：桶 `cloud_saves`，5 MB、仅 JSON、gzip、加密、文件级权限
- Function：`cloud-save-gateway`，仅允许登录用户执行，以会话用户 ID 作为权威所有者
- 登录方式：新注册强制邮箱 OTP；已验证账号可使用邮箱密码或 OTP 登录

`appwrite.config.json` 是基础设施的可复现配置。变更前先拉取并审阅差异，变更后再推送：

```bash
appwrite pull settings
appwrite pull tables
appwrite pull buckets
appwrite push settings --force
appwrite push tables --all --force
appwrite push buckets --all --force
```

## 客户端配置

复制 `.env.example` 为本地环境文件只在需要覆盖默认值时使用。`VITE_*` 中的项目、数据库、表和桶 ID 都是公开标识；严禁放置 Appwrite API key。管理员操作只允许通过已登录 CLI、受控后端或 Appwrite Function 完成。

## 权限模型

表和桶不授予客户端创建权限。浏览器只读取本人行与文件；所有创建、覆盖和旧文件清理都经过 `cloud-save-gateway`。网关从 `x-appwrite-user-id` 获取权威所有者，不接受客户端指定用户，因此好友公开用户 ID 不能被用于抢占或污染其他账号的存档槽位。

上传顺序仍为“新文件 → upsert 元数据 → 删除旧文件”；元数据失败时由网关回滚新文件，避免先删后传导致丢档。服务端重新计算 SHA-256、验证 JSON、大小、槽位与时间，并重复执行跨设备冲突判断；客户端检查只负责提前反馈。下载必须经过本地存档迁移与规范化。

## 认证策略

当前会话最长 30 天、每用户最多 10 个会话，启用 3 次密码历史、常见弱密码检查、个人信息检查和新会话告警。手机、匿名、邀请和 Magic URL 均关闭。Appwrite Cloud 默认邮件通道可以发送 OTP；`smtpEnabled: false` 表示尚未接入自定义 SMTP 和品牌模板，不代表邮箱 OTP 被关闭。

注册边界为“OTP 建立已验证会话后再设置昵称和密码”。不得恢复 `account.create → password session` 的直接注册路径；详细状态机与 UI 准入见 [`AUTH-AND-SOCIAL.md`](AUTH-AND-SOCIAL.md)。

## 故障排查

1. 401：会话失效，退出后重新登录。
2. 404：确认项目区域端点、数据库/表/桶 ID 与 `appwrite.config.json` 一致。
3. CORS/hostname：将实际部署域名加入 Appwrite Web Platform；不要使用带协议或路径的 hostname。
4. 409/冲突提示：比较本地与云端回合和时间，再显式选择上传覆盖或下载覆盖。
5. 配置漂移：运行 `appwrite pull settings/tables/buckets`，审阅差异后更新仓库配置。
