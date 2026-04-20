# 《朕的一生》MVP 实施规格 v0.1

日期：2026-04-19

## 1. MVP 目标

MVP 的目标不是一次性做完整百卡内容库，而是尽可能复刻 Reigns 的成功玩法骨架，并验证它换成中国皇权题材后是否仍然成立：

- 玩家能在 30 秒内理解“左右滑卡牌做皇帝决策”。
- 一局能在 5-10 分钟内结束。
- 四项资源的涨跌能制造紧张感。
- 至少能触发 4 类失败结局和 1 类稀有善终。
- 结果页能生成适合分享的人格测试式总结。

一句话目标：

> 让玩家觉得自己不是在点选项，而是在把一个王朝亲手滑向奇怪但合理的结局。

参考分析见：`docs/game-design/Reigns_Reference_Analysis.md`。

### 1.1 Reigns 复刻锁定规则

MVP 必须优先复刻以下体验，不在第一版加入会稀释核心循环的复杂系统：

- 一屏一张卡。
- 只有左右滑两个选择。
- 每张卡推进一年。
- 四条资源都可能因为过低或过高导致结局。
- 当前选择只预告资源方向，不显示具体数值。
- 死亡不是终点，而是解锁结局、称号和下一任皇帝。
- 抽卡看似随机，但由状态、权重、条件和事件链牵引。
- 文案短、黑色幽默、两个选择都带代价。

## 2. MVP 范围

### 2.1 必须包含

- 竖屏 H5 主界面。
- 四项资源：民心、国库、兵权、朝政。
- 左右滑动事件卡。
- 数据驱动事件卡结构。
- 条件过滤 + 权重抽取的简化概率袋。
- 隐藏标记和计数器。
- 结局判定。
- 本任目标系统。
- 死亡/退位时间线记录。
- 结果页。
- 本地存档：已解锁结局、历史最高在位年数、最近一次结果。

### 2.2 暂不包含

- 完整 100 张事件卡。
- 完整跨世代大型工程。
- 微信 JS-SDK 正式分享接入。
- 音乐和复杂音效。
- 账号系统、排行榜、服务端存档。
- 武侠篇章扩展。
- 物品栏、战斗系统、地图系统、多角色统治者。

## 3. 核心体验循环

1. 初始化一任皇帝。
2. 展示当前年份、四项资源和事件卡。
3. 玩家拖动卡牌，左右选项随拖动显现。
4. 达到阈值后提交选择。
5. 应用资源变化、标记变化、计数器变化。
6. 判断是否触发结局。
7. 如果未结束，从事件池抽取下一张卡。
8. 如果结束，展示结果页并记录解锁。
9. 玩家可再来一局。

## 4. 状态模型

### 4.1 王朝状态

```ts
type ResourceKey = 'people' | 'treasury' | 'army' | 'court';

interface GameState {
  emperorName: string;
  year: number;
  turn: number;
  reignIndex: number;
  resources: Record<ResourceKey, number>;
  flags: Record<string, boolean | string | number>;
  counters: Record<string, number>;
  currentObjectiveIds: string[];
  completedObjectiveIds: string[];
  eventHistory: string[];
  endingHistory: string[];
  lastCardId?: string;
}
```

### 4.2 初始值

```json
{
  "year": 1,
  "turn": 0,
  "reignIndex": 1,
  "resources": {
    "people": 50,
    "treasury": 50,
    "army": 50,
    "court": 50
  },
  "flags": {
    "war_ongoing": false,
    "famine_risk": false,
    "taizi_established": false
  },
  "counters": {
    "eunuch_power": 0,
    "tax_anger": 0,
    "army_discontent": 0,
    "alchemy_trust": 0
  },
  "currentObjectiveIds": ["survive_10_years", "keep_all_resources_safe"],
  "completedObjectiveIds": []
}
```

### 4.3 资源边界

- 资源范围固定为 `0-100`。
- 每次选择后 clamp 到 `0-100`。
- 任意资源 `<= 0` 或 `>= 100` 时进入结局判定。
- 资源在 `15 以下` 或 `85 以上` 时进入危险区，UI 需要提示。
- UI 默认不显示精确数值，只显示资源条位置、图标、危险状态和选择预览方向。

## 5. 资源含义

