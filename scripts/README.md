# 维护脚本

| 脚本 | 用途 |
| --- | --- |
| `check-project-structure.ts` | 检查孤立源码、文档分区和失效本地链接 |
| `clean-workspace.ts` | 清理构建产物、日志和编译缓存；加 `--function-deps` 清理 Function 依赖缓存 |
| `check-release-version.ts` | 校验发布身份 |
| `check-build-size.ts` | 执行前端产物体积预算 |
| `check-shared-world-engine.ts` | 校验共享世界服务端引擎 bundle |
| `generate-zh-tw-catalog.ts` | 生成繁体映射 |
| `simulate-stability.ts` | 执行多规模稳定性模拟 |
| `export-data.ts` | 导出游戏数据 |

脚本应可重复执行，不得依赖未记录的临时文件。
