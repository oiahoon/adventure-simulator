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