| 资源 | 中文 | 低值风险 | 高值风险 | UI 图标 |
| --- | --- | --- | --- | --- |
| `people` | 民心 | 民变、抗税、灾民失控 | 民望过高，改革期待失控 | `people-transparent.png` |
| `treasury` | 国库 | 财政崩溃、军饷不足、政务停摆 | 贪腐、奢靡、权贵争财 | `treasury-transparent.png` |
| `army` | 兵权 | 边患、兵变、剿匪失败 | 将军坐大、军阀化 | `army-transparent.png` |
| `court` | 朝政 | 权臣篡位、宦官专权 | 官僚僵化、言路壅塞 | `court-transparent.png` |

## 6. 本任目标系统

Reigns: Her Majesty 等版本用“每任君主目标”增强复玩动机。MVP 采用轻量目标系统，但不做物品栏。

工程数据文件：

- 首批目标：`data/chinese-reigns/objectives.mvp.seed.json`

### 6.1 目标结构

```ts
interface ReignObjective {
  id: string;
  text: string;
  conditions: Condition[];
  reward?: {
    unlockCards?: string[];
    unlockEndingIds?: string[];
    titleHint?: string;
  };
}
```

### 6.2 MVP 目标池

每任皇帝开局抽取 2 个目标：

- 存活 10 年。
- 四项资源都不要进入危险区。
- 平息一次灾荒。
- 阻止宦官专权。
- 国库从低位恢复到安全区。
- 在战争中议和或取胜。

目标只作为轻量引导，不应变成任务列表游戏。主循环仍然是 Reigns 式滑卡。

## 7. 事件卡数据结构

工程数据文件：

- Schema：`data/chinese-reigns/events.schema.json`
- 首批 seed 卡：`data/chinese-reigns/events.mvp.seed.json`

```ts
interface EventCard {
  id: string;
  title?: string;
  actor: ActorId;
  background?: BackgroundId;
  text: string;
  left: EventChoice;
  right: EventChoice;
  conditions?: Condition[];
  weight?: number;
  tags?: string[];
  once?: boolean;
  cooldown?: number;
}

interface EventChoice {
  label: string;
  preview?: Partial<Record<ResourceKey, 'up' | 'down' | 'risk'>>;
  effects: Effect[];
  nextCards?: string[];
}
```

### 6.1 字段约束

- `text`：建议 20-44 个中文字符，最多两行。
- `left.label` / `right.label`：建议 2-6 个中文字符。
- `actor`：对应头像资源。
- `background`：对应场景背景，可选。
- `weight`：默认 `1`。
- `once`：一次性事件，触发后不再进入主池。
- `cooldown`：触发后间隔 N 回合才能再次出现。

## 8. 条件与效果

### 8.1 条件

```ts
type Condition =
  | { type: 'resource_gte'; key: ResourceKey; value: number }
  | { type: 'resource_lte'; key: ResourceKey; value: number }
  | { type: 'flag_is'; key: string; value: boolean | string | number }
  | { type: 'counter_gte'; key: string; value: number }
  | { type: 'counter_lte'; key: string; value: number }
  | { type: 'not_seen'; cardId: string };
```

### 8.2 效果

```ts
type Effect =
  | { type: 'resource'; key: ResourceKey; delta: number }
  | { type: 'set_flag'; key: string; value: boolean | string | number }
  | { type: 'counter'; key: string; delta: number }
  | { type: 'unlock_card'; cardId: string }
  | { type: 'complete_objective'; objectiveId: string }
  | { type: 'force_ending'; endingId: string };
```

## 9. 抽卡规则

### 9.1 MVP 概率袋

每回合按以下顺序抽卡：

1. 从全部事件中移除不满足条件的卡。
2. 移除已触发过的 `once` 卡。
3. 移除仍在 cooldown 内的卡。
4. 给事件链相关卡增加权重。
5. 避免连续出现同一 actor 超过 2 次。
6. 按权重随机抽取。

### 9.2 推荐权重

| 事件类型 | 权重 |
| --- | --- |
| 基础日常事件 | 4 |
| 资源危险区补救事件 | 6 |
| 事件链推进卡 | 5 |
| 危机爆发卡 | 8 |
| 稀有奇遇卡 | 1 |

## 10. MVP 事件链

### 10.1 宦官专权链

- 起点：宦官请求扩充内廷。
- 累积：`eunuch_power += 1`。
- 中段：言官弹劾、宰相警告、内廷办事效率提升。
- 危机：`eunuch_power >= 3` 且 `court <= 25`。
- 结局：宫廷政变。

