Original prompt: 按照这份计划文档，创建开发的计划，根绝计划分阶段开始开发，并阶段性提交代码，直到完全完成这份开发计划。

## M0
- 初始化全新项目结构：core/content/ui/app/public/tests。
- 建立可运行空场景页面，含基础日志面板。
- 暴露 `window.render_game_to_text` 与 `window.advanceTime` 供自动化测试使用。
- 待办：进入 M1 完成战斗核心循环。
- Playwright 自动化已接入，当前可成功渲染页面并产出截图：`output/web-game-m0/shot-0.png`。
- 注意：自动化日志中仍有一个通用 404 console error（未影响主流程加载，服务日志未复现具体缺失文件）。

## M1
- 完成战斗状态机：抽牌、出牌、结束回合、敌方行动、胜负判定。
- 新增 12 张基础卡与 3 个敌人模板。
- 新增战斗界面（敌我信息、手牌区、结束回合、战斗日志）。
- 单测通过：`tests/battle.test.js`。
- Playwright 场景验证：
  - 点击手牌后，能量下降且敌人掉血（`output/web-game-m1-playcard`）。
  - 点击结束回合后，回合推进并触发敌人行动（`output/web-game-m1-endturn`）。
- 待办：M2 增加状态系统、条件化 AI、日志增强反馈。

## M2
- 新增状态系统：`poison / vulnerable / weak / strength`。
- 新增状态结算：伤害修正、回合衰减、中毒跳伤。
- 新增条件化敌方 AI：低血量偏向防御、奇数回合可优先 debuff。
- UI 增加状态徽章，战斗日志增强至关键行为可追踪。
- 单测新增状态与 AI 覆盖（共 7 项通过）。
- Playwright 场景验证：
  - 出牌后敌方出现 poison 状态并同步到文本状态。
  - 结束回合后敌方 debuff 生效并显示玩家 vulnerable 状态。
- 待办：M3 实现局外成长（奖励三选一、删牌、节点推进）。

## M3
- 新增 `core/run/engine.js`：支持单局 5 节点流程（含 1 个精英节点）。
- 战斗与局外打通：战斗胜负后进入 `reward/map/victory/defeat` 状态流。
- 新增战后奖励三选一（加牌），并支持奖励阶段删牌调优。
- `createBattle` 支持外部传入牌组/血量/节点敌人，实现局内外连续体验。
- 新增 Run UI：路径节点、奖励面板、下一节点推进。
- 单测新增 run 流程覆盖（节点推进、奖励加牌、删牌）。
- Playwright 验证：局内出牌后状态输出与节点信息正确（`output/web-game-m3`）。
- 待办：M4 引导、平衡调优、移动端与发布清单。

## M4
- 新增可开关新手引导面板（本地记忆显示状态）。
- 完成首轮平衡微调：
  - `heavy_strike` 12 -> 11
  - `poison_dart` 4 -> 3
  - `rally` 2 strength -> 1 strength
  - 精英敌人生命系数 1.35 -> 1.25
- 移动端优化：
  - 顶部操作区改为小屏双列按钮
  - 手牌/奖励卡在小屏单列排布
  - 删牌调优区改为纵向布局
- 新增 Beta 发布清单：`docs/release/beta-release-checklist.md`。
- 质量结果：
  - `npm test` 全通过（11 tests）。
  - Playwright 截图与状态验证通过（`output/web-game-m4`）。

## 下一步建议
- 手工回归 5 局并记录节点胜率。
- 根据胜率和出牌率继续调整卡牌与精英数值。
- 增加部署配置与版本发布流程。

## Post-M4 改进（部署前增强）
- 交互增强：新增热键
  - `Enter`：结束回合
  - `N`：进入下一节点
  - `G`：开关引导
  - `R`：新开一局
