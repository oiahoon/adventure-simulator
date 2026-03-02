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

## V3.7 贴吧热帖采集补库（2026-02-27）
- 使用移动端贴吧入口（`wapp.baidu.com/f?kw=`）按指定吧名进行抓取，规避 PC 端安全验证拦截。
- 新增结构化素材库：`content/tieba-event-seeds.js`（34 条，含 sourceTitle/sourceUrl/hook/tags）。
- 新增采集报告：`docs/product/tieba-hot-posts-collection-2026-02-27.md`。
- 覆盖吧：
  - 已抓取：`中国/时事/民生/打工人/失业/考公/房价/程序员/高考/考研/留学/润(检索)/成都/上海/北京/深圳/弱智`
  - 未抓取到有效吧页：`社会吧`（返回无相关内容，后续建议切换同义吧名补采）。

## V3.8 UI HUD 改版：头像 + RPG 血条状态
- 状态展示从“5个数字卡片”改为“右侧血条 HUD”：现金/体力/心态/人设/热度显示为 0~10 对应的进度条。
- 状态区布局改为“左头像 + 右状态条”，更接近网络游戏信息区。
- 新增 DiceBear 拟人化随机头像：每局随机风格与 seed，渲染 URL 注入 view（`adventurer / adventurer-neutral / avataaars`）。
- 移动端适配：头像缩小并与状态条纵向排布，保持单手阅读体验。
- 验证：`npm test` 20/20 通过。

## V3.9 Hotfix：临时技能与日事件偶发冲突 + 技能重复率优化
- 修复“点临时技能后日常事件偶发刷新/首击不生效”问题：
  - 新增当日事件缓存 `cachedEvent/cachedEventDayIndex`。
  - `buildView` 与 `applyChoice` 统一改用 `getCurrentEvent(session)`，同一天内事件固定，不再因 `refresh()` 随机变动。
- 修复事件选项偶发需要点两次的问题：
  - 由于之前 `applyChoice` 会再次随机解析事件，导致 UI 所见事件与逻辑事件不一致；已通过事件缓存彻底消除。
- 优化临时技能重复问题：
  - 新增技能冷却队列 `skillCooldownIds`（最近 4 个技能 ID）。
  - 每日刷新时优先从非冷却池抽取，降低连续刷出同技能概率。
- 验证：`npm test` 20/20 通过。

## V3.10 文案收敛 + 热梗化技能/事件扩容
- 文案收敛：
  - 移除“目标通关100天，但你可以一直活下去”。
  - 移除“扛住100天是第一目标，之后还能继续冲纪录”。
  - 移除进行中“已达成100天目标，可继续挑战”提示。
  - 保留核心口径：挑战就是坚持100天。
- 临时技能扩容（热梗化且保留取舍）：
  - 新增 6 个技能：`蹭热搜发癫 / 99+群聊静音 / 朋友圈硬装体面 / AI副业冲KPI / 凌晨emo长文 / 砍价圣体附体`。
  - 每个技能均为 `buff + debuff` 组合。
- 日常事件扩容（保持因果链分流不变，仅增加分支池容量）：
  - 新增事件节点：`work_followup_c / public_backlash_c / stable_branch_c / relation_pull_c / heat_branch_c / cash_branch_c / pivot_end_c`。
  - 仍由既有 flags + 属性门槛进入对应章节分支，因果链不破坏。
- 验证：`npm test` 20/20 通过。

## Copy Tone Upgrade（结局总结口语化）
- 调整结局成因文案映射：`buildEndingReason()` 不再输出“现金/体力/心态/人设”，改为“兜里余额/精力槽/情绪值/口碑面子”等生活化表达。
- 调整疲劳惩罚提示语：由“心态/人设下降”改为“情绪值/口碑面子下降”。
- 更新 DeepSeek 总结提示词：
  - 新增硬性要求，禁止直接使用“现金/体力/心态/人设/热度”术语。
  - 引导统一使用贴吧语境更自然的替代表达。
  - `最终属性` 改为 `最终状态` 并使用口语化别名。
- 质量验证：`npm test` 20/20 通过。

## Share Link Upgrade（分享文案可直达）
- 复制分享文案新增 `挑战链接`，链接自动携带 `?challenge=<挑战码>`。
- 新增 URL 导入逻辑：访问带 `challenge` 参数的链接时，自动解析挑战码并直接进入对应开局（无需手动粘贴）。
- 兼容兜底：若无法构建链接则保留原有“同链接输入挑战码”文案。
- 质量验证：`npm test` 20/20 通过。

