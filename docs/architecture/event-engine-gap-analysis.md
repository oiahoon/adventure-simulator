# 事件引擎蓝图对照审计（2026-02-26）

本文对照 `docs/architecture/deep-research-report.md` 检查当前实现完整度。

## 总体结论

当前实现属于“蓝图的中期阶段”，不是完整落地版。

- 已完成：Queue -> Arcs -> Decks 三层运行骨架、JSON 化 Arc/Deck、权重偏置与冷却、基础因果轨迹展示。
- 未完成：Schema/内容 lint、确定性 Replay、完整 EventLog 持久化、运营指标聚合、内容工程流水线与合规门禁、性能索引化。

## 分项对照

| 蓝图模块 | 目标 | 当前状态 | 结论 |
|---|---|---|---|
| 选择架构 | Queue -> Arcs -> Decks | 已落地，且 Queue/Arc 优先于 Deck | 已完成（核心） |
| 条件与结果闭环 | `when -> weight -> outcomes` | Arc/Deck DSL 可运行，支持分支与条件 | 已完成（基础） |
| Flags/Bias/TTL | 链式传播与短期记忆 | 已有 flags/bias/cooldown/seen | 已完成（基础） |
| 内容外置化 | 事件包全面 JSON 化 | Arc 与主 Deck 已外置，仍保留 legacy 随机池 fallback | 部分完成 |
| Schema 校验 | JSON Schema + 内容 lint | 仓库内暂无统一 schema 校验入口与 lint | 未完成 |
| EventLog | 增量日志（选择/结果/delta/seed片段） | 仅有 UI 日志与 trace 摘要，无结构化 EventLog 存储 | 未完成 |
| Replay | 确定性回放测试 | 无 replay runner 与黄金样例 | 未完成 |
| 指标体系 | 新鲜度/链完成率/分支覆盖 | 游戏内有 metrics 计数，无聚合埋点与报表 | 部分完成 |
| 内容工程 | 作者模板/lint/合并发布 | 有 event-generator 脚本，但未接入当前数据包发布链 | 部分完成 |
| 合规风控 | 采集->改写->审核门禁 | 无自动化规则与门禁脚本 | 未完成 |
| 性能扩展 | 200->2000 事件索引化筛选 | 当前以线性过滤为主 | 未完成 |

## 关键缺口（优先级）

1. P0: 事件 Schema 校验与内容 lint 缺失，内容包可能在运行时才暴露错误。  
2. P0: 无结构化 EventLog 与 Replay，难以做“可复盘 + 可回归 + 可回放”的工程闭环。  
3. P1: Deck 与 legacy 事件双轨并存，存在重复/行为漂移风险。  
4. P1: 指标缺乏标准化输出，不利于平衡“冲击感”与“可玩性”。  
5. P2: 缺少内容流水线与风控门禁，不利于长期内容扩容。

## 后续改进计划（执行顺序）

### Phase A（P0，先做稳定性）

1. 建立 `docs/schema/event-schema.json` 与校验脚本 `npm run check:events`。  
2. 增加内容 lint（标题长度、必填字段、引用有效性、禁用词占位）。  
3. 将 `event-meta/arc-config/arc-events/event-deck` 全部纳入统一校验。

### Phase B（P0，复盘与可测）

1. 引入结构化 EventLog（按 turn 记录：eventId、source、branch、delta、flags 变化）。  
2. 实现 `replay` 命令：`seed + actions` 重放并断言关键状态。  
3. 增加最小 golden cases：失业链、房贷链、扶人风波链。

### Phase C（P1，去冗余与一致性）

1. 逐步下线 `maybeRandomEventLegacy`，确保 Deck 全量覆盖。  
2. 对老事件做 ID 对齐迁移，避免统计割裂。  
3. 统一“rare/once/cooldown/flags”语义。

### Phase D（P1，观测与运营）

1. 在 `render_game_to_text` 输出标准化指标（链完成率、重复率、队列回收命中）。  
2. 补充离线统计脚本，按日志计算“事件新鲜度、分支覆盖、死亡主因分布”。

### Phase E（P2，文档与清理）

1. 更新 README 与部署文档到当前“都市生存模拟器”架构。  
2. 清理过期武侠描述与历史遗留目录说明。  
3. 对 `docs/design/*` 做现状化重写或标注“历史草案”。

## 是否可进入“全项目清理阶段”

当前不建议直接进入“全量清理优先”。

- 建议先完成 Phase A + B（校验与回放）后再做大规模清理。  
- 原因：没有 schema/replay 保护时清理冗余文件会提升回归风险。
