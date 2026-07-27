# Appwrite Functions

每个一级子目录对应一个已部署的 Function ID，并拥有独立的 `package.json` 与锁文件。

- `main.js`：请求入口和 SDK 适配。
- `policy.js`：可被根测试直接导入的纯校验规则。
- `transaction.js` 等专用模块：不依赖运行时上下文的可测试服务端逻辑。
- `generated/`：只放可由根脚本重新生成的代码。

浏览器不得直接取得表或桶的写权限。新增写入必须通过最小 scopes 的用户鉴权 Function，并在 `src/services/appwrite/__tests__/` 增加权限或策略回归测试。

Function 的 `node_modules/` 是可再生成缓存，不纳入仓库。需要本地运行某个 Function 时，在对应目录执行 `npm install`。