## Share Simplify（移除挑战码复刻）
- 移除挑战码机制：删除编码/解码与 URL challenge 参数导入逻辑。
- 分享文案改为仅复制普通游戏链接（不携带 seed/挑战码）。
- UI 清理：
  - 首页移除“导入朋友挑战码”模块。
  - 结算页移除挑战码展示。
  - 文案改为“生成分享文案”。
- 质量验证：`npm test` 20/20 通过。

## Hotfix: 首页旧挑战模块缓存残留
- 增加静态资源版本参数以强制刷新缓存：
  - `public/index.html` -> `./app/main.js?v=20260227_1`
  - `app/main.js` -> `../ui/game-ui.js?v=20260227_1`
- 目的：避免用户继续命中旧版 JS（仍显示“导入朋友挑战码”模块）。
- 验证：`npm test` 20/20 通过。

## Gameplay Tuning: 难度提升与反套路化
- 新增隐性压力系统（`debt/burnout/scrutiny`）：
  - 玩家选择会累积不同类型压力；同风格连选会额外叠压。
  - 压力达到阈值会触发系统性损耗（例如债务溢出/过劳溢出/舆论溢出）。
- 新增延迟连锁后果：
  - 部分选择不会立刻结算全部影响，而会在后续 1~2 天回收。
  - 连锁后果写入“最近决策链”，保证可复盘。
- 因果路由增强：
  - 章节事件分流新增对隐性压力的判定，不再只看即时属性与明面 flag。
- 结局复盘增强：
  - 结局成因增加“延迟连锁后果触发次数”提示，帮助理解失败来源。
- 质量验证：`npm test` 20/20 通过。

## Gameplay Tuning Round 2：动态成功率与反刷套路
- 新增动态结果机制：同类标签决策使用越多，翻车率越高，爆发率越低。
- 结果改为“临场结算”：
  - 可能出现 `（翻车）`：收益打折并追加对应代价。
  - 少量出现 `（超常发挥）`：额外收益。
- 翻车率受多因子影响：
  - 当前压力总量（债务/过劳/舆论）
  - 同标签历史使用次数
  - 连续同风格决策次数
  - 事件标签类型（risk/work/social/content 风险更高）
- 历史记录显示真实落地结果（不再只显示卡面理论值）。
- 结局成因新增“临场翻车次数”提示，复盘更清晰。
- 缓存刷新：前端资源版本号升级为 `v=20260227_2`。
- 质量验证：`npm test` 20/20 通过。

## UI/UX 微动效与轻反馈
- 新增轻量级视觉动效（不改变交互流程）：
  - 卡片入场微位移动画（`cardIn`）。
  - 按钮/事件选项悬停与按压反馈（亮度、阴影、轻微缩放）。
  - 顶部副标题闪提示动画（用于轻反馈）。
- 新增“复制分享文案”反馈：
  - 成功时显示短提示“分享文案已复制”。
  - 不支持 clipboard 时回落 `prompt`，并提示“已打开复制窗口”。
  - 提示自动 1.4 秒消失，不遮挡主界面。
- 无障碍与舒适性：增加 `prefers-reduced-motion: reduce`，系统偏好减少动效时自动关闭动画/过渡。
- 缓存刷新：前端资源版本号升级为 `v=20260227_3`。
- 质量验证：`npm test` 20/20 通过。

## Mobile Layout Compact Pass（首屏操作优先）
- 状态区改为紧凑布局：头像固定左侧、五条状态条固定右侧同屏显示。
- 状态条由双行改为单行（名称 + 进度 + 数值），显著压缩高度。
- “开局角色”从头像区移到标题下，减少头像卡占高。
- 事件卡与选项间距和字体微缩，提升首屏可见内容密度。
- 手机断点下保持 `头像左 / 状态右`，不再堆叠为上下结构。
- 缓存刷新：前端资源版本号升级为 `v=20260227_4`。
- 质量验证：`npm test` 20/20 通过。

