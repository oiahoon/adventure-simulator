# Card Engine V2 重构计划（基于 cards-play-deep-research-report）

## 目标

在不推倒现有仓库的前提下，按阶段把项目迁移到统一的 `Card + Event` 引擎：

- 单一动作协议：`new/status/draw/play/choose`
- 单一调度骨架：`ForcedQueue -> ArcDecks -> MainDeck -> OpportunityDeck`
- Web/API/CLI 共用同一内核语义
- 支持可回放日志、A/B 对比与持续内容扩容

参考蓝图：
- [cards-play-deep-research-report.md](/Users/johuang/Work/Mud-demo/docs/architecture/cards-play-deep-research-report.md)

## 迁移策略结论

- 不重开仓库。
- 采用并行引擎迁移：保留 `v1` 作为稳定运行版本，增量建设 `v2`。
- 每阶段可独立发布并回滚，避免一次性大切换风险。

## Phase 1（已开始）: V2 骨架落地

目标：具备可跑通的 `v2` 协议与最小调度。

交付：
- `core/card-v2/default-content.js`
- `core/card-v2/engine.js`
- API 通过 `engineVersion=v2` 选择 v2 引擎
- CLI 增加 `--engine v2`

验收：
- `new -> draw -> play -> draw` 闭环可跑
- `v1` 路径不回归

## Phase 2: Schema 与内容编译层

目标：把 v2 内容外置成 schema 驱动，而不是硬编码 JS。

交付：
- `docs/schema/card-event-v2-schema.md`
- `public/data/cards-v2/*.json` 内容包
- `scripts/check-cards-v2.js` 校验器（条件/引用/可达性）

验收：
- 引擎只消费 JSON 包
- 新增卡牌不改引擎代码

## Phase 3: Web 引擎替换

目标：Web UI 从 `idle-mud.js` 的旧逻辑迁移到 `v2` 运行时。

交付：
- `public/src/card-runtime-v2.js`（纯状态机）
- UI 层仅负责渲染与交互
- 保留旧页面开关：`?engine=v1|v2`

验收：
- Web 与 API/CLI 的回合语义一致
- 旧功能（分享/结算/挑战 seed）在 v2 下可用

当前进展：
- 已新增 `public/game-v2/index.html` + `public/src/card-runtime-v2.js` 作为 v2 独立壳层。
- 壳层通过 `/api/mud/run` + `engineVersion=v2` 运行抽牌/出牌循环。
- 已接入 v2 结局摘要、基础成就、分享文案复制与战报图生成下载。
- 下一步是把分享/成就/结算和 v2 runtime 对齐并接回主 `/game` 页面。

## Phase 4: 观测与回放

目标：可调参与可验证。

交付：
- JSONL 回放日志导出
- 关键指标：ArcCompletionRate / QueueHitRate / CardDiversity / RepeatRate
- 回放脚本与 golden case 升级为 v2 协议

验收：
- 同 seed + 同选择可复现
- 指标可用于 A/B 与质量回归

## Phase 5: 默认切换与清理

目标：v2 成为默认，v1 归档。

交付：
- API/CLI 默认 `v2`
- Web 默认 `v2`
- v1 代码标记 `legacy` 并逐步下线

验收：
- 所有入口默认走 v2
- 文档、脚本、测试全部对齐

## 提交策略

- 每阶段至少 1 个独立 commit，commit message 包含阶段号。
- 每阶段结束更新：
  - `progress.md`
  - 本文档的“状态”

## 当前状态

- Phase 1: 已完成（v2 引擎骨架 + API/CLI 选择器 + 双版本 smoke test）
- Phase 2: 已完成（JSON 内容包 + content-loader + check-cards-v2）
- Phase 3: 进行中（Web 运行时替换准备）
- Phase 4: 待开始
- Phase 5: 待开始
