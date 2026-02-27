# 架构对齐重构执行计划（以 /docs/architecture 为准）

## 目标

将当前可玩的卡牌版本重构为符合 `docs/architecture/*` 约束的工程形态：

- Core 业务逻辑独立于 UI
- API / CLI 仅做适配，不包含业务规则
- 事件内容与质量工具链可独立演进

## 差距摘要（当前 -> 目标）

1. 适配层缺失：`api/*`、`bin/mud-cli.js` 不存在。
2. Core 协议缺失：没有统一的 `runAction(payload)` 服务入口。
3. 文本输出缺失：没有 CLI 导向的 presenter 模块。
4. 事件工具链缺失：`check-events/replay` 等脚本未恢复。
5. 协议统一不足：Web 仍直接调用 run engine，不走 Core action 协议。

## 分阶段计划

### Phase 1（当前执行）
- 新增 `core/mud-engine.js`：统一 `createMudService().runAction(payload)`。
- 新增 `core/mud-presenter.js`：CLI 文本输出。
- 新增 `api/index.js` + `api/mud/run.js` + `api/health.js`：HTTP 适配层。
- 新增 `bin/mud-cli.js`：local/remote 模式 CLI 适配。
- 增加服务层测试。

验收：
- 不经过 Web UI 也能通过 Core/API/CLI 驱动完整一局。

### Phase 2
- Web UI 改为通过 action 协议驱动（new/state/play/end/next/reward/remove/restart）。
- 在 Core 输出统一 `GameState` 结构，供 Web/CLI 共用。

验收：
- UI 不再直接依赖 `createRun()` 内部结构。

### Phase 3
- 恢复事件内容质量工具链（schema 校验 + replay + golden case）。
- 增加 `check:events`、`check:replay` 命令并接入 CI。

验收：
- 事件内容修改可在 CI 中被自动验证。

### Phase 4
- 统一文档：将过期架构描述改为“历史归档”或更新到当前实现。
- 补齐发布流程与回归用例文档。

验收：
- 文档、代码、部署流程一致。

## 提交策略

- 每个 Phase 至少一个独立 commit。
- 每次提交后更新 `progress.md`，记录改动、测试结果、下一步。