## Repo Cleanup + Docs Refresh（2026-02-28）
- 全仓审计后清理过期文档与冗余文件：
  - 删除过期文档（战斗构筑时代）：
    - `docs/product/gameplay-design.md`
    - `docs/product/mobile-ux-spec.md`
    - `docs/product/product-brief.md`
    - `docs/engineering/refactor-plan.md`
    - `docs/engineering/story-branch-expansion-plan.md`
    - `docs/release/release-checklist.md`
  - 删除冗余文件：根目录空 `favicon.ico`、临时目录 `tmp/`。
- 新增并重构文档：
  - 新增 `docs/product/game-design-baseline.md`（当前玩法基线）
  - 新增 `docs/engineering/current-state-audit.md`（清理审计）
  - 重写 `docs/README.md`、`docs/architecture/system-overview.md`、`docs/architecture/action-protocol.md`、`docs/architecture/event-content-strategy.md`、`docs/product/wechat-mobile-redesign.md`、`docs/release/release-playbook.md`。
- 其他整理：
  - 更新根 `index.html` 文案为当前项目名。
  - 移除 `public/index.html` 中已废弃样式（挑战码导入相关样式残留）。
- 质量验证：`npm test` 20/20 通过。

## Baseline Decision Lock（文档基线统一）
- 新增裁决文档：`docs/architecture/baseline-decisions.md`，明确三项基线：
  1) 玩法目标统一为 100 天；
  2) 不再保留挑战码复刻；
  3) Core Action 架构定位为 Legacy 兼容层，前端事件模式为线上主路径。
- `docs/README.md` 增加“基线决议”入口。
- `docs/architecture/system-overview.md` 增加基线裁决引用。

## Gap Fix Pack：Top3复盘 + 100天提示词 + 架构代码对齐
- 结局复盘结构化：`buildEndingReason()` 新增 `review` 字段，包含：
  - `topNodes`（Top3 关键因果节点）
  - `topDecisions`（Top3 关键决策）
  - `chainSummary`（事件链摘要）
- 结局 UI 新增复盘块，直接展示上述 Top3 与链路摘要。
- DeepSeek 请求改为 100 天语境：
  - 提示词从“7天记录”改为“目标100天，实际坚持X天”。
  - 附带 Top3 节点/决策与链路摘要作为输入。
- 架构对齐（代码侧）：
  - `buildView/render_game_to_text` 增加 `runtimeMode: frontend_event_mainline`，明确线上主路径。
- 质量验证：`npm test` 20/20 通过。

## Ending UX Guard（防误触重开）
- 结局页新增重开保护：
  - 结算后 1.2 秒内“再来一局”按钮锁定，避免连续点击误触。
  - 解锁后采用二次确认：首次点击进入确认态（2.5 秒内再次点击才真正重开）。
- 结局页增加明确提示文案（锁定中/确认中/默认防误触说明）。
- 顶部轻提示联动：重开锁定与确认阶段均会显示对应 notice。
- 前端资源版本升级：`v=20260227_5`。
- 质量验证：`npm test` 20/20 通过。

## State Incident Pack（状态驱动随机插曲）
- 新增状态触发临时事件池 `STATE_INCIDENT_POOLS`：
  - 低现金：地铁口讨赏、夜班零工
  - 低心态：夜宵摊买醉、河堤夜风局
  - 低体力：工位断片、地铁坐过站
- 触发机制：
  - 每天先判定是否插入“状态插曲”事件，再回落章节因果事件
  - 触发概率受低状态数量 + 压力值影响
  - 冷却节流：至少间隔 2 天才会再次触发插曲
- 所有插曲继续沿用三选一与状态后果，并带因果说明。
- 缓存刷新：入口脚本版本升级为 `v=20260227_6`。
- 质量验证：`npm test` 20/20 通过。

## Event Audit + 热梗扩容（2026-02-28）
- 当前事件统计（`app/main.js`）：
  - 开局事件：7
  - 状态随机插曲：6
  - 章节事件：33
  - 合计事件：46
  - 合计选项：138
- 新增热点语境事件（保持因果链）：
  - `public_backlash_d` 热搜反转现场
  - `stable_branch_d` 头条副业课刷屏
  - `relation_pull_d` 贴吧内推排队帖
  - `heat_branch_d` 平台规则突改
  - `cash_branch_d` 兼职平台新门槛
  - `pivot_end_d` AI提效焦虑
- 设计原则：事件继续走三选一 + flags/压力/状态回收，不做孤立梗事件。
- 缓存刷新：入口脚本版本升级 `v=20260227_7`。
- 质量验证：`npm test` 20/20 通过。

