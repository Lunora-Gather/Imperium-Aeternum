# Imperium Aeternum · 永恒帝国

<p align="center">
  <b>一款以国家治理为核心的历史策略模拟游戏</b>
</p>

<p align="center">
  治理一个国家数百年。扩张越快，崩溃越早。真正的胜利，是建立一台能长期运转的国家机器。
</p>

<p align="center">
  <a href="https://lunora-gather.github.io/Imperium-Aeternum/">在线试玩</a>
  ·
  <a href="#当前状态">当前状态</a>
  ·
  <a href="#核心体验">核心体验</a>
  ·
  <a href="#本地运行">本地运行</a>
  ·
  <a href="docs/RELEASE_FREEZE.md">Release Freeze</a>
  ·
  <a href="docs/FINAL_QA.md">Final QA</a>
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square">
  <img alt="React" src="https://img.shields.io/badge/React-18-61dafb?style=flat-square">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square">
  <img alt="Status" src="https://img.shields.io/badge/Status-V53%20Release%20Gate-gold?style=flat-square">
</p>

---

## 简介

**Imperium Aeternum** 是一款大策略 / 国家治理模拟游戏。

你不是单纯的将军，也不是只负责扩张的君主。你需要在财政、粮食、人口、法律、派系、战争、外交、科技、地方治理和长期稳定之间做取舍。

游戏的核心不是“征服一切”，而是回答一个更困难的问题：

> 当国家越来越大、系统越来越复杂时，你能否让它继续运转下去？

---

## 当前状态

```text
Build marker: V53 release-gate
Primary branch: main
Target: 1.0 public preview
Deployment: GitHub Pages
```

项目已经从功能扩张进入 **Release Freeze / Release Gate** 阶段。当前重点不再是继续堆新系统，而是稳定、验收、部署和公开展示。

当前主线已经完成：

- `main` 已是发布候选主线
- Dashboard 已接入发布准备、Governor、目标教练、总参、风险、经济、外交和战争模块
- Pages workflow 直接构建 `main`
- `npm run rc:check` 已成为本地和 CI 共用的统一发布门禁
- 稳定性测试覆盖年度推进、存档往返和 Dashboard 顾问 smoke
- 发布冻结规则见 [`docs/RELEASE_FREEZE.md`](docs/RELEASE_FREEZE.md)
- 最终 QA 清单见 [`docs/FINAL_QA.md`](docs/FINAL_QA.md)
- Release Notes 草稿见 [`docs/RELEASE_NOTES_DRAFT.md`](docs/RELEASE_NOTES_DRAFT.md)

---

## 核心体验

### 计划 → 推进 → 复盘 → 修正计划

游戏现在形成了一套完整的策略闭环：

```text
开局大厅
  → Dashboard 指挥分组
  → Governor Advisor 路线建议
  → Release Readiness / 推进前风险
  → 年度结算
  → 回合后复盘
  → 下一年路线修正
```

每一年都不是简单地按下“下一回合”。

你会先看到：

- 当前国势是否稳定
- 哪条治理路线最值得优先处理
- 本年是否适合推进
- 是否应该先存档
- 哪些风险会在下一年爆发
- 年报后哪些指标改善或恶化

---

## 特色系统

| 系统 | 说明 |
|---|---|
| **Dashboard 指挥分组** | 将发布准备、执政路线、目标、风险、经济、外交和战争收纳为可折叠指挥面板 |
| **Governor Advisor** | 汇总各顾问，给出当前最优先的执政路线；目前只建议和跳转，不自动改存档 |
| **Release Readiness** | 在游戏内显示当前构建标记、模块覆盖和发布准备状态 |
| **帝国总参** | 自动判断当前国势、主目标和三步治理计划 |
| **推进前风险中枢** | 在结束本年前给出最终决策：阻断、整备或可以推进 |
| **经济 / 外交顾问** | 汇总内政、财政、粮食、外交、同盟与威胁判断 |
| **战争预演** | 对战争目标进行胜率、后勤、财政和外交风险评估 |
| **目标教练** | 为新玩家生成阶段化目标和下一步行动 |
| **存档迁移与体检** | 支持多槽位、损坏存档安全失败、旧档结构 normalize |
| **稳定性测试门禁** | 年度推进、存档往返、Dashboard 顾问 smoke 均纳入部署检查 |

---

## 四条胜利路线

| 路线 | 目标 |
|---|---|
| **征服路线** | 扩张疆土，同时维持足够安定 |
| **富国路线** | 建立长期财政优势，并连续多年保持稳定 |
| **合纵路线** | 积累影响力，经营友邦与外交网络 |
| **永恒路线** | 在长期和平、安定与法统中延续国家机器 |

真正困难的地方在于：

> 每条胜利路线都会被另一套系统牵制。  
> 征服会带来治理压力，富国会受到腐败拖累，外交会被战争打断，永恒则要求长期克制。

---

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发环境
npm run dev

# 类型检查
npm run typecheck

# 运行全部测试
npm run test

# 数据校验
npm run validate

# Pages 兼容构建
npm run pages:build
```

### 发布候选检查

本地和 Pages workflow 共用同一个发布门禁：

```bash
VITE_BASE=/Imperium-Aeternum/ npm run rc:check
```

该门禁包含：

- TypeScript typecheck
- 数据校验
- 年度推进 / 存档往返 / Dashboard smoke 稳定性测试
- 顾问、经济、外交、战争和 AI 的 targeted tests
- Pages 兼容构建

完整发布冻结清单见 [`docs/RELEASE_FREEZE.md`](docs/RELEASE_FREEZE.md)，最终手动 QA 清单见 [`docs/FINAL_QA.md`](docs/FINAL_QA.md)。

---

## 技术栈

- **TypeScript**
- **React 18**
- **Vite**
- **Zustand**
- **Vitest**
- **GitHub Pages**
- 本地存档：`localStorage`
- 数据驱动：事件、国家、省份、建筑、政策、法律、科技

---

## 项目结构

```text
src/
  components/   # 通用 UI 组件与 Dashboard 指挥面板
  data/         # 国家、省份、事件、建筑、政策、法律等数据
  engine/       # 回合结算、战争、外交、AI、事件、王朝等核心逻辑
  gameplay/     # 总参、Governor、风险、发布准备、行动建议等玩法辅助层
  screens/      # 总览、地图、年报、存档、外交、军事等页面
  store/        # 全局状态、存档、迁移和游戏入口
  types/        # TypeScript 类型定义
```

---

## Release Freeze 原则

V52 之后到 1.0 前，默认不再增加大型系统。

允许：

- bug 修复
- 类型修复
- 存档兼容修复
- 测试覆盖增强
- Pages / workflow 修复
- README / Release Notes / 手动验收文档
- 小范围平衡调整

避免：

- 大型新玩法
- 未迁移的 save schema 变更
- 大规模 UI 重写
- 直接自动改存档的 AI 执行器
- 再次拉出 100+ commit 的巨大集成分支

---

## 设计哲学

> 一个国家最大的敌人，往往是它自己的成功。

扩张带来财富，也带来治理压力。  
改革带来效率，也带来派系反弹。  
战争带来土地，也带来债务、厌战和地方不稳。

**Imperium Aeternum** 不奖励无脑扩张。  
它奖励克制、判断、修正和长期治理。

真正的胜利不是打赢所有战争，  
而是让这个国家在你不操作的时候，依然能继续运转。

---

## License

MIT
