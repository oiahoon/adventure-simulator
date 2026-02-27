# 发布与部署手册

## 发布前检查

- 功能闭环：战斗、奖励、删牌、节点推进
- 质量：`npm test` 全绿
- 体验：移动端可用性验证

## 自动部署

- 工作流：`.github/workflows/vercel-deploy.yml`
- 触发：`push main` 自动测试并部署
- 部署策略：
  - 优先 Deploy Hook（`VERCEL_DEPLOY_HOOK_URL`）
  - 其次 Vercel CLI（`VERCEL_TOKEN` + `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID`）

## 线上核对

- GitHub Actions 最近 run 成功
- Vercel commit status 为 success
- 生产域名返回 200 且页面标题为 `Neon Deck`
