# 当前状态审计（2026-02-28）

## 目标

- 识别冗余文件与过期文档。
- 统一“文档描述”与“线上行为”。

## 本次清理

- 删除过期文档：
  - `docs/product/gameplay-design.md`
  - `docs/product/mobile-ux-spec.md`
  - `docs/product/product-brief.md`
  - `docs/engineering/refactor-plan.md`
  - `docs/engineering/story-branch-expansion-plan.md`
  - `docs/release/release-checklist.md`
- 删除冗余根目录图标占位文件：`favicon.ico`（根目录，空文件）。
- 新增基线文档：`docs/product/game-design-baseline.md`。

## 仍保留的历史/兼容模块

- `core/*`、`tests/*`、`scripts/check:story*` 仍保留，作为历史运行时与回归资产。
- 当前线上主玩法主要由 `app/main.js + ui/game-ui.js + public/index.html` 驱动。

## 后续建议

1. 若确认不再回到战斗构筑玩法，可在下一轮删除 `core/battle` 与关联测试脚本。
2. 将“Top3 关键因果节点”做成结构化输出，补齐事件复盘规范。
3. 为移动端布局新增截图回归，避免后续样式回退。
