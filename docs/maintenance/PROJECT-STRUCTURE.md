# 项目结构与命名规范

本文件是新增、移动和命名代码时的事实源。目标是让目录表达职责，让文件名可以被直接搜索，让生成物与手写代码不混在一起。

## 目录职责

| 目录 | 只放什么 | 不应放什么 |
| --- | --- | --- |
| `src/components/` | 跨页面复用的 React 组件 | 完整页面、引擎规则 |
| `src/components/ui/` | 无业务状态的基础 UI primitives | Appwrite 调用、游戏结算 |
| `src/screens/` | 路由／标签页级组件 | 可独立测试的规则计算 |
| `src/gameplay/` | 面向玩家的规则编排、顾问和纯展示模型 | React DOM、远程 SDK |
| `src/gameplay/actions/` | 失败零副作用的事务化玩家命令 | 组件状态 |
| `src/engine/` | 确定性规则、回合结算和模拟 | React、Zustand、浏览器 API |
| `src/data/` | 静态数据与索引 | 运行时状态 |
| `src/store/` | Zustand 适配、场景、存读档 | 重复的引擎公式 |
| `src/services/` | Appwrite 等外部系统适配器 | 游戏平衡规则 |
| `src/styles/` | 按加载顺序组织的全局样式层 | 业务逻辑 |
| `functions/*/src/generated/` | 可重新生成的服务端 bundle | 手写网关代码 |
| `docs/maintenance/` | 当前可执行的维护事实 | 已过期阶段总结 |
| `docs/reference/` | 仍有价值的规则、公式和架构决策 | 当前运行状态声明 |
| `docs/planning/` | 尚待确认的路线与需求池 | 已承诺的发布事实 |
| `docs/audits/` | 历史审查证据与结论 | 未经复现的新缺陷 |
| `docs/releases/` | 发布说明、QA 和交付记录 | 日常开发草稿 |

## 命名规则

- React 组件和组件文件使用 `PascalCase.tsx`，例如 `NoviceJourneyPanel.tsx`。
- 非组件 TypeScript 文件使用 `camelCase.ts`，例如 `turnPipeline.ts`。
- 领域目录使用小写 `kebab-case`，例如 `shared-world/`；避免 `sharedWorld/` 与 `shared-world/` 并存。
- 测试放在被测领域的 `__tests__/` 下，命名为 `<subject>.test.ts` 或 `<subject>.test.tsx`。
- CSS 文件使用 `kebab-case.css`，全部归入 `src/styles/`；不要在业务目录新增孤立的全局样式。
- Appwrite Function 目录使用与部署 ID 一致的 `kebab-case` 名称。
- 环境变量使用 `UPPER_SNAKE_CASE`；浏览器公开变量必须带 `VITE_` 前缀。
- 持久化 ID、Appwrite 资源 ID 和已发布 API 字段不能只为“更好看”而重命名，必须通过迁移保持兼容。

## 文件放置决策

新增文件前依次判断：

1. 它是否包含 React？页面放 `screens/`，复用组件放 `components/`。
2. 它是否决定游戏结果？放 `engine/`；如果只是组织玩家命令或生成建议，放 `gameplay/`。
3. 它是否访问网络、认证、存储或实时连接？放 `services/` 或对应 Function。
4. 它是否由脚本生成？放 `generated/`，并在 `package.json` 提供可重复的生成命令。
5. 它是否只是阶段报告？归入历史文档，不得冒充当前维护事实。

源码目录的快速索引见 `src/README.md`，Gameplay 文件职责见 `src/gameplay/README.md`，Function 与脚本入口分别见 `functions/README.md`、`scripts/README.md`。

## 依赖方向

```text
data / types / utils
        ↓
      engine
        ↓
gameplay / store / services
        ↓
components / screens / App
```

`engine` 不得反向导入 React、Zustand、DOM 或 Appwrite。外部服务不得成为单机回合结算的必要条件。

## 清理与变更检查

- 删除文件前先用 `rg` 确认没有 import、动态 import、脚本或文档引用。
- 运行 `npm run check:structure` 检查孤立源码、文档分区和失效本地链接。
- 运行 `npm run clean` 清理构建产物与日志；需要释放 Function 依赖缓存时运行 `npm run clean:function-deps`。
- 生成文件通过生成命令更新，不直接在生成 bundle 中维护业务逻辑。
- 重命名后运行 `npm run typecheck`，防止大小写与路径引用在 Linux CI 才失败。
- 新增导出前先确认至少有一个生产调用方或明确的公共 API 用途。
- 不保留“也许以后会用”的组件和样式；需要时可以从 Git 历史恢复。
- `src/utils/perf.ts` 是 DEC-015 对应的待接入性能观测工具，仍服务于大地图性能路线，不能作为普通孤立模块删除；接入或正式废弃时同步更新结构检查白名单与决策记录。
- 所有合并和发布最终运行 `npm run rc:check`。
