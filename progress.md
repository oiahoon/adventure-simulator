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
