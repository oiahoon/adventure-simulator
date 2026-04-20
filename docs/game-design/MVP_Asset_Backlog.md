# 《朕的一生》MVP 资源缺口 Backlog v0.1

日期：2026-04-19

本清单记录在拆解 MVP 事件和 UI 时发现的资源缺口。先文档化，后续统一按 `docs/art/sbti-lowpoly-style-guide.md` 生成，不在当前阶段零散补图。

## 1. 当前已有资源

### 1.1 角色头像

- `portraits/emperor.png`
- `portraits/chancellor.png`
- `portraits/senior-minister.png`
- `portraits/general.png`
- `portraits/eunuch.png`
- `portraits/consort.png`
- `portraits/scholar.png`
- `portraits/commoner.png`

### 1.2 场景背景

- `backgrounds/court-hall.png`
- `backgrounds/royal-study.png`
- `backgrounds/palace-courtyard.png`
- `backgrounds/frontier-outpost.png`
- `backgrounds/village-street.png`
- `backgrounds/prison-chamber.png`

### 1.3 资源图标

不透明插画版：

- `icons/people.png`
- `icons/treasury.png`
- `icons/army.png`
- `icons/court.png`

透明 HUD 版：

- `icons/people-transparent.png`
- `icons/treasury-transparent.png`
- `icons/army-transparent.png`
- `icons/court-transparent.png`

### 1.4 结局与分享

- `endings/rebellion.png`
- `endings/coup.png`
- `endings/empty-treasury.png`
- `endings/peaceful-abdication.png`
- `share/result-card-bg.png`

## 2. MVP 阶段建议补齐

### 2.1 角色头像

| 优先级 | 建议文件 | 用途 | 备注 |
| --- | --- | --- | --- |
| P0 | `portraits/alchemist.png` | 方士献丹、求仙、观星事件 | 当前用老臣代替，长期会削弱奇遇链辨识度。 |
| P0 | `portraits/empress-dowager.png` | 太后、外戚、立储压力 | 后宫/继承链需要更明确的权力来源。 |
| P1 | `portraits/prince.png` | 太子立储、夺嫡事件 | 善终和世代循环扩展会需要。 |
| P1 | `portraits/regional-lord.png` | 藩王、地方割据、削藩事件 | 藩镇叛乱链需要。 |
| P1 | `portraits/envoy.png` | 北疆使者、议和、外交事件 | 可用于边关链。 |
| P2 | `portraits/merchant.png` | 商税、盐铁、行会事件 | 国库链扩展。 |
| P2 | `portraits/bandit.png` | 剿匪、江湖、治安事件 | 武侠/民间扩展。 |

### 2.2 场景背景

| 优先级 | 建议文件 | 用途 | 备注 |
| --- | --- | --- | --- |
| P0 | `backgrounds/alchemy-room.png` | 方士、丹药、观星、超自然事件 | 当前御书房可顶替，但氛围不够。 |
| P1 | `backgrounds/imperial-harem.png` | 后宫、贵妃、太后、外戚事件 | 当前宫廷庭院可顶替。 |
| P1 | `backgrounds/market-tax-office.png` | 商税、盐铁、国库事件 | 当前村镇街道可顶替。 |
| P1 | `backgrounds/ancestral-temple.png` | 立储、祖制、太庙、善终事件 | 可增强王朝感。 |
| P2 | `backgrounds/battle-map.png` | 战争决策、小袋战役系统 | MVP 后期可补。 |

### 2.3 结局图

| 优先级 | 建议文件 | 用途 | 备注 |
| --- | --- | --- | --- |
| P0 | `endings/military-takeover.png` | 兵权过高、将军逼宫 | 当前临时复用 `coup.png`。 |
| P0 | `endings/frontier-collapse.png` | 兵权过低且战争中，边关失守 | 当前临时复用 `frontier-outpost.png`。 |
| P1 | `endings/alchemy-death.png` | 方士链服丹暴毙 | 有强分享潜力。 |
| P1 | `endings/puppet-emperor.png` | 宦官/外戚把持朝政但未直接政变 | 可作为特殊结局。 |

### 2.4 UI 组件资源

这些不一定要用 imagegen 生成，前端 CSS/Canvas 也可以实现。若需要图片化，再生成。

| 优先级 | 建议文件 | 用途 | 推荐实现 |
| --- | --- | --- | --- |
| P0 | `ui/card-paper-texture.png` | 事件卡浅纸纹 | CSS 背景优先，必要时生成。 |
| P0 | `ui/swipe-left-hint.png` / `ui/swipe-right-hint.png` | 新手引导手势提示 | CSS/动画优先。 |
| P1 | `icons/warning-transparent.png` | 资源危险区提示 | 可用 CSS 图标或透明 PNG。 |
| P1 | `icons/year-transparent.png` | 在位年数标识 | 可用文字优先。 |
| P1 | `icons/death-transparent.png` | 结局死因标识 | 结果页增强用。 |

## 3. 暂不生成但需保留设计空间

- 100 张完整事件卡插图。
- 武侠门派角色。
- 多代皇帝不同年龄头像。
- 成就徽章。
- 皮肤主题。
- 微信分享二维码装饰。

## 4. 生成原则

- 角色头像继续使用 `1024x1024` 不透明 SBTI-lowpoly 头像卡。
- HUD/小状态图标使用 `1024x1024` 透明 PNG，前端显示为 `24-32px`。
- 背景和结局图使用 `1024x1536` 不透明竖屏图。
- 所有图片不烘焙文字、Logo、水印。
- 所有新资源生成后必须更新 `docs/art/asset-quality-review.md`。