- 路径显示修正：节点 UI 改为读取真实节点类型，不再硬编码精英位置。
- 本地运行改进：`npm run dev` 改为仓库根目录静态服务，避免模块路径 404。
- 平衡分析工具：新增 `npm run simulate -- <count>` 批量自动对局模拟（默认 30 局）。
- 部署能力：
  - 新增 GitHub Actions 工作流 `.github/workflows/vercel-deploy.yml`。
  - 支持 Deploy Hook 与 Vercel CLI 两种自动部署路径。
  - 新增部署说明文档 `docs/release/vercel-deploy.md`。
- 验证：
  - `npm test` 11 项通过。
  - `npm run simulate -- 20` 输出：胜率 100%、平均终局 HP 53.2。
  - Playwright 截图状态验证通过：`output/web-game-post-improve`。

## Architecture Refactor (Baseline: docs/architecture)
- 新增重构执行计划：`docs/architecture/refactor-execution-plan.md`。
- Phase 1 已完成：
  - Core 服务层：`core/mud-engine.js`（统一 `createMudService().runAction(payload)`）
  - CLI 输出层：`core/mud-presenter.js`
  - HTTP 适配层：`api/index.js`、`api/mud/run.js`、`api/mud/status.js`、`api/health.js`
  - 终端适配层：`bin/mud-cli.js`（local/remote 模式）
- 测试：新增 `tests/mud-service.test.js` 并通过全量测试（14/14）。
- Playwright 冒烟验证：`output/web-game-refactor-p1`，UI 与状态输出正常。
- 下一阶段：Phase 2 将 Web UI 改为 action 协议驱动（不再直接依赖 run 内部结构）。

## Docs Cleanup (architecture baseline)
- 按职能重构 docs：`product / architecture / engineering / release`。
- 删除过期与重复文档（旧 MUD/v2、重复计划、历史 schema/API 示例）。
- 新文档核心统一为：面向中国玩家、都市生存题材、移动端优先卡牌 Web Game。
- 文档入口：`docs/README.md`。

## Docs Addendum: 内容设计补强
- 新增事件因果链设计文档：`docs/product/event-causal-chain-design.md`。
- 新增贴吧内容引入策略文档（含弱智吧语感来源与风控边界）：`docs/product/tieba-content-integration.md`。
- 更新 `docs/README.md`，将上述两份文档列为关键内容设计文档。
- 更新 `docs/architecture/event-content-strategy.md`，补充因果回收与贴吧素材流水线目标。

## Phase 2.1: 连续剧情链运行时（Queue -> Arc -> Deck）
- 新增故事事件内容库：`content/story-events.js`。
- `core/run/engine.js` 改为故事链驱动节点生成：
  - 优先队列后续（Queue）
  - 再推进主叙事弧（Arc）
  - 最后才回落机会池（Deck）
- 每个节点绑定 `story beat`（标题、正文、来源、标签），并写入 `story.history`。
- 节点启动时应用剧情运行时影响（如开局 HP 压力），强化连续叙事体感。
- UI 新增 Story Beat 区与 Chain 展示，`render_game_to_text` 输出 `story.current/history`。
- `mud-engine` 汇总状态新增 story 字段，供 API/CLI 复用。
- 测试增强：`tests/run.test.js` 增加剧情连续性断言（`layoff_rumor -> hr_meeting`）。
- 结果：
  - `npm test` 15/15 通过。
  - Playwright 冒烟通过（`output/web-game-storychain-p2`）。

## Phase 2.2: 剧情节点分支（Branching Story Beats）
- 在 `content/story-events.js` 为关键剧情节点新增分支选项（2 选 1）。
- `core/run/engine.js` 新增 `story` 模式：
  - 节点开始先进入剧情分支选择，再进入战斗。
  - 分支会影响 Queue/Flags/Bias/HP，并改变后续节点走向。
  - 节点不再一次性预生成，改为按推进动态生成，确保分支对后续真实生效。
- `app/main.js` 与 `ui/game-ui.js` 增加分支交互与展示：
  - Story Decision 面板
  - 链路中记录选中分支
  - 快捷键 `1/2` 选择分支
