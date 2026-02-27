# 系统架构总览（当前线上版本）

## 分层

### 1) Frontend Runtime（主路径）

- `app/main.js`
  - 游戏状态机、事件结算、因果链/压力链/延迟后果、分享文案。
- `ui/game-ui.js`
  - 纯渲染和事件绑定（不写业务规则）。
- `public/index.html`
  - 页面壳层、移动端样式与轻量动效。

### 2) API Layer

- `api/story/summary.js`
  - 结局故事生成接口（DeepSeek）。
- `api/story-summary.js`
  - 兼容路由别名。
- `api/health.js`
  - 健康检查。

### 3) Content Layer

- 事件与技能内容当前以内联配置为主（`app/main.js`）。
- 贴吧采集结构化种子保留在 `content/tieba-event-seeds.js`，用于后续扩容。

### 4) Legacy Runtime（保留）

- `core/*`、`api/mud/*`、`bin/mud-cli.js`、相关测试与脚本。
- 用途：历史能力兼容、回归资产，不是当前线上主玩法入口。

## 关键约束

- UI 层只做渲染和交互，不做复杂规则判断。
- 对外部署以 `/public/index.html` 为主入口。
- 线上结局叙事依赖 DeepSeek 环境变量配置。
