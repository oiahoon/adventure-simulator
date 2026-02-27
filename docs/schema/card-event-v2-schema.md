# Card/Event V2 Schema（运行时子集）

本文档定义 `core/card-v2/engine.js` 当前消费的 JSON 子集（Phase 2）。

## 入口

文件：`public/data/cards-v2/index.json`

```json
{
  "schemaVersion": 2,
  "deckRules": "/data/cards-v2/deck-rules.json",
  "baseStats": "/data/cards-v2/base-stats.json",
  "profiles": "/data/cards-v2/profiles.json",
  "cards": ["/data/cards-v2/cards/core-cards.json"],
  "arcs": ["/data/cards-v2/arcs/core-arcs.json"]
}
```

## deck-rules.json

```json
{
  "mode": "hand",
  "baseHandSize": 3,
  "maxHandSize": 3,
  "drawPerTurn": 3,
  "preventDuplicatesInHand": true,
  "discardCooldownTurns": 4,
  "deferCooldownTurns": 2
}
```

## base-stats.json

支持数值键：`hp/san/fatigue/debt/heat/cash/careerXP/examXP/social`。

## profiles.json

```json
{
  "cities": ["beijing", "shanghai"],
  "careers": ["coder", "rider"]
}
```

## cards/*.json

根对象：

```json
{
  "cards": [CardDef]
}
```

`CardDef` 最小字段：
- `id: string`
- `deckTags: string[]`
- `rarity: string`
- `canDiscard: boolean`
- `event: EventDef`

`EventDef` 最小字段：
- `id: string`（建议与 card.id 相同）
- `version: number`
- `category: string`
- `tags: string[]`
- `baseWeight: number`
- `title: string`
- `text: string`
- `choices?: Choice[]`
- `autoOutcomes?: Outcome[]`
- `when?: Condition`
- `cooldown?: number`

`Choice`:
- `id: string`
- `label: string`
- `outcomes: Outcome[]`

`Outcome`:
- `deltas?: StatDelta[]`
- `setFlags?: Record<string, { v: boolean|number|string, ttl?: number }>`
- `clearFlags?: string[]`
- `enqueue?: { cardId: string, dueIn: number, priority: number, forced?: boolean }[]`
- `bias?: { key: string, mul: number, ttl: number }[]`
- `arcStep?: Record<string, number>`

## arcs/*.json

根对象：

```json
{
  "arcs": {
    "jobhunt": {
      "title": "求职链",
      "stages": {
        "1": { "text": "...", "outcome": { "deltas": [], "nextStage": 2 } },
        "2": { "text": "...", "outcome": { "deltas": [], "nextStage": 3 } },
        "3": { "text": "...", "outcome": { "deltas": [], "complete": true } }
      }
    }
  }
}
```

## 校验

执行：

```bash
npm run check:cards:v2
```

当前检查项：
- index 与引用文件存在/可解析
- card id 唯一
- event 关键字段完整
- enqueue 引用卡牌存在
- arcStep 引用 arc 存在（告警）
- arcs 具备 stages 基础结构
