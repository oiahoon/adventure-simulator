# Event Pack Schema (Runtime Subset)

本文件定义当前运行时实际支持的事件包字段子集（用于作者与审核对齐）。

## Files

- `public/data/events/event-meta.json`
- `public/data/events/arc-config.json`
- `public/data/events/arc-events.json`
- `public/data/events/event-deck.json`

## Condition (when)

支持字段：

- 逻辑：`all[]`, `any[]`, `not`
- 数值：`dayMin`, `dayMax`, `chapterMin`, `goldGte`, `goldLte`, `debtGte`, `moraleLte`, `fatigueGte`, `childCountGte`, `childCountEq`, `randomLt`
- 集合：`professionIn[]`, `locationIn[]`, `locationTypeIn[]`, `familyStageIn[]`, `familyStageNotIn[]`
- 标记：`engineFlagTrue`, `engineFlagFalse`, `milestoneIncludes`, `milestoneNotIncludes`
- 事件前因：`seenEventGte: { id, value }`
- 属性和：`statSumGte: { keys[], value }`

## Outcome

支持字段：

- `city: { morale, fatigue, debt, heat }`
- `player: { exp, gold, hp, stats }`
- `milestone`, `milestones[]`, `log`
- `setFlags[]`, `clearFlags[]`
- `bias[]`, `enqueue[]`
- `story: { familyStage, childCountAdd }`
- `force: { goldSet, hpSet }`
- `endRun: "win" | "lose"`

动态数值表达式（`gold`/`hp`）支持：

- `number`
- `{ mode: "addRand" | "subRand" | "subRate" | "addRate" | "healRand", ... }`

## Deck Event

必填：

- `id`, `title`, `text`
- `outcomes[]` 或 `branches[]`

可选：

- `deck`, `tags[]`, `baseWeight`, `cooldown`, `rare`, `oncePerRun`
- `when`, `requireFlags[]`, `blockFlags[]`, `prereqEventsAny[]`, `prereqEventsAll[]`

## Arc Node

每个 `arc` 下按数字 stage 键组织：

- stage 必须含 `outcomes[]` 或 `branches[]`
- branch 支持：`when`, `nextStage`, `nextDayOffset`, `complete`, `ending`, `outcomes[]`

## Validation Command

```bash
npm run check:events
```

该命令执行：

- JSON 解析检查
- 结构字段校验
- 条件/结果语法校验
- 跨文件引用检查（arc order、event-meta 与 deck 对齐、queue 事件名）
- 基础文案 lint（标题长度、正文长度提示）

## Replay Check

```bash
npm run check:replay
```

会执行 `tests/replay/golden-cases.json` 中的 deterministic replay case，校验：

- 相同 seed/初始化参数下事件序列哈希稳定
- 关键事件链在样例场景中可命中（`mustContain`）
