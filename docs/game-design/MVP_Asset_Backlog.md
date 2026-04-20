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

以下资源已在 2026-04-20 生成并落盘：

- 角色头像：
  - `portraits/alchemist.png`
  - `portraits/empress-dowager.png`
  - `portraits/prince.png`
  - `portraits/regional-lord.png`
  - `portraits/envoy.png`
  - `portraits/merchant.png`
  - `portraits/bandit.png`
- 场景背景：
  - `backgrounds/alchemy-room.png`
  - `backgrounds/imperial-harem.png`
  - `backgrounds/market-tax-office.png`
  - `backgrounds/ancestral-temple.png`
- 结局图：
  - `endings/military-takeover.png`
  - `endings/frontier-collapse.png`
  - `endings/expectation-revolt.png`
  - `endings/corruption-flood.png`
  - `endings/bureaucratic-suffocation.png`
  - `endings/alchemy-death.png`
  - `endings/old-age-succession.png`
  - `endings/puppet-emperor.png`

当前 backlog 主要保留“尚未生成或尚未接入玩法”的项。

### 2.1 角色头像

| 优先级 | 建议文件 | 用途 | 备注 |
| --- | --- | --- | --- |
| P2 | 暂无新增硬缺口 |  | 角色侧 MVP 所需主干素材已基本补齐。 |

### 2.2 场景背景

| 优先级 | 建议文件 | 用途 | 备注 |
| --- | --- | --- | --- |
| P2 | `backgrounds/battle-map.png` | 战争决策、小袋战役系统 | MVP 后期可补。 |

### 2.3 结局图

| 优先级 | 建议文件 | 用途 | 备注 |
| --- | --- | --- | --- |
| P1 | `endings/puppet-emperor.png` | 宦官/外戚把持朝政但未直接政变 | 图片已生成，但当前玩法规则尚未接入。 |

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
