# 维护脚本

| 脚本 | 用途 |
| --- | --- |
| `check-project-structure.ts` | 检查孤立源码、文档分区和失效本地链接 |
| `clean-workspace.ts` | 清理构建产物、日志和编译缓存；加 `--function-deps` 清理 Function 依赖缓存 |
| `check-release-version.ts` | 校验发布身份 |
| `check-build-size.ts` | 执行前端产物体积预算 |
| `check-shared-world-engine.ts` | 校验共享世界服务端引擎 bundle |
| `generate-zh-tw-catalog.ts` | 生成繁体映射 |
| `simulate-stability.ts` | 按实际回合结算与事件耗时统计 P50、P95 及最慢样本和回合，按样本保留首次终局和体检结果 |
| `cloud-save-e2e.mjs` | 用两个隔离的 WebKit 会话和本地云存档网关夹具验证冲突、重连及覆盖选择 |
| `safari-campaign-e2e.mjs` | 运行 `npm run test:e2e:campaign` 在后台 WebKit 验证选国、刷新读档、多人行动重试和断线追赶回合。加 `-- --expire-lease` 可复测租约到期与准备回执连续丢失 |
| `export-data.ts` | 导出游戏数据 |

脚本应可重复执行，不得依赖未记录的临时文件。

双设备回归可用 `npx playwright-core install webkit` 安装测试浏览器，然后运行 `npm run pages:build` 和 `npm run test:e2e:cloud`。如果构建时设置了 `VITE_BASE`，测试时使用相同的值。账号、文件和云端记录均使用本地测试数据。

发布前可在远程 Mac 上用 Node 24 运行 `npm run test:e2e:safari:campaign` 复测同一流程。使用本机原生 Safari 需先征得用户当次同意。原生脚本打开一个系统 Safari 标签页，验证时请保持标签页可见，游戏会暂停隐藏页面的轮询。两个本地来源各自保存一位玩家的数据，共享网关使用内存数据库。失败日志包含请求顺序及页面的可见状态。
