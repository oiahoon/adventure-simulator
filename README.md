# 都市生存模拟器（单机文字 MUD）

面向移动端的单机文字游戏：掷骰开局，每回合打出决策卡，触发因果事件链，最终生成可分享战报。

## 当前状态

- Web 游戏入口：`/game/`
- Web 兼容入口：`/game-v2/`（等价于 v2）
- 经典页面：`/game-classic/`（重构前卡牌壳）
- Legacy 页面：`/game-legacy/`（旧 Web 壳层归档）
- 项目主页：`/`
- CLI：`mud-cli`（远程/本地模式）
- 共享核心：`core/mud-engine.js`（API/CLI 共用）
- Web 核心玩法：每回合 3 选 1 决策卡（手动推进）
- 事件引擎：`Queue -> Arcs -> Decks`
- 事件数据包：`public/data/events/*.json`
- v2 卡牌数据包：`public/data/cards-v2/*.json`
- 年度热点包：`public/data/events/hotpacks/*.json`（按日期自动激活）
- 已有工程检查：
  - `npm run check:events`
  - `npm run check:replay`
  - `npm run check:replay:v2`

默认引擎版本：
- API 默认 `v2`（可传 `engineVersion: "v1"` 回退）
- CLI 默认 `v2`（可用 `--engine v1` 回退）
- Web 默认 `v2`（`/game`）

## 快速开始

### 1) 安装依赖

```bash
npm install
```

### 2) 本地启动静态页面

```bash
python3 -m http.server 8080
```

访问：

- 主页：`http://localhost:8080/`
- 游戏：`http://localhost:8080/game/`
- 兼容入口：`http://localhost:8080/game-v2/`
- 经典页面：`http://localhost:8080/game-classic/`
- legacy 页面：`http://localhost:8080/game-legacy/`

UI 变体参数（便于 A/B）：
- `http://localhost:8080/game/?uiVariant=single`
- `http://localhost:8080/game/?uiVariant=hand`

`/game` 页面内置“实验指标（A/B）”面板，可查看累计局数、胜率、滑动占比、分享转化，并支持导出 `ux-analytics.json`。
服务端提供轻量埋点通道：
- `POST /api/ux/track`
- `GET /api/ux/summary`

### 3) 本地命令行游玩

```bash
npm run mud:cli
```

## CLI 使用

### 全局安装

```bash
npm i -g git+ssh://git@github.com/oiahoon/adventure-simulator.git
```

### 运行

```bash
mud-cli
mud-cli --base-url https://adventure-simulator.vercel.app
mud-cli --mode local
```

CLI 与 API 现使用统一卡牌动作协议：`new / status / draw / play / discard / defer / prefer / choose`。
可通过 `engineVersion` 切换引擎：
- `v2`：当前默认线
- `v1`：legacy 兼容线

## 事件引擎开发

### 数据包

- `public/data/events/event-meta.json`
- `public/data/events/arc-config.json`
- `public/data/events/arc-events.json`
- `public/data/events/event-deck.json`
- `public/data/events/hotpacks/index.json`
- `public/data/events/hotpacks/*.json`

### 校验

```bash
npm run check:events
npm run check:cards:v2
```

### 回放

```bash
npm run check:replay
npm run check:replay:v2
```

golden cases：`tests/replay/golden-cases.json`
golden cases(v2)：`tests/replay-v2/golden-cases.json`

## 部署（Vercel）

本项目使用静态输出目录 `public` + `api/*.js` serverless function。

```bash
vercel --prod
```

详细见：`DEPLOYMENT.md`。
热点包维护见：`docs/architecture/hotpack-workflow.md`。

## 目录（当前）

```text
api/                      # serverless API
core/                     # 共享核心（业务引擎/文本输出）
bin/mud-cli.js            # CLI 入口
public/index.html         # 主页
public/game/index.html    # 游戏页面
public/game-classic/index.html # 经典卡牌页面
public/game-legacy/index.html # legacy 页面
public/src/card-runtime-v3.js # 重构版前端运行时
public/data/events/       # 事件数据包
docs/                     # 架构与规则文档
docs/architecture/system-architecture.md  # 当前分层与维护边界
scripts/check-events.js   # 事件包检查
scripts/check-replay.js   # 回放检查
tests/replay/             # golden 回放样例
```

## License

MIT
