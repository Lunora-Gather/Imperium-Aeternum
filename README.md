# Imperium Aeternum

<p align="center">
  <b>一款以国家治理、长期稳定和战略取舍为核心的历史大策略模拟游戏。</b>
</p>

<p align="center">
  <a href="https://lunora-gather.github.io/Imperium-Aeternum/">在线试玩</a>
  ·
  <a href="#核心体验">核心体验</a>
  ·
  <a href="#本地运行">本地运行</a>
  ·
  <a href="#发布状态">发布状态</a>
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square">
  <img alt="React" src="https://img.shields.io/badge/React-18-61dafb?style=flat-square">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square">
  <img alt="Release" src="https://img.shields.io/badge/release-v1.0.0--preview-gold?style=flat-square">
</p>

## 核心体验

**Imperium Aeternum** 不是单纯的扩张游戏。你需要在财政、粮食、人口、法律、派系、战争、外交、科技和地方治理之间做取舍，让国家机器在数百年的压力下继续运转。

当前 1.0 public preview 的主循环已经成型：

```text
选择剧本
  -> Dashboard 指挥中枢
  -> 顾问与风险判断
  -> 执行内政、外交或军事行动
  -> 推进年度
  -> 阅读年报
  -> 存档并修正下一年路线
```

## 你可以做什么

- 经营国家财政、粮食、人口、安定和合法性。
- 在经济、外交、军事和长期稳定之间选择发展路线。
- 使用 Dashboard 的指挥分组快速判断本年优先级。
- 在宣战前查看战争机会、胜率、后勤和外交风险。
- 通过年度报告复盘国家状态变化。
- 使用多槽位本地存档继续长期局。

## 主要系统

| 系统 | 作用 |
| --- | --- |
| Dashboard 指挥中枢 | 汇总目标、总参、发布状态、推进风险、经济、外交和战争建议 |
| Governor Advisor | 给出地方治理优先级和页面跳转建议，不自动改动存档 |
| Strategic HQ | 识别国家当前路线、主目标和三步行动计划 |
| Pre-turn Risk Center | 在推进年度前提示硬阻断、风险和可推进状态 |
| Economy / Diplomacy Advisors | 汇总财政、粮食、外交关系、威胁和可行动建议 |
| War Preview | 在宣战前展示胜率、准备度、后勤压力和外部风险 |
| Save Recovery | 支持多槽位存档、旧档 normalize 和损坏存档安全失败 |

## 发布状态

```text
Public URL: https://lunora-gather.github.io/Imperium-Aeternum/
Release tag: v1.0.0-preview
Package version: 1.0.0-preview
Build marker: 1.0.0-public-preview
Primary branch: main
```

当前仓库保留一个正式 Pages 部署工作流：`Deploy Pages`。它会在 `main` 推送后运行完整 `npm run rc:check`，再部署 GitHub Pages。

## 本地运行

```bash
npm ci
npm run dev
```

常用检查：

```bash
npm run typecheck
npm run validate
npm run test
```

发布候选门禁：

```bash
VITE_BASE=/Imperium-Aeternum/ npm run rc:check
```

`rc:check` 包含 TypeScript 检查、数据校验、稳定性测试、目标顾问/经济/外交/战争/AI targeted tests，以及 Pages 兼容构建。

## 项目结构

```text
src/
  components/   通用 UI 与 Dashboard 面板
  data/         国家、省份、事件、建筑、政策、法律、科技等数据
  engine/       回合结算、战争、外交、AI、事件、王朝等核心逻辑
  gameplay/     顾问、路线判断、风险中心、行动建议和发布状态
  screens/      地图、Dashboard、年报、外交、军事、存档等页面
  store/        全局状态、存档、迁移和游戏入口
  types/        TypeScript 类型定义
```

## 有用文档

- [Release notes](docs/release-notes-v1.0.0-preview.md)
- [Public preview QA](docs/public-preview-qa.md)
- [Release checklist](docs/release-checklist.md)
- [Final QA checklist](docs/FINAL_QA.md)
- [Post-1.0 backlog](docs/POST_1_0_BACKLOG.md)

更底层的设计、公式和 ADR 文档保留在 `docs/`，用于追溯玩法规则和数据来源。