### 10.2 灾荒民变链

- 起点：地方灾情、粮价上涨。
- 累积：`famine_risk = true`、`tax_anger += 1`。
- 中段：赈灾、加税、开仓、镇压。
- 危机：`people <= 15` 或 `tax_anger >= 3`。
- 结局：民变。

### 10.3 边关军权链

- 起点：边军缺饷、北疆告急。
- 累积：`war_ongoing = true`、`army_discontent += 1`。
- 中段：拨款、征兵、议和、削将。
- 危机：`army <= 10` 或 `army >= 90`。
- 结局：边患失守或将军逼宫。

### 10.4 国库崩溃链

- 起点：修宫殿、赈灾、军饷、减税。
- 累积：国库持续下降。
- 中段：卖官、加税、裁军、查贪。
- 危机：`treasury <= 0`。
- 结局：国库崩溃。

### 10.5 稀有善终链

- 条件：在位年数达到 20 年以上。
- 条件：四项资源都在 `35-75` 之间。
- 条件：没有高危计数器超过阈值。
- 结局：和平退位。

### 10.6 晚年传位上限

- 条件：在位年数达到 60 年。
- 条件：未先触发资源崩盘、资源过盛、炼丹死亡、强制剧情结局或和平退位。
- 结局：寿终传位。
- 设计目的：给长局提供明确终点，避免 MVP 版本因为玩家反复平衡资源而无限续局。

## 11. MVP 结局

| 结局 ID | 名称 | 触发条件 | 资源图 |
| --- | --- | --- | --- |
| `rebellion` | 民变倾覆 | `people <= 0` 或灾荒链爆发 | `endings/rebellion.png` |
| `expectation_revolt` | 民望反噬 | `people >= 100` 且改革期待失控 | `endings/rebellion.png` |
| `coup` | 宫廷政变 | `court <= 0` 或宦官/权臣链爆发 | `endings/coup.png` |
| `bureaucratic_suffocation` | 朝纲过密 | `court >= 100` 且政治僵化 | `endings/coup.png` |
| `empty_treasury` | 国库崩溃 | `treasury <= 0` | `endings/empty-treasury.png` |
| `corruption_flood` | 富得流油 | `treasury >= 100` 且贪腐失控 | `endings/empty-treasury.png` |
| `military_takeover` | 兵权反噬 | `army >= 100` 或 `army_discontent >= 3` | `endings/coup.png` |
| `frontier_collapse` | 边关失守 | `army <= 0`；后续可叠加 `war_ongoing = true` 的边关链变体 | `backgrounds/frontier-outpost.png` |
| `peaceful_abdication` | 和平退位 | 善终链条件满足 | `endings/peaceful-abdication.png` |
| `old_age_succession` | 寿终传位 | 晚年传位上限触发 | `endings/peaceful-abdication.png` |

MVP 第一版可以复用结局图，但结局判定必须区分高值和低值，避免玩家误以为资源越高越好。

## 12. 称号规则

结果页称号由资源均值、极端项和隐藏计数器决定。

### 12.1 MVP 称号池

| 称号 | 条件 |
| --- | --- |
| 仁德天子 | `people` 长期偏高，且未触发民变 |
| 聚宝皇帝 | `treasury` 长期偏高 |
| 马上天子 | `army` 长期偏高 |
| 垂拱而治 | `court` 长期偏高且资源均衡 |
| 九千岁之友 | `eunuch_power >= 3` |
| 丹炉试吃员 | `alchemy_trust >= 3` |
| 祖宗基业体验卡 | 任期少于 3 年 |
| 体面退场者 | 触发 `peaceful_abdication` |

## 13. 死亡时间线与本地存档

Reigns 的复玩动力来自“死了但王朝继续”。MVP 需要保存轻量时间线：

```ts
interface ReignRecord {
  emperorName: string;
  reignIndex: number;
  yearsRuled: number;
  endingId: string;
  title: string;
  finalResources: Record<ResourceKey, number>;
  completedObjectiveIds: string[];
  memorableCardIds: string[];
}
```

本地存档至少保存：

- `unlockedEndingIds`
- `bestYearsRuled`
- `reignRecords`
- `completedObjectiveIds`

## 14. 首批事件内容规模

MVP 建议先做 40 张事件卡。注意：40 张是可试玩底线，少于 40 张时只用于内部验证，不做公开传播。