## UI Smoothness Pass（头像对齐 + 防闪烁）
- 渲染层重构：`ui/game-ui.js` 改为“模式切换时建壳 + 进行中局部更新”，不再每次操作整页 `innerHTML` 重建。
- 头像节点常驻：仅在 `avatar.seed` 变化时更新 `src`，避免操作时头像重复加载与闪烁。
- 状态区布局优化：头像放大并与右侧状态栈同高（`--avatar-size`），视觉对齐更稳定。
- 去除卡片入场动画（这是操作后闪烁主因），保留按钮级轻反馈。
- 新增轻反馈：选项/技能点击时添加瞬时 `tap-fx`，不打扰但有“按下感”。
- 前端资源版本升级：`v=20260227_8`。
- 质量验证：`npm test` 20/20 通过。

## Share Upgrade（微信分享 + 预览图尝试）
- 结局页新增 `微信分享` 按钮：
  - 优先调用 `navigator.share`（系统分享面板）。
  - 不支持时自动回退：复制分享链接或 `prompt`。
- 新增分享落地页：`/api/share?d=...`
  - 输出 `og:title/og:description/og:image`，用于微信/社交卡片预览。
  - 页面快速跳转回游戏主页。
- 新增动态预览图接口：`/api/share-image?d=...`
  - 生成 SVG 分享图（含玩家头像、结局、分数、生存天数）。
- 分享文案中的链接切换为带预览能力的分享链接。
- 前端资源版本升级：`v=20260227_9`。
- 质量验证：`npm test` 20/20 通过。

## Growth Causal Chain Upgrade（成长解锁 + 事件退场 + 重复控制）
- 新增成长节点事件池 `GROWTH_EVENT_POOL`（4 条）：
  - 债务生存术、边界感升级、舆论打法升级、稳定后经营。
  - 通过里程碑解锁（`debt_veteran / burnout_veteran / public_figure / stability_reached`）。
- 新增里程碑系统：按状态/压力/flags 自动标记成长阶段。
- 新增事件退场规则 `EVENT_RETIRE_RULES`：
  - 达到指定里程碑后，部分早期事件不再出现（实现“经历过后世界状态改变”）。
- 新增重复控制策略：
  - 事件级 `noRepeat / maxRepeats` 支持。
  - 默认重复上限 + 按事件前缀（opening/incident/growth）限制。
  - 事件选择优先 strict eligibility，不可用时才软回退，避免剧情池枯竭。
- 运行时状态新增：`milestones / eventSeenCount / lastGrowthDay`。
- 前端资源版本升级：`v=20260227_10`。
- 质量验证：`npm test` 20/20 通过。

## Ending Copy Refresh（结局文案升级）
- 失败结局命名替换：移除“城市崩溃线”，改为更贴合项目语境的多候选名（如“都市掉线线/现实失速线”等）。
- 失败副文案升级为多版本随机展示，避免重复“被现实按下暂停键”。
- 中高分结局也增加随机文案池，提升重复游玩新鲜感。
- 结局页改版：移除“本局分数 | 历史最高”，改为“本局坚持 X 天”。
- 缓存刷新：前端资源版本升级为 `v=20260227_11`。
- 质量验证：`npm test` 20/20 通过。

## Daily Upkeep + Forced Survival Events（2026-02-28）
- 新增每日自然消耗：
  - 每天决策结算后自动扣除基础生活成本（现金/体力），低现金与高热度会额外压低情绪。
- 新增“补给商店（每日限购一次）”：
  - 三档食物（低价/中价/高价）对应不同开销与体力恢复，并带额外状态代价。
  - 现金不足时不可购买，购买后立即生效并写入决策链。
- 新增低状态强制事件系统：
  - 低体力时按概率触发生病强制事件（轻症/重症），当天只能先处理看病线。
  - 极低现金时按概率触发断粮强制事件（街头求生/借钱/硬撑）。
  - 强制事件加入事件因果链与历史复盘，不再是孤立弹窗。
- 事件调度升级：
  - `resolveEvent` 增加强制事件优先级（开局后优先于成长事件/随机插曲/章节事件）。
  - 会话状态新增 `forcedEventQueue / activeForcedEventId / foodUsedDay`。