- `core/mud-engine.js` 增加 `story_branch` action 支持。
- `tests/run.test.js` 与 `tests/mud-service.test.js` 更新以覆盖 story 模式与分支链。
- `docs/architecture/action-protocol.md` 补充 `story_branch`。
- 结果：
  - `npm test` 15/15 通过。
  - Playwright 验证分支选择流通过（`output/web-game-story-branch-p2`）。

## Planning: 剧情分支与贴吧内容扩容
- 新增专项计划：`docs/engineering/story-branch-expansion-plan.md`。
- 明确目标：8~12 节点、300+ 路径、40~60 条中文都市生存事件原型。
- 分四阶段推进：运行时扩容 -> 内容扩容 -> 分支平衡 -> 测试与 lint 流水线。

## Phase A 完成：运行时分支扩容
- 节点长度从 5 提升到 8（默认 `nodeTotal=8`）。
- 新增 `branchQueue` 优先级（`branchQueue > queue > arc > deck`）。
- 事件门控支持：`requiresFlags/forbidFlags`。
- 分支效果支持 `enqueueBranch`，用于注入分支专属后续剧情。
- 新增分支专属事件：`compensation_stall/job_hunt_sprint/roommate_conflict/credit_card_trap`。
- 测试新增“branchQueue 优先于 arc”断言，当前全量测试 16/16 通过。
- Playwright 冒烟通过：`output/web-game-phaseA-runtime`。
- 路径基线（8 节点）当前约 36 条，下一阶段需通过内容扩容提升到 300+。

## Phase B 进展：内容扩容与分裂度提升
- 事件总量扩至 16 个（新增职业/家庭/舆情/平台规则等事件）。
- Deck 池从 2 扩到 6，新增多条带分支事件。
- 多个事件新增分支（含弱智吧风格的荒诞副业/大师课程链）。
- 默认节点长度提升到 11（仍在 8~12 规划区间）。
- 路径统计基线：11 节点约 384 条可达剧情路径。
- 质量结果：
  - `npm test` 16/16 通过。
  - Playwright 冒烟通过（`output/web-game-phaseB-content`）。

## Phase C + D 完成（分支奖励联动 + 工具链）
- 内容整合：
  - 合并额外中文都市剧情包：`content/story-pack-zh.js` 并接入 `content/story-events.js`。
  - 事件总量扩至 40，Deck 扩至 30。
- 系统联动：
  - 卡牌新增语义标签（attack/defense/survival/risk/career/utility）。
  - 运行时新增 `rewardBias` 累积，分支效果可通过 `effects.rewardBias` 影响奖励三选一权重。
  - 关键分支后续改为 `branchQueue` 驱动，强化“分支影响后续剧情”。
- 工程与质量：
  - 新增路径统计脚本：`scripts/story-path-metrics.js`。
  - 新增内容 lint：`scripts/lint-story-content.js`。
  - 新增回归测试：`tests/story-regression.test.js`（固定种子 + 固定分支序列）。
  - `package.json` 新增：
    - `check:story:paths`
    - `check:story:lint`
    - `check:story`
- 验证结果：
  - `npm test`：17/17 通过。
  - `npm run check:story` 通过：
    - unique_story_paths: 326
    - avg_branch_nodes_per_run: 8.515
    - branch_exclusive_event_ratio: 0.621
    - top10_event_repeat_ratio: 0.96（仍高，后续需继续优化中后期事件去重策略）
  - Playwright 冒烟：`output/web-game-phaseCD-final`（截图与 state 输出一致）。

## 后续建议
- 优先优化 Deck 段重复率（尤其是中后期高频事件），将 `top10_event_repeat_ratio` 压至 <= 0.45。
- 引入“剧情段落权重衰减/冷却”，降低同主题短期重复出现。

## Hotfix: Vercel 线上 404 修复
- 线上问题：
  - `/app/main.js` 404
  - `/favicon.ico` 404
