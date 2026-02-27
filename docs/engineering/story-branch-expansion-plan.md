# 剧情分支与内容扩容计划（V1）

## 背景

当前版本已有因果链与节点分支，但分裂度不足，难以支撑中长期可玩性与复刷动机。

## 总目标（面向移动端中文玩家）

1. 单局从 5 节点扩展到 8~12 节点。
2. 单局可达剧情路径数由 18 提升到 300+。
3. 分支节点从 4 个提升到 8~12 个，且分支后进入不同子链（不仅是数值差异）。
4. 建立首批 40~60 条“都市生存语境”事件原型，其中包含“弱智吧语感子集 + 现实吐槽子集”。

## 量化验收指标

- `unique_story_paths`（8 节点）>= 300
- `avg_branch_nodes_per_run` >= 5
- `branch_exclusive_event_ratio` >= 0.35
- `top10_event_repeat_ratio` <= 0.45（防止内容过度重复）

## 分阶段执行

### Phase A：分支架构扩容（引擎层）

目标：让分支真正改变后续剧情走向。

任务：
- 增加节点总数配置（默认 8）。
- 引入分支专属后续池（`branchQueue`）。
- 增加分支门控条件（`requiresFlags` / `forbidFlags`）。
- 支持节点级“主链/支链来源标识”。

提交建议：
- `feat(story): expand run length and branch queue runtime`

### Phase B：内容规模扩容（内容层）

目标：提高可达路径与文本新鲜度。

任务：
- 新增 3 条主线弧：职业压力、租住债务、关系舆情。
- 每条主线至少 8 个事件，分支节点比例 >= 40%。
- 新增弱智吧风格事件子包（荒诞捷径、逻辑陷阱、社交翻车）与现实吐槽子包。
- 全部事件采用“原型改写 + 去标识化”。

提交建议：
- `feat(content): add zh urban story packs with branch-exclusive nodes`

### Phase C：分支质量与平衡（系统层）

目标：避免“分支看起来不同，结果却趋同”。

任务：
- 为分支增加卡组/奖励池联动（不同分支解锁不同奖励倾向）。
- 增加分支后短期代价与中期收益的张力设计。
- 调整敌人池映射，让剧情语义影响战斗类型。

提交建议：
- `feat(balance): link story branches to reward pools and encounter bias`

### Phase D：测试与内容流水线（工程层）

目标：保证扩容后可持续迭代。

任务：
- 增加路径枚举统计脚本（输出路径数/分支占比/重复率）。
- 增加剧情回归用例（固定种子 + 固定分支序列）。
- 增加内容 lint（字段完整性、后续可达性、孤儿事件检测）。

提交建议：
- `chore(test): add story path metrics and content lint checks`

## 贴吧与弱智吧内容接入规则

1. 只使用“情境原型”，不复制帖子原文。
2. 不保留可识别人物/组织信息。
3. 每条改编事件必须绑定玩法后果（状态、队列、分支、奖励倾向）。
4. 上线前执行敏感性审查与灰度验证。

## 里程碑节奏

- M1（2~3 天）：完成 Phase A，路径数提升到 80+。
- M2（3~5 天）：完成 Phase B，路径数提升到 250+。
- M3（2~3 天）：完成 Phase C+D，路径数与质量指标达标。

## 当前下一步

先执行 Phase A：扩展运行时分支机制和节点长度，再跑路径统计基线。

## 进度更新（2026-02-27）

- Phase A：完成
- Phase B：完成（事件总量 40，Deck 30）
- Phase C：完成（分支 `rewardBias` 接入奖励池加权）
- Phase D：完成（路径统计脚本、内容 lint、回归测试）

当前基线（`npm run check:story`）：
- `unique_story_paths` = 326（>= 300）
- `avg_branch_nodes_per_run` = 8.515（>= 5）
- `branch_exclusive_event_ratio` = 0.621（>= 0.35）
- `top10_event_repeat_ratio` = 0.96（未达 <= 0.45 目标，需继续做 Deck 段去重复与中后期事件分流）