| 类型 | 数量 |
| --- | --- |
| 基础朝政事件 | 8 |
| 民生/灾荒事件 | 8 |
| 国库/税务事件 | 6 |
| 军事/边关事件 | 8 |
| 宦官/后宫/继承事件 | 6 |
| 稀有奇遇/方士事件 | 4 |

角色覆盖：

- 皇帝：系统视角，不作为 actor。
- 宰相：政策、财政、官员。
- 老臣/言官：弹劾、劝谏、道德压力。
- 将军：边关、军饷、兵权。
- 宦官：宫廷效率、内廷权力。
- 贵妃/后妃：后宫、外戚、继承。
- 书生/言官：科举、舆论、改革。
- 百姓：民生、税务、灾荒。

## 15. UI 页面清单

### 15.1 启动页

- 标题：《朕的一生》
- 简短副标题。
- 开始按钮。
- 可选：已解锁结局数量。

### 15.2 引导页

- 一张安全事件卡。
- 提示左右滑动。
- 解释四项资源会变动。
- 引导只出现一次，可跳过。

### 15.3 主游戏页

- 顶部：四项资源 HUD，使用 `*-transparent.png`。
- 中部：事件卡、角色头像、事件文本。
- 底部：左右选项提示。
- 背景：根据事件类型切换场景或使用默认朝堂。
- 资源 HUD 不显示精确数值。
- 拖动卡牌时，只显示左右选择和资源影响方向。
- 每处理一张卡，年份加 1。

### 15.4 结局页

- 结局背景图。
- 称号。
- 在位年数。
- 死因/退位原因。
- 一句点评。
- 再来一局。
- 分享按钮。
- 已解锁结局/目标提示。

### 15.5 结果分享图

- 使用 `share/result-card-bg.png`。
- Canvas 合成文字、称号、资源终值、二维码或分享标识。
- 图片内文字由前端渲染，不烘焙进资源图。

## 16. 美术与资源使用

当前美术基线以 `docs/art/sbti-lowpoly-style-guide.md` 为准：

- SBTI testing 风格的人格测试头像感。
- 低饱和几何 cutout。
- 可见低多边形折面体积。
- 古代宫廷元素只做轻符号。

资源使用规则：

- 角色头像：`portraits/*.png`。
- 游戏背景：`backgrounds/*.png`。
- 顶部资源条：`icons/*-transparent.png`。
- 教程/说明/结果详情：`icons/*.png`。
- 结局页：`endings/*.png`。
- 分享图底图：`share/result-card-bg.png`。

资源缺口统一记录在 `docs/game-design/MVP_Asset_Backlog.md`。拆事件或 UI 时发现缺少角色、背景、结局图、状态图标，先写入 backlog，后续集中生成和审查。

## 17. 验收标准

### 17.1 玩法验收

- 玩家能用左右滑完成连续 10 张卡。
- 每次选择后资源变化可见。
- 资源达到极值时能进入正确结局。
- 至少 8 种结局判定可触发，其中包含高值和低值结局。
- 事件不会在条件不满足时出现。
- `once` 和 `cooldown` 生效。
- 每局开局有 2 个本任目标。
- 死亡后能记录时间线并开始下一任皇帝。

### 17.2 UI 验收

- 适配常见手机竖屏。
- 主循环无页面跳转。
- 卡牌拖动有回弹和提交阈值。
- 资源 HUD 在浅色和场景背景上都清晰。
- HUD 不显示精确数字，只显示条位和危险状态。
- 结果页能完整展示称号、年数、死因、点评。

### 17.3 内容验收

- 文案短，能在 2 秒内读完。
- 左右选项都像合理但有代价的选择。
- 不出现明显最优选项。
- 死因和称号有分享欲。
- 每张卡都能让玩家感到两个选择都有代价。

## 18. 样例事件卡

### 18.1 边军欠饷

```json
{
  "id": "army_pay_arrears",
  "actor": "general",
  "background": "frontier-outpost",
  "text": "边军三月未领饷，营中已有人把战鼓当饭碗敲。",
  "left": {
    "label": "拨银",
    "preview": { "treasury": "down", "army": "up" },
    "effects": [
      { "type": "resource", "key": "treasury", "delta": -15 },
      { "type": "resource", "key": "army", "delta": 12 },
      { "type": "counter", "key": "army_discontent", "delta": -1 }
    ]
  },
  "right": {
    "label": "画饼",
    "preview": { "treasury": "up", "army": "down" },
    "effects": [
      { "type": "resource", "key": "treasury", "delta": 5 },
      { "type": "resource", "key": "army", "delta": -18 },
      { "type": "counter", "key": "army_discontent", "delta": 1 }
    ]
  },
  "weight": 5,
  "tags": ["army", "frontier"]
}
```

