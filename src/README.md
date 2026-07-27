# 源码导航

源码依赖方向保持为：

```text
types / data / utils
          ↓
        engine
          ↓
gameplay / store / services
          ↓
 components / screens / App
```

| 目录 | 维护职责 |
| --- | --- |
| `engine/` | 确定性规则、AI、回合结算与世界生成；不得依赖 React、Zustand、DOM 或 Appwrite |
| `gameplay/` | 玩家命令编排、顾问、风险提示和纯展示模型 |
| `gameplay/actions/` | 失败零副作用的事务化玩家操作 |
| `store/` | Zustand 状态、场景目录、存读档和远端会话适配 |
| `services/appwrite/` | 浏览器侧 Appwrite 适配；服务端写入规则位于 `functions/` |
| `components/` | 跨页面 React 组件；`components/ui/` 只放无业务状态的基础组件 |
| `screens/` | 页面或主标签级组件 |
| `data/` | 静态规则数据与完整性验证 |
| `shared-world/`、`social/`、`account/` | 跨层共享的领域类型与纯规则 |
| `i18n/` | 语言目录、React 文本适配及可再生成繁体映射 |

新增源码前先阅读 `docs/maintenance/PROJECT-STRUCTURE.md`。不要为尚未接入的构想创建空模块；确需保留的待接入基础设施必须在结构检查脚本中写明理由。
