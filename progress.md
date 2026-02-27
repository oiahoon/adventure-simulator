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