### 18.2 内廷扩编

```json
{
  "id": "eunuch_expand_office",
  "actor": "eunuch",
  "background": "court-hall",
  "text": "司礼监说宫中事务繁重，想多招些手脚伶俐的人。",
  "left": {
    "label": "准奏",
    "preview": { "court": "up" },
    "effects": [
      { "type": "resource", "key": "court", "delta": 6 },
      { "type": "counter", "key": "eunuch_power", "delta": 1 }
    ]
  },
  "right": {
    "label": "裁撤",
    "preview": { "court": "down" },
    "effects": [
      { "type": "resource", "key": "court", "delta": -8 },
      { "type": "counter", "key": "eunuch_power", "delta": -1 }
    ]
  },
  "conditions": [
    { "type": "counter_lte", "key": "eunuch_power", "value": 3 }
  ],
  "weight": 4,
  "tags": ["court", "eunuch"]
}
```

### 18.3 开仓赈灾

```json
{
  "id": "famine_relief_granary",
  "actor": "commoner",
  "background": "village-street",
  "text": "南边闹饥荒，灾民说只要一口粥，也愿称您圣明。",
  "left": {
    "label": "开仓",
    "preview": { "people": "up", "treasury": "down" },
    "effects": [
      { "type": "resource", "key": "people", "delta": 16 },
      { "type": "resource", "key": "treasury", "delta": -12 },
      { "type": "set_flag", "key": "famine_risk", "value": false }
    ]
  },
  "right": {
    "label": "观望",
    "preview": { "people": "down" },
    "effects": [
      { "type": "resource", "key": "people", "delta": -15 },
      { "type": "counter", "key": "tax_anger", "delta": 1 },
      { "type": "set_flag", "key": "famine_risk", "value": true }
    ]
  },
  "weight": 5,
  "tags": ["people", "famine"]
}
```

### 18.4 言官弹劾

```json
{
  "id": "censor_accuses_eunuch",
  "actor": "scholar",
  "background": "royal-study",
  "text": "年轻言官递来血书，说宦官把朝堂当自家厨房。",
  "left": {
    "label": "严查",
    "preview": { "court": "down" },
    "effects": [
      { "type": "resource", "key": "court", "delta": -6 },
      { "type": "counter", "key": "eunuch_power", "delta": -1 }
    ]
  },
  "right": {
    "label": "压下",
    "preview": { "court": "up", "people": "down" },
    "effects": [
      { "type": "resource", "key": "court", "delta": 5 },
      { "type": "resource", "key": "people", "delta": -8 },
      { "type": "counter", "key": "eunuch_power", "delta": 1 }
    ]
  },
  "conditions": [
    { "type": "counter_gte", "key": "eunuch_power", "value": 1 }
  ],
  "weight": 6,
  "tags": ["court", "eunuch"]
}
```

### 18.5 方士献丹

```json
{
  "id": "alchemist_pill",
  "actor": "senior-minister",
  "background": "royal-study",
  "text": "方士献来金丹一枚，老臣跪在旁边，脸比丹炉还黑。",
  "left": {
    "label": "服用",
    "preview": { "court": "risk" },
    "effects": [
      { "type": "resource", "key": "court", "delta": -4 },
      { "type": "counter", "key": "alchemy_trust", "delta": 1 }
    ]
  },
  "right": {
    "label": "赏退",
    "preview": { "treasury": "down", "court": "up" },
    "effects": [
      { "type": "resource", "key": "treasury", "delta": -4 },
      { "type": "resource", "key": "court", "delta": 5 }
    ]
  },
  "weight": 1,
  "tags": ["rare", "alchemy"]
}
```

## 19. 下一步工作拆分

1. 建立前端项目骨架。
2. 定义事件 JSON schema。
3. 写 10 张可运行样例卡。
4. 实现资源 HUD 和卡牌滑动。
5. 实现选择效果应用和结局判定。
6. 扩展到 40 张 MVP 卡。
7. 实现结果页和分享图合成。
8. 做第一轮平衡测试。
