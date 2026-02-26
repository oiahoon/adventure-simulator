# 年度热点内容包机制（Hotpacks）

## 目标

在不改引擎代码的前提下，按季度增量更新“新梗/新现实”剧情内容。

## 目录

- 索引：`public/data/events/hotpacks/index.json`
- 分包：`public/data/events/hotpacks/<year>-q<quarter>.json`

## 运行机制

1. 引擎启动时加载主事件包（`event-deck.json`）。
2. 读取 hotpack 索引，按本地日期筛选生效窗口。
3. 加载所有生效分包并按 `priority` 合并到主 deck。

合并规则：

- 事件 `id` 冲突：热点包覆盖主包定义。
- 事件 `id` 不冲突：热点包事件追加。

## 索引格式

```json
{
  "packs": [
    {
      "id": "hotpack-2026-q1",
      "file": "/data/events/hotpacks/2026-q1.json",
      "activeFrom": "2026-01-01",
      "activeTo": "2026-04-30",
      "priority": 20
    }
  ]
}
```

## 分包格式

```json
{
  "id": "hotpack-2026-q1",
  "name": "2026Q1 城市热点包",
  "summary": "季度增量主题",
  "events": [
    {
      "id": "q1-example-event",
      "title": "示例事件",
      "text": "示例文本",
      "deck": "social",
      "tags": ["income", "heat"],
      "baseWeight": 0.9,
      "cooldown": 4,
      "outcomes": [
        {
          "city": { "morale": -2, "heat": 3 }
        }
      ]
    }
  ]
}
```

## 更新流程（每季度）

1. 新增季度文件：`public/data/events/hotpacks/YYYY-qN.json`。
2. 在 `index.json` 注册窗口与优先级。
3. 运行检查：

```bash
npm run check:events
npm run check:replay
```

4. 通过后提交并发布。

## 内容策略建议

- 每季度新增 6-12 个事件：
  - 就业/副业/消费金融
  - 教育/考试
  - 婚育/托育
  - 法律/舆情
  - 城市迁移/地域机会
- 每个热点事件建议至少有一个明确后果（`setFlags`、`enqueue`、或显著数值变化）。
- 避免过度依赖一次性大惩罚事件，保证“可逆窗口”存在。

## 可观测性

`render_game_to_text` 中可观测：

- `content.active_hotpacks`
- `content.hotpack_count`
- `content.deck_event_count`
- `quality.source_mix` / `quality.repeat_ratio`
