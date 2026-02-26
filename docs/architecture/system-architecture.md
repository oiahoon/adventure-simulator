# 系统架构与分层（2026-02-26）

## 目标

保证以下能力可独立演进：

- 后端逻辑与前端 UI/UX 分离
- Web / CLI 可替换壳层
- 事件引擎可独立维护与内容更新

## 当前分层

### 1) Core Domain（共享业务核心）

- `core/mud-engine.js`
  - 负责 MUD 回合推进、状态变更、抉择处理
  - 对外暴露 `createMudService().runAction(payload)`
  - 不依赖 Express、DOM、终端 UI

- `core/mud-presenter.js`
  - 负责纯文本战报格式化
  - 提供 CLI 请求识别方法（header/user-agent）

### 2) Adapter Layer（接入层）

- `api/index.js`（HTTP Adapter）
  - 仅处理路由、HTTP 状态码、JSON/文本响应
  - 通过 Core 处理业务动作，不再维护独立游戏规则

- `bin/mud-cli.js`（Terminal Adapter）
  - 仅处理命令输入与界面刷新
  - `local` 模式直接调用 Core
  - `remote` 模式调用 `/api/mud/run`

### 3) Frontend Layer（Web UI）

- `public/game/index.html`
- `public/assets/styles/idle-mud.css`
- `public/src/idle-mud.js`

说明：Web 当前仍包含独立运行时与事件引擎逻辑（单机前端驱动）。UI 与逻辑在同文件，属于下一阶段拆分对象。

### 4) Event Content & Quality Tooling

- 数据包：`public/data/events/*.json`
- 热点包：`public/data/events/hotpacks/*.json`
- 校验：`scripts/check-events.js`
- 回放：`scripts/replay-lib.js` + `scripts/check-replay.js`
- 链路压测：`scripts/analyze-event-chains.js`

## 本轮架构改进

1. 消除 API/CLI 双份规则实现：
   - 将重复的 run 逻辑统一到 `core/mud-engine.js`
2. 输出职责收敛：
   - 文本战报逻辑移入 `core/mud-presenter.js`
3. API 回归薄层：
   - `api/index.js` 只做输入/输出适配，不含业务细节
4. CLI 回归薄层：
   - `bin/mud-cli.js` 只负责交互，不再内置引擎规则

## 仍需推进（下一阶段）

1. Web 引擎拆分：
   - 从 `public/src/idle-mud.js` 提取 `web-engine-core`（纯状态机）与 `web-ui-renderer`（DOM 渲染）
2. 统一模型协议：
   - 抽象 `GameState` 与 `GameAction` schema，供 Core/Web/Replay 共用
3. 事件 DSL 与执行器继续解耦：
   - 将 deck/arc 执行解释器从 UI 文件中抽离到独立模块
4. 回放器与运行时语义对齐治理：
   - 每次引擎新增语义，必须同步 replay-lib 并更新 golden case

## 维护约束

- 业务规则禁止直接写在 UI 文件（DOM/终端打印）中
- 新增 action 时：先改 Core，再改 API/CLI/Web 适配
- 事件内容变更必须经过：`check:events` + `check:replay` + 链路压测
