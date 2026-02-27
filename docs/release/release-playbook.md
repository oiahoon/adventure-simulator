# 发布与部署手册（当前版本）

## 发布前检查

- 功能闭环：事件三选一、每日技能、结局复盘、分享复制。
- 质量门禁：`npm test` 全绿。
- 体验核对：手机竖屏首屏可快速触达事件操作区。

## 自动部署

- 工作流：`.github/workflows/vercel-deploy.yml`
- 触发：`push main` 自动测试并部署。
- 部署策略：
  - 优先 Deploy Hook（`VERCEL_DEPLOY_HOOK_URL`）
  - 其次 Vercel CLI（`VERCEL_TOKEN` + `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID`）

## 线上核对

- GitHub Actions 最近 run 成功。
- Vercel 生产部署 commit 与 `main` 最新提交一致。
- 生产域名返回 200，页面标题为 `是男人就坚持100天`。
- 首屏不出现“挑战码导入/复刻”入口。

## DeepSeek 环境变量

- 必填：`DEEPSEEK_API_KEY`
- 可选：`DEEPSEEK_MODEL`（默认 `deepseek-chat`）
- 可选：`DEEPSEEK_BASE_URL`（默认 `https://api.deepseek.com/v1`）

说明：
- 结局页请求 `POST /api/story/summary` 生成“整局故事”。
- 若未配置 `DEEPSEEK_API_KEY`，前端显示“暂未生成”。