- 前端交互升级：
  - `ui/game-ui.js` 增加补给区与 `onBuyFood` 交互绑定。
  - 主入口缓存版本升级：`v=20260228_12`。
- 质量验证：`npm test` 20/20 通过。

## UI Pixel Pass: 事件按钮与模块元素化增强
- 事件选项按钮新增像素徽记（按 tag 着色）、像素角标、扫描线/网格底纹。
- 选项卡内边距与结构调整，突出“图标 + 标题 + 标签”层级。
- 技能/补给模块按钮增加像素虚线内框与折角装饰，提升卡牌质感一致性。
- 顶层缓存版本更新到 `v=20260228_23`（`public/index.html` + `app/main.js`）。
- 待验证：移动端视觉密度与点击态反馈是否仍清晰。

## UI Layout Replan v2 (素材布局导向)
- 设计原则从“素材铺满”改为“素材点缀”：
  - 卡片主背景回归统一浅色底，素材仅作为右侧局部水印。
  - 保留可读性优先，像素元素承担风格识别，不干扰信息层级。
- 事件按钮改造：事件素材由 cover 改为右侧定点水印，配合像素角标与徽记。
- 技能/补给模块改造：去掉整卡硬铺素材，改为统一底色 + 右侧水印 + 折角，减少视觉噪点。
- 目标：形成“信息块-行为块-反馈块”三级结构，素材只增强辨识度。

## UI Layout Replan v3 (Logo & 元素前景化)
- Header 改为中尺寸 `logo-main`，在不占大首屏的前提下恢复可读性。
- 事件选项卡素材改为前景组件：左侧图章(`opt-mark`) + 右侧贴片(`opt-art`)；不再依赖整卡背景图。
- 技能/补给按钮素材改为前景贴片(`module-decal`)，并给按钮留出专用装饰栏位，强化图文融合。
- 保留统一浅色底、统一边框体系，素材负责识别和趣味，不干扰文字阅读。
- 缓存版本提升至 `v=20260228_25`。

## UI Fix v4 (Corner归位 + 背景图归位)
- 按用户反馈重构：corner装饰仅位于组件角落（option右上、模块右上）。
- 事件按钮恢复“整块背景图”模式：`event-option-card.png` 作为按钮整体背景，不再局部贴片。
- 技能/补给按钮恢复“整块背景图”模式：`skill-card.png / supply-card.png` 作为按钮整体背景。
- 删除不协调的右侧大图框装饰，保留内嵌图章与标签图标。
- 缓存版本升级到 `v=20260228_26`。

## UI 元素风改造（v5）
- 卡片/文字区块从“边框卡片”改为“底色面板 + 四角装饰件（四角统一定位）”。
- 事件选项按钮改为“整块素材背景按钮 + 四角件 + 内嵌图章/标签图标”。
- 技能/补给按钮改为“整块素材背景按钮 + 四角件”，移除割裂感强的外挂贴片。
- `reason-block` 同步改为四角装饰面板样式，弱化传统 border。
- 前端缓存版本升级：`v=20260228_27`。
- 素材生成尝试：调用 OpenAI Image API 生成 `event-option-card-v2` 时失败，返回 `billing_hard_limit_reached`（非网络问题）。

## Logo Regeneration
- 使用更新后的 API key 通过 imagegen 重新生成 `logo-main`，改为无文字简洁像素徽章，避免中文错字。
- 为规避缓存，新增并接入 `public/assets/pixel/brand/logo-main-v2.png`。
- UI 引用已切换到 `logo-main-v2.png`，并将前端缓存版本提升到 `v=20260228_28`。

## 文档补充：剧情梳理与 us-killline 对比
- 新增 `docs/product/storyline-map-and-us-killline-diff.md`。
- 内容包含：当前剧情架构梳理、主线/支线候选扩展、与 us-killline 的产品层差异矩阵。
- 说明对比前提：仓库内无 us-killline 源码/文档，先采用范式对比，待后续材料补全后升级为实现级对比。
- `docs/README.md` 已加入该文档入口。

## 100天分段式长线改造（设计+实现）
- 事件调度从“5阶段循环（取模）”改为“按天数区间分段推进”。
- 新分段：Day2-15、16-32、33-52、53-76、77-100 对应第二到第六章。
- Day101+ 改为后期动态延展段（按压力态势在第3/4/5阶段中动态抽取），支持持续游玩。
- 文档更新：
  - `docs/product/current-gameplay-mechanics.md` 新增 100 天分段主线说明。
  - 新增 `docs/product/segmented-longline-100day-design.md`。
  - `docs/README.md` 增加入口。

