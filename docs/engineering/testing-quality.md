# 测试与质量策略

## 测试分层

- 单元测试：battle/run/mud-service
- 流程测试：关键动作链（new -> play/end -> reward -> next）
- 冒烟测试：Playwright 截图 + `render_game_to_text`

## 质量门禁

- PR 必须通过 `npm test`
- 发布前至少一轮 Playwright 冒烟
- 关键改动需更新 `progress.md`

## 观测指标（当前）

- 自动模拟胜率（`npm run simulate`）
- 平均终局 HP
- 平均牌组规模