- 处理：
  - `vercel.json` 增加资源级 rewrite（`/app|/core|/content|/ui|/favicon.ico` -> `/public/...`）。
  - `public/favicon.ico` 改为真实文件（不再依赖符号链接）。
- 结果：
  - 线上验证通过：`/`、`/app/main.js`、`/favicon.ico` 均 200。

## UX + Gameplay 改进（本轮）
- 新增战斗战术操作：
  - `cycle card`：每回合一次，消耗 1 能量，弃置并重抽指定手牌。
  - 支持 API action：`cycle`。
- 操作人性化：
  - 新增“执行建议”按钮：根据当前手牌与敌方 Intent 给出并执行推荐动作。
  - 新增卡牌级“重抽此牌(-1)”按钮。
  - 新增快捷键：`C`（重抽第 1 张牌）。
- UI 强化：
  - 战斗面板新增推荐提示与主操作双按钮布局（结束回合 / 执行建议）。
  - Story 分支选项增加“影响摘要”文案（HP、后续分支、奖励倾向等）。
  - 移动端操作区改为更易点按布局。
- 引擎去重复优化（进行中）：
  - Deck 事件选择增加最近事件冷却与单事件次数上限，减少单局重复刷同事件。
- 质量结果：
  - `npm test` 20/20 通过。
  - Playwright 冒烟通过：`output/web-game-ux-upgrade`。

## V3 重启：微信传播导向重设计（全新玩法）
- 用户反馈结论：旧版“战斗+构筑”玩法不好玩、分享驱动力弱，决定推翻重做。
- 已完成全新前端玩法替换：
  - 7 天短局：`事件 -> 三选一 -> 属性变化 -> 下一天`。
  - 核心属性：现金、体力、心态、人设、热度。
  - 失败条件：任一核心生存属性归零。
  - 结局系统：按分数与存活状态给出不同结局线。
- 微信传播能力：
  - 局末生成挑战码（seed + 结果摘要编码）。
  - 一键复制分享文案（分数 + 结局 + 挑战码）。
  - 支持输入挑战码复刻同局事件序列。
- 人性化操作：
  - 移动端单列大按钮，单手操作优先。
  - 选项前置影响摘要，降低盲选成本。
  - 每局两次性“救命技能”（打盹 / 借钱）提升可控感。
- 代码替换：
  - `app/main.js`（新运行时与分享逻辑）
  - `ui/game-ui.js`（全新渲染与交互）
  - `public/index.html`（全新移动端视觉）
- 文档新增：
  - `docs/product/wechat-mobile-redesign.md`
- 质量结果：
  - `npm test` 20/20 通过。
  - Playwright 冒烟通过：`output/web-game-reboot-v3`。

## V3.1 改进：结局成因解释 + 剧情扩容 + Deepseek 结局故事
- 针对用户反馈优化：
  - 结局页新增“结局成因”模块（短板属性、主要损耗、关键转折日、风险风格提示）。
  - 事件池显著扩容，加入更多都市热点与贴吧语感事件类型（职场、消费、平台纠纷、饭圈、AI焦虑等）。
  - 新增“后续事件触发链”与“属性上下文事件”（如低现金/低体力/高热度触发专属事件）。
- 新增 AI 结局叙事：
  - 新增 API：`POST /api/story/summary`（`api/story/summary.js`）。
  - 新增兜底 API：`POST /api/story-summary`（用于兼容不同路由部署场景）。
  - 结局时将 7 天决策链发送到 Deepseek 生成 120~220 字小故事。
  - 支持环境变量：
    - `DEEPSEEK_API_KEY`（必填）
    - `DEEPSEEK_MODEL`（可选，默认 `deepseek-chat`）
    - `DEEPSEEK_BASE_URL`（可选，默认 `https://api.deepseek.com/v1`）
  - 若未配置 Key，结局页优雅降级显示“暂未生成”。