## 对比 us-killline 的劣势与改进
- 新增文档：`docs/product/us-killline-gap-improvement-plan.md`。
- 输出内容：当前劣势识别（中后期爬坡、反制深度、里程碑反馈、复盘闭环、视觉统一性）+ P0/P1/P2 改进路线。
- 同步更新 `docs/README.md` 文档入口。

## P0 开始落地（第一批）
- 新增分段规则效果（按阶段每日结算附加效果），从机制层拉开中后期差异。
- 新增里程碑事件：Day 25/50/75/100，高优先级插入并强制路线再选择。
- 结算页新增“下局三条建议”，根据本局短板、风险使用与连锁后果生成可执行建议。
- 更新实现文档：`current-gameplay-mechanics.md`、`segmented-longline-100day-design.md`。
- 前端缓存版本升级到 `v=20260228_30`。

## P0 第二批（进行中）
- 里程碑专属反馈：事件卡新增里程碑提示文案 + 徽章轻动画，里程碑事件更易识别。
- 里程碑完成提示：里程碑选项结算后写入 notice，明确“后续阶段节奏已更新”。
- 结算建议联动分享：`nextRunTips` 第一条接入分享文案与分享 payload。
- 前端缓存版本提升到 `v=20260228_31`。

## 2026-03-02 Wang骚猪专线增强（30岁分手背景）
- 角色设定更新：`王骚猪（30岁小有成就打工人）`，开局文案改为“分手后周一”场景。
- 专属剧情线更新：围绕分手后现金流重排、情绪管理、职场体面、再就业分岔等节点，替换原“中年家庭责任”叙事。
- 专属技能池新增 6 个技能：
  - 前任已读缓冲术
  - 简历抛光冲刺
  - 老本行救火
  - 深夜散步断网
  - 合租降本重排
  - 朋友圈体面更新
- 技能抽取机制改造：`wang_saozhu` 每日技能刷新仅从专属技能池抽取（含冷却逻辑）。
- 头像素材接入：新增 `public/assets/pixel/avatars/wang-saozhu/*.png` 四阶段头像并绑定到纸娃娃阶段池。
- 技能图标接入：新增 `public/assets/pixel/skills/wang-saozhu/*.png` 并绑定到技能 icon 映射。
- 资源缓存版本更新：`main.js?v=20260302_34`。
- 验证：`npm test` 20/20 通过，`node --check app/main.js` 通过。
- 备注：Playwright 冒烟未执行成功（本机缺少 `playwright` 依赖）；图片 API 在线生成受网络/额度波动影响，本次先使用本地像素素材重制方案确保可上线。

## 2026-03-02 Image Regen Recovery
- 验证新 OpenAI token 可用：
  - 在受限沙箱内 `api.openai.com` DNS 解析失败；
  - 在外部网络权限下，`curl https://api.openai.com/v1/models` 成功返回模型列表。
- 已重新生成并覆盖此前占位/跳过素材：
  - `public/assets/pixel/cards/event-option-card-v2.png`（历史上因 `billing_hard_limit_reached` 跳过）
  - 王骚猪专属头像 4 张（early/mid/late/crisis）
  - 王骚猪专属技能图标 4 张
- 已将事件选项按钮背景切换到 `event-option-card-v2.png`。

## 2026-03-02 UIUX Iteration: Directional Corners + Readability Cleanup
- 问题复盘（基于最新截图）：
  - 四角装饰使用同一朝向，视觉上不符合“组件框角”逻辑。
  - 顶栏仅剩小图标，品牌识别弱且上方留白感偏重。
  - 事件/按钮纹理层偏重，文字信息优先级被稀释。
- 本轮改进计划与落地：
  1. 角标方向化：新增 gold/blue/green 三套四方向角标（tl/tr/bl/br），并接入 card/option/module/reason 所有角标渲染。
  2. 顶栏重排：logo 改为小徽章 + 可见主标题同排展示，减少空白感并提升识别。
  3. 纹理降噪：降低卡片与事件按钮扫描纹理强度，保留像素感但提升阅读性。
- 资源缓存版本提升：`main.js?v=20260302_36`。
- 验证：`npm test` 20/20 通过，语法检查通过。
