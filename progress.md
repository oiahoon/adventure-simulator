Original prompt: 按照这份计划文档，创建开发的计划，根绝计划分阶段开始开发，并阶段性提交代码，直到完全完成这份开发计划。

## M0
- 初始化全新项目结构：core/content/ui/app/public/tests。
- 建立可运行空场景页面，含基础日志面板。
- 暴露 `window.render_game_to_text` 与 `window.advanceTime` 供自动化测试使用。
- 待办：进入 M1 完成战斗核心循环。
- Playwright 自动化已接入，当前可成功渲染页面并产出截图：`output/web-game-m0/shot-0.png`。
- 注意：自动化日志中仍有一个通用 404 console error（未影响主流程加载，服务日志未复现具体缺失文件）。
