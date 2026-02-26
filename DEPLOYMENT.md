# Vercel 部署说明（当前架构）

## 架构

- 静态站点输出目录：`public`
- Serverless API：`api/*.js`
- Vercel 配置：`vercel.json`

当前 `vercel.json`：

```json
{
  "outputDirectory": "public",
  "functions": {
    "api/*.js": {
      "maxDuration": 30
    }
  }
}
```

## 部署步骤

### 1. 登录

```bash
vercel login
```

### 2. 生产部署

```bash
vercel --prod
```

### 3. 验证

- 主页：`https://<your-domain>/`
- 游戏：`https://<your-domain>/game/`
- API（示例）：

```bash
curl -sS -X POST https://<your-domain>/api/mud/run \
  -H 'Content-Type: application/json' \
  -d '{"action":"new","name":"测试员"}'
```

## 常见问题

### 1) 页面可打开但游戏无事件

先检查事件包是否存在：

- `/data/events/event-deck.json`
- `/data/events/arc-events.json`

### 2) 发布后行为异常

在本地先运行：

```bash
npm run check:events
npm run check:replay
```

### 3) CLI 远程模式失败

确认线上 `/api/mud/run` 可访问；或使用本地模式：

```bash
mud-cli --mode local
```