- 文档同步：
  - `docs/release/release-playbook.md` 增加 Deepseek 环境变量配置说明。

## V3.2 升级：章节式因果链
- 将事件驱动从“轻触发”升级为“7章主线因果链”：
  - 每天事件由前一章选择与当前状态决定，不再随机抽取。
  - 每章包含 `章节名 + 因果来源说明 + 3个分支选择`。
  - 选项支持 `setFlags/clearFlags`，用于后续章节分歧。
- 主线结构示例：
  - 第一章开局压力 -> 第二章债务线/工位线 -> 第三章舆论反噬/缓冲线 ->
    第四章体力线/关系线 -> 第五章热度线/现金线 -> 第六章摊牌线/转型线 ->
    第七章结局之夜。
- UI 更新：
  - 每日事件区显示“章节名”和“因果线说明”。
- 质量结果：
  - `npm test` 20/20 通过。
  - Playwright 冒烟通过：`output/web-game-chapter-chain-start`（state 已显示 `chapter` 与 `causeText`）。

## V3.3 修复：随机开局与章节内随机事件
- 开局随机化：
  - 新增 4 种开局角色模板（属性基线不同）。
  - 开局属性加入小幅随机扰动（jitter），避免“每局同属性”。
  - 第一章事件由角色模板对应开局池随机选取。
- 章节随机化：
  - 第二/三章改为“分支事件池随机抽取（带去重）”，不再固定单事件。
  - 后续章节继续基于 flags + 当前属性进行因果分流。
- UI：
  - 状态卡新增“开局角色”显示，方便确认本局初始差异。

## V3.4 增强：事件池扩容与因果链深化
- 第 4~6 章从“单事件模板”升级为“因果分支池随机抽取”：
  - 第4章：`health / relation` 各 2 组事件
  - 第5章：`heat / cash` 各 2 组事件
  - 第6章：`debt / pivot` 各 2 组事件
- 每个分支池维持因果门槛（flags + 属性）并启用去重抽取，保证同线路重复度下降。
- 事件语境补充更多国内社媒/贴吧风格表达（热搜、群聊站队、扣费争议、催款压力等）。
- Deepseek 叙事提示词升级：
  - 明确“贴吧老哥语气”（调侃、刺激、自嘲）
  - 保留边界：不低俗、不攻击具体人群。

## V3.5 临时技能重构：每回合随机刷新（Buff + Debuff）
- 技能机制改造：
  - 从“每局固定两次技能”改为“每回合刷新 2 个随机技能，本回合限用 1 次”。
  - 每个技能都包含明确收益与代价（同时有 buff 与 debuff），强化取舍感。
  - 回合推进（Day+1）后自动重置技能使用次数并重新抽取技能池。
- 运行时实现：
  - `app/main.js` 新增 `TEMP_SKILL_POOL` 与 `drawTempSkills()`。
  - `session` 新字段：`skillOffers`、`skillUsedDay`。
  - `useSkill()` 改为读取当回合技能卡并记录历史。
- UI 实现：
  - `ui/game-ui.js` 技能区改为动态渲染技能卡，标题更新为“每日刷新，限用一次”。
  - 增加“本回合已使用/可用”提示文案，提升可理解性。

## V3.6 模式升级：100天目标 + 无限生存
- 游戏目标调整：
  - 从“7天结局”改为“100天为首个通关目标”，但不再因天数自动结算。
  - 仅在核心生存属性归零时触发结算与结局页。
- 事件运行时调整：
  - 删除第7天一次性结局事件终止逻辑。
  - 开局事件后，章节 2~6 改为循环因果阶段（按 flags + 属性动态分流），支持长期游玩。
- 展示文案调整：
  - 标题改为“是男人就坚持100天”。
  - 进行中状态显示 `Day 当前/100`，达成 100 天后显示“可继续挑战”提示。
  - 分享文案改为“坚持了 X 天”。
