# Imperium Aeternum

<p align="center">
  <strong>治理国家，而不只是征服地图。</strong><br>
  一款围绕财政、民生、权力、外交与长期稳定展开的历史大策略模拟游戏。
</p>

<p align="center">
  <a href="https://lunora-gather.github.io/Imperium-Aeternum/"><strong>在线游玩</strong></a>
  ·
  <a href="#第一次玩">新手上手</a>
  ·
  <a href="#开发与验证">本地开发</a>
  ·
  <a href="docs/README.md">文档中心</a>
</p>

<p align="center">
  <img alt="TypeScript strict" src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square">
  <img alt="React 18" src="https://img.shields.io/badge/React-18-61dafb?style=flat-square">
  <img alt="Vite 8" src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square">
  <img alt="Release" src="https://img.shields.io/badge/release-1.2.0_stable-2f855a?style=flat-square">
</p>

当前为 **1.2.0 正式版**，支持简体中文、繁體中文和 English。无需账号即可玩完整单机，登录后可使用私有云存档、共享活版图和好友聊天。

## 第一次玩

首次游玩可选择大厅的推荐剧本「地中海黎明」，按以下顺序开始第一年。

| 1 · 看总览 | 2 · 做一件事 | 3 · 存档并推进 |
| --- | --- | --- |
| 先读“行动中心”，红色风险必须处理 | 只解决今年最重要的问题，不必点遍所有页面 | 保存后结束本年，再用年报决定下一步 |

游戏内还有两层互不重复的帮助：

- `?` 新手帮助：用 6 张短说明讲清完整循环。
- 首局实战引导：带你实际查看经济、省份，完成存档、推进和年报复盘。

## 1.2.0 更新

- 在「印度洋贸易」中，打开经济页，选择邻国签约，再开通粮食输入线或输出线。地图的「商路」筛选可查看两端省份。通商使命的后两章分别需要一条、两条运营商路。
- 「东方破晓」从田税改革开局，「东亚风云」从邻国的五年互不侵犯提案开局。原约到期时，同一邻国会根据任内商路的实际交付年数与双方关系提出续约条件；你也可以让它自然到期。富裕且和平的单人国家在第 8 至 20 年间可能遇到供粮邀约，可出售三年余粮、出资修渠或保留储备。
- 年报列出商路实际交付和开垦后的首次增产。总览也会显示新开商路的首年回报。

## 核心体验

- **长期治理**：财政、粮食、人口、安定、合法性、腐败和地方不满相互影响。经济页可提前查看粮食收入、居民口粮和军粮，开垦后会立即更新预估。
- **有依据的决策**：行动中心、回合前检查、战争预演和顾问建议解释“现在为什么要做”。
- **单机国家使命**：依据国家性格分配治世、通商、扩张、文明或协和路线；三章目标提供明确奖励与重开差异。
- **单机危机链**：财政、法统、地方与长期战争危机会预警、升级并产生后果，连续恢复后也能正式化解。
- **有记忆的外交**：使节、贸易、同盟、联姻、间谍、战争与议和都会留下可衰减的善意或旧怨，实际影响 AI 判断。
- **多条胜利路线**：经营、扩张、外交与长治久安都能成为有效终局目标。
- **可复盘的历史**：年度报告和帝国史册记录使命成果、危机、战争与继承。
- **可靠存档**：本地有 1 个自动槽位和 4 个手动槽位，支持无损压缩、旧档迁移和损坏检测。标题页可继续最近进度，或从“其他本地存档”选择分支。登录后另有 5 个私有云槽位。换设备时，从标题页打开“账号 / 云存档”，登录并下载对应槽位，再点“继续槽位”。
- **共享世界**：玩家控制部分国家，其余国家由 AI 统一推进；服务端负责控制权、行动校验和版本化快照。
- **安全社交**：可直接发现并申请玩家、查看个人名片，也保留好友码；游戏内悬浮消息入口、版图频道、好友私聊和图片消息均经过服务端权限与限流。
- **可控 AI**：Hugging Face 只负责把规则引擎已计算的外交事实整理成简报；失败时自动回退到本地建议，不参与结算。

## 技术架构

