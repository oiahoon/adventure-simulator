# Vercel 自动部署说明

本仓库已新增工作流：
- `.github/workflows/vercel-deploy.yml`

## 触发规则
- `pull_request -> main`：只跑测试，不部署
- `push -> main`：先跑测试，再部署
- `workflow_dispatch`：手动触发

## 部署策略（自动二选一）
- 优先 `Deploy Hook`：如果配置了 `VERCEL_DEPLOY_HOOK_URL`
- 退回 `Vercel CLI`：当没有 Hook，但存在以下密钥时
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

## 建议配置
1. 如果仓库已绑定 Vercel 项目，推荐只配置 `VERCEL_DEPLOY_HOOK_URL`，最简单稳定。
2. 如果你希望在 Action 内直接构建并发布，配置 CLI 三个密钥。

## 本地验证
- 测试：`npm test`
- 本地静态服务：`npm run dev`
- 平衡模拟：`npm run simulate -- 50`
