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
- 生产域名返回 200 且页面标题为 `城市生存7天`

## Deepseek 结局叙事（Vercel 环境变量）

- 必填：`DEEPSEEK_API_KEY`
- 可选：`DEEPSEEK_MODEL`（默认 `deepseek-chat`）
- 可选：`DEEPSEEK_BASE_URL`（默认 `https://api.deepseek.com/v1`）

说明：
- 结局页会请求 `POST /api/story/summary` 生成“整局故事”。
- 若未配置 `DEEPSEEK_API_KEY`，页面会显示“暂未生成”。
