# 12. Godot 移植可行性报告（F3）

> 评估 Imperium Aeternum 当前 React+TypeScript MVP 向 Godot 4 移植的可行性、路径与风险。
> 日期：2026-06-25 | 基线：v2.2 | 58 源文件 / 11500 行 | typecheck ✅ + 89/89 测试 ✅

## 1. 移植动机

- 玩法成熟后需 2D 美术、动画、战斗演出、复杂外交 UI，React 状态管理上限显现
- Godot 4 原生 2D + GDScript 轻量 + 跨平台导出（PC/移动/主机）
- 当前 MVP 已验证玩法循环，移植时机成熟

## 2. 当前架构移植友好度评估

| 层 | 行数 | Godot 移植难度 | 评估 |
|----|------|---------------|------|
| **engine/** | 3578 | 🟢 低 | 纯函数逻辑，零 React/DOM 依赖，可直接转 GDScript |
| **data/** | 2612 | 🟢 低 | JSON 数据驱动，Godot 可从 JSON 加载或转 Resource |
| **types/** | 304 | 🟢 低 | TypeScript interface → GDScript class_name |
| **utils/** | ~200 | 🟢 低 | math/random/id 纯函数，直接转 |
| **store/** | 789 | 🟡 中 | Zustand 状态管理需转 Godot autoload singleton + signal |
| **screens/** | 2508 | 🔴 高 | React JSX → Godot Control 节点，需重写全部 UI |
| **components/** | ~500 | 🔴 高 | React 组件 → Godot packed scene |
| **App.tsx** | ~310 | 🔴 高 | 路由+主题+教程+音效需重组为 Godot 主场景树 |

**结论**：引擎层（engine+data+types+utils ≈ 6700 行，58%）移植友好，UI 层（screens+components+App ≈ 3300 行，29%）需重写。比例良好——引擎是核心价值，UI 重写是必然成本。

## 3. 移植路径（4 阶段）

### 阶段 A：数据中立化（F2 前置，~8h）
- `data/*.ts` 导出为 JSON：nations/provinces/events/technologies/buildings/laws/policies/governments/national-characters/factions/scenarios
- 引擎改造：`import { NATIONS } from '../data/nations'` → `loadNations(): Nation[]` 从 JSON 加载
- 验证：现有测试全绿 + JSON 导出脚本可重复运行

### 阶段 B：引擎转 GDScript（~24h）
- `engine/*.ts` 逐文件转 `engine/*.gd`：
  - `processTurn(gameState)` → `func process_turn(state: GameState) -> GameState`
  - `settleEconomy(nation, state)` → `func settle_economy(nation, state) -> EconomyResult`
  - 类型：TypeScript interface → GDScript `class_name` + typed arrays
  - 随机：`mulberry32` → Godot `RandomNumberGenerator` wrapped seedable
- 测试：vitest 测试用例转 Godot 测试框架（GUT - Godot Unit Test）
- 验证：89 测试全绿 + 50 回合确定性重放通过

### 阶段 C：UI 重写（~40h）
- 12 Screen → 12 Control 场景：
  - Dashboard/Province/Economy/Population/Politics/Military/Diplomacy/Tech/Stats/Report/Chronicle/SaveLoad
- 主题系统：CSS 变量 → Godot Theme resource（4 主题）
- 音效：Web Audio API 合成 → Godot AudioStreamPlayer + synthesized WAV
- 新手教程：React state → Godot popup + step machine
- 验证：M2 门真人 50 回合无困惑

### 阶段 D：增强与导出（~16h）
- SVG 地图（E5）→ Godot TileMap + 多边形省份
- 动画/粒子（Godot 原生优势）
- 导出 PC（Windows/Linux/Mac）+ 移动（Android/iOS）

**总预估**：~88h（阶段 A 8h + B 24h + C 40h + D 16h），约 2-3 周全职。

## 4. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| GDScript 无 TS 类型推断 | 引擎转换易出类型 bug | 用 `class_name` + typed arrays + GUT 测试全覆盖 |
| Zustand 响应式 → Godot signal 模式不同 | 状态同步遗漏 | autoload singleton + signal 严格 connect/disconnect |
| 192 国性能在 Godot | UI 重写后可能卡 | 引擎已在 TS 优化到 1131ms/50 回合，Godot GDScript 性能相近 |
| JSON 数据加载 vs TS 静态导入 | 运行时错误代替编译时 | GUT 测试 + 加载时 schema 校验 |
| 主题 CSS 变量 → Godot Theme | 4 主题维护成本 | 用 Theme resource variations，避免硬编码颜色 |

## 5. 移植前必须完成的 WP（依赖）

| WP | 为何移植前必须 | 状态 |
|----|--------------|------|
| **F2 数据格式中立化** | 引擎需能从 JSON 加载，否则数据锁死在 TS | ⏳ 未做 |
| **C1 引擎纯函数化** | 引擎 mutate state 不可重放，Godot 需纯函数才安全 | ⏳ 未做 |
| **E5 SVG 地形地图** | 地图渲染方式影响 Godot TileMap 设计 | ⏳ 未做（可移植后做） |

**结论**：F2 + C1 是移植硬依赖，E5 可移植后在 Godot 做。建议顺序：F2 → C1 → F3 报告（本文）→ 移植启动。

## 6. 不移植的替代方案

- **继续 React**：加 Canvas/WebGL 优化（PixiJS），美术用 Sprite Sheet，可达中等规模
- **Unity 移植**：C# 强类型更接近 TS，但 Unity 2D 不如 Godot 轻量，且授权成本
- **Web Godot**：Godot 4 可导 HTML5，但当前 React 版已是 Web，无优势

**推荐**：玩法成熟后用 Godot 移植，当前 React 版继续验证玩法 + 扩内容（D1/D2）。

## 7. 移植决策门槛

移植启动需满足：
- [x] MVP 玩法循环验证（M1 门已过）
- [ ] 真人 200 回合不无聊（M4 门，Phase D 完成后）
- [ ] F2 数据中立化完成
- [ ] C1 引擎纯函数化完成
- [ ] 本报告评审通过

**当前进度**：1/5 项满足。建议 2026 Q4 启动移植，届时 Phase D/E 完成 + F2/C1 完成。

---

> 本报告基于 v2.2 架构实读评估，非空泛推测。移植路径以现有 6700 行引擎层友好度为核心依据。