```mermaid
flowchart LR
  UI["React 界面"] --> Store["Zustand / GameStore"]
  Store --> Pipeline["回合与玩家行动管线"]
  Pipeline --> Engine["纯 TypeScript 规则引擎"]
  Store --> Local["本地多槽位存档"]
  UI --> Appwrite["Appwrite 认证 / 数据 / 存储 / 实时"]
  Appwrite --> Functions["5 个权威网关 Functions"]
  Functions --> HF["Hugging Face 推理（可降级）"]
```

浏览器只持有公开的 Appwrite 项目标识。API Key 和 Hugging Face Token 只存在于 Appwrite Function 环境变量中。

## 项目结构

```text
src/
  components/          可复用界面组件
    account/           账号入口
    shared-world/      共享世界大厅
    social/            好友与聊天
    ui/                基础 UI primitives
  data/                剧本与静态规则数据
  engine/              纯规则引擎与回合结算
  gameplay/            产品规则、顾问、行动管线与新手引导
    actions/           事务化玩家命令
  i18n/                语言状态、词典与生成映射
  screens/             页面级组件
  services/            外部基础设施适配器
  shared-world/        共享世界领域模型
  social/              社交领域模型
  store/               状态、场景与存档
  styles/              全局样式层
  types/               共享 TypeScript 类型

functions/
  account-gateway/       账号验证码与密码恢复
  ai-diplomacy-gateway/  AI 简报、配额和降级
  cloud-save-gateway/    私有云存档校验与原子替换
  shared-world-gateway/  控制租约、命令和统一结算
  social-gateway/        好友、频道、私聊和媒体

appwrite/               Appwrite 资源声明与维护脚本
scripts/                构建、数据导出和稳定性模拟
docs/                   当前文档、发布资料与历史记录
```

目录职责、文件命名和新增模块规则见 [项目结构与命名规范](docs/maintenance/PROJECT-STRUCTURE.md)。

## 开发与验证

要求 Node.js 22 或 24。CI 与正式发布使用 Node.js 24。

```bash
npm ci
npm run dev
```

运行统一发布检查会验证版本、类型、数据、共享引擎、回归测试、短程模拟和生产包体积。

```bash
VITE_BASE=/Imperium-Aeternum/ npm run rc:check
npm run simulate:stability -- 50 --samples=2
npm run simulate:long
```

日常调试使用后台无窗口 WebKit。首次运行 `npx playwright-core install webkit`，随后用 `npm run test:e2e` 检查开发版，或在上述发布检查构建完成后用 `npm run test:e2e -- --preview` 检查生产包。两者覆盖开局、回合推进、存读档、主题对比度和手机布局。发布流程在远程 Mac 上用 `npm run test:e2e:safari -- --preview` 复测同一套流程。

双设备云存档测试使用隔离 WebKit 和本地夹具。先执行 `npx playwright-core install webkit`，再运行 `npm run test:e2e:cloud`。命令和多人断线夹具见 [维护脚本](scripts/README.md)。

## Appwrite 与 Hugging Face

前端由 GitHub Pages 托管，在线能力由 Appwrite 提供。配置入口：

- [Appwrite 账号、数据库、存储与 Functions](docs/maintenance/APPWRITE_SETUP.md)
- [账号、好友与社交边界](docs/maintenance/AUTH-AND-SOCIAL.md)
- [共享活版图架构](docs/maintenance/SHARED-WORLD.md)
- [Hugging Face 推理与降级策略](docs/maintenance/AI-INFERENCE.md)
- [.env.example](.env.example) 中的浏览器公开变量示例

不要把 API Key、Function Secret 或 Hugging Face Token 写入 `.env.example`、前端源码、提交记录或截图。

## 发布状态

| 项目 | 当前值 |
| --- | --- |
| 在线地址 | [lunora-gather.github.io/Imperium-Aeternum](https://lunora-gather.github.io/Imperium-Aeternum/) |
| 版本 | `1.2.0`（stable） |
| 主分支 | `main` |
| 部署 | GitHub Actions → GitHub Pages |
| 线上后端 | Appwrite Cloud |

GitHub Actions 构建并测试 `main`，发布后逐文件校验线上内容。云函数的版本可在 [Appwrite 部署说明](appwrite/README.md) 中查看。版本详情见 [1.2.0 发布说明](docs/releases/release-notes-v1.2.0.md) 和 [CHANGELOG](CHANGELOG.md)。
