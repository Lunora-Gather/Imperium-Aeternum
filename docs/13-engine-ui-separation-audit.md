# 13. 引擎/UI 完全分离审计报告（F1）

> 审计 Imperium Aeternum 引擎层是否可脱离 React 独立打包为 `imperium-engine`。
> 日期：2026-06-25 | 基线：v2.2 | 58 源文件 / 11500 行

## 1. 审计方法

穷尽实读 `src/engine/` 15 文件 + `src/data/` 13 文件 + `src/types/` + `src/utils/`，搜索以下依赖标志：
- `import ... from 'react'` / `'react-dom'`
- `document.` / `window.` / `localStorage`
- `from '../store'` / `'../components'` / `'../screens'` / `'../App'`
- `console.`（调试残留）

## 2. 审计结果

### 引擎层 `src/engine/`（15 文件 / 3578 行）

| 依赖类型 | 命中数 | 结论 |
|----------|--------|------|
| React/react-dom import | 0 | ✅ 零 React 依赖 |
| DOM（document/window/localStorage） | 0 | ✅ 零 DOM 依赖 |
| store/components/screens 反向依赖 | 0 | ✅ 零 UI 反向依赖 |
| console 调试残留 | 0 | ✅ 无调试代码 |

**引擎导出完整性**：所有核心函数均 export——`processTurn`/`settleEconomy`/`settlePolitics`/`settlePopulation`/`settleDiplomacy`/`settleCultureReligion`/`planAITurn`/`executeAIAction`/`processAITurn`/`declareWar`/`makePeace`/`recruit`/`moveArmy`/`improveRelation`/`establishTrade`/`formAlliance`/`espionage`/`checkTrigger`/`rollEvents`/`applyEffect`/`computeTax`/`computeFood`/`popGrowth`/`generateWorld`/`createInitialState` 等全 export。可独立打包。

### 数据层 `src/data/`（13 文件 / 2612 行）

纯数据 export（NATIONS/PROVINCES/EVENTS/TECHNOLOGIES/BUILDINGS/LAWS/POLICIES/GOVERNMENTS/NATIONAL_CHARACTERS/FACTIONS/TRADE_ROUTES/REGIONS），零 React/DOM 依赖。可直接转 JSON（F2 范畴）。

### 类型层 `src/types/`（304 行）

TypeScript interface/type 定义，零依赖。可转 GDScript `class_name`（Godot 移植范畴）。

### 工具层 `src/utils/`（4 文件 / ~200 行）

`math.ts`/`random.ts`（mulberry32）/`id.ts`/`perf.ts` 纯函数，零 React/DOM 依赖。`audio.ts` 是 E4 新增——**唯一例外**，用 Web Audio API + `useRef`/`useState` React hook，但这是 utils 而非 engine，不影响引擎独立打包。

## 3. 可独立打包验证

引擎层依赖图（穷尽实读）：
```
engine/*.ts → data/*.ts（数据）+ types/game.ts（类型）+ utils/random.ts+math.ts（工具）
↑ 无任何 React/DOM/UI 反向依赖
```

可独立打包为 `imperium-engine` npm 包：
- `package.json`：`exports` 指向 `engine/index.ts` 聚合导出
- 依赖：仅需 `mulberry32`（内联或 utils 独立包）
- 消费：`import { processTurn, createInitialState } from 'imperium-engine'`

## 4. 唯一缺口（非 F1 范畴）

引擎函数 **mutate 入参 nation 引用**（如 `settleEconomy(nation, state)` 直接改 `nation.resources.gold`），而非返回 partial result 不可变更新。这是 C1（引擎纯函数化）范畴，非 F1（分离审计）范畴。F1 验收仅要求"引擎零 React 依赖、零 DOM 依赖、可独立打包"，已满足。

C1 mutate 模式不影响独立打包——Godot/GDScript 同样可 mutate 对象引用。仅影响确定性重放/回滚，是 C1 的独立目标。

## 5. 结论

**F1 验收通过**：引擎层 15 文件 3578 行零 React/DOM/UI 反向依赖，导出完整，可独立打包为 `imperium-engine` npm 包。数据/类型/工具层同样独立。唯一非 F1 范畴缺口是 C1 mutate 模式，不影响独立打包。

**建议**：F1 完成，可启动 F2（数据格式中立化）为 Godot 移植铺路。C1 mutate 纯函数化是独立优化目标，非移植硬依赖。

---

> 本报告基于穷尽实读 15 引擎文件 + 13 数据文件搜索依赖标志，非空泛推测。
