# 都市生存模拟器（单机文字 MUD）

面向移动端的单机挂机文字游戏：掷骰开局，自动推进，关键节点选择，最终生成可分享战报。

## 当前状态

- Web 游戏入口：`/game/`
- 项目主页：`/`
- CLI：`mud-cli`（远程/本地模式）
- 事件引擎：`Queue -> Arcs -> Decks`
- 事件数据包：`public/data/events/*.json`
- 已有工程检查：
  - `npm run check:events`
  - `npm run check:replay`

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

## 事件引擎开发

### 数据包

- `public/data/events/event-meta.json`
- `public/data/events/arc-config.json`
- `public/data/events/arc-events.json`
- `public/data/events/event-deck.json`

### 校验

```bash
npm run check:events
```

### 回放

```bash
npm run check:replay
```

golden cases：`tests/replay/golden-cases.json`

## 部署（Vercel）

本项目使用静态输出目录 `public` + `api/*.js` serverless function。

```bash
vercel --prod
```

详细见：`DEPLOYMENT.md`。

## 目录（当前）

```text
api/                      # serverless API
bin/mud-cli.js            # CLI 入口
public/index.html         # 主页
public/game/index.html    # 游戏页面
public/src/idle-mud.js    # 主引擎
public/data/events/       # 事件数据包
docs/                     # 架构与规则文档
scripts/check-events.js   # 事件包检查
scripts/check-replay.js   # 回放检查
tests/replay/             # golden 回放样例
```

## License

MIT
