# 系统架构总览

## 分层

### 1) Core Domain

- `core/mud-engine.js`
  - 统一对外入口：`createMudService().runAction(payload)`
- `core/run/engine.js`
  - 单局流程状态机（battle/reward/map/victory/defeat）
- `core/battle/engine.js`
  - 回合战斗结算与状态系统
- `core/mud-presenter.js`
  - CLI 文本输出格式化

### 2) Adapter Layer

- `api/*`
  - HTTP 输入输出适配，禁止内嵌业务规则
- `bin/mud-cli.js`
  - CLI 交互适配，local/remote 共用 action 协议

### 3) Frontend Layer

- `app/main.js`
  - Web 应用编排与 UI 状态绑定
- `ui/game-ui.js`
  - 纯渲染与事件绑定
- `public/index.html`
  - 壳层与样式

### 4) Content Layer

- `content/cards.js`
- `content/enemies.js`

## 约束

- 新规则必须先进入 Core，再接入 API/CLI/Web
- UI 层不允许写业务判定
- 所有端必须通过统一 action 协议访问 Core
