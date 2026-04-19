# Asset Quality Review

Date: 2026-04-19

This review checks the current `public/assets/chinese-reigns` image set against two requirements:

- Visual style: SBTI-like low-saturation geometric cutout with low-poly faceted volume.
- Game design fit: useful for `朕的一生`, an ancient-court Reigns-like H5 decision game.

## Summary

The MVP asset set is complete:

- 8 character portraits
- 6 gameplay backgrounds
- 4 opaque illustration resource icons
- 4 transparent HUD resource icons
- 4 ending backgrounds
- 1 share/result background
- 2 reference images

Overall status: usable for the next UI prototype after the second-pass regeneration of the resource icons, ending backgrounds, share/result background, and transparent HUD icon set.

Second-pass changes:

- Replaced all four resource icons because the first pass felt too programmatic and did not match the character/background assets.
- Replaced all four ending backgrounds because the first pass read as flat symbolic posters rather than SBTI-lowpoly result illustrations.
- Replaced the share/result background so it preserves UI text zones while adding faceted ancient-court props and a small emperor mascot.
- Added four transparent HUD icons for the top resource bar and inline stat rows.

## Portraits

| Asset | Style Fit | Game Fit | Notes |
| --- | --- | --- | --- |
| `portraits/emperor.png` | Strong | Strong | Primary style lock. Large head, faceted face, minimal imperial cues. |
| `portraits/chancellor.png` | Strong | Strong | Cunning minister role reads clearly; scroll prop supports court-event cards. |
| `portraits/senior-minister.png` | Strong | Strong | Good worried-advisor silhouette for loyal/remonstrating events. |
| `portraits/general.png` | Strong | Strong | Military role reads clearly without becoming realistic war art. |
| `portraits/eunuch.png` | Strong | Strong | Palace power-broker role reads clearly and avoids caricature. |
| `portraits/consort.png` | Strong | Strong | Restrained palace role; minimal ornament keeps style aligned. |
| `portraits/scholar.png` | Strong | Strong | Useful for censor/scholar-official events. |
| `portraits/commoner.png` | Strong | Strong | Good for民生,灾荒,税役,街巷事件. |

## Backgrounds

| Asset | Style Fit | Game Fit | Notes |
| --- | --- | --- | --- |
| `backgrounds/court-hall.png` | Good | Strong | Very pale and spacious; ideal for main court UI. |
| `backgrounds/royal-study.png` | Good | Strong | Suitable for policy, memorial, treasury, and quiet palace events. |
| `backgrounds/palace-courtyard.png` | Good | Good | Useful neutral palace scene. |
| `backgrounds/frontier-outpost.png` | Good | Strong | Good for兵权,边关,军饷事件; slightly more scenic than SBTI avatar cards but still low-saturation. |
| `backgrounds/village-street.png` | Good | Strong | Suitable for民心,税役,灾荒前置事件. |
| `backgrounds/prison-chamber.png` | Good | Strong | Suitable for政变,下狱,党争事件; restrained and non-gory. |

## Resource Icons

Current `icons/*.png` files are opaque illustration icons. They are suitable for tutorial panels, result-detail sections, and art-direction previews. For the in-game top HUD/resource bar, generate a separate transparent set named `*-transparent.png` so the UI can own the resource pill/card background.

| Asset | Style Fit | Game Fit | Notes |
| --- | --- | --- | --- |
| `icons/people.png` | Strong | Strong | Regenerated as three faceted commoner mascots with clear SBTI-style facial features; reads as民心/百姓 and matches the portrait set. |
| `icons/treasury.png` | Strong | Strong | Regenerated as a faceted treasury still-life with chest, coins, and ledger; reads as国库 without generic RPG icon styling. |
| `icons/army.png` | Strong | Strong | Regenerated as a compact guard/swords/banner badge; reads as兵权 and now shares the same characterful low-poly language. |
| `icons/court.png` | Strong | Strong | Regenerated as a court official with memorial, palace roof, and seal; reads as朝政/宫廷秩序 and no longer feels like a programmatic vector placeholder. |

Transparent HUD icons:

| Asset | Style Fit | Game Fit | Notes |
| --- | --- | --- | --- |
| `icons/people-transparent.png` | Strong | Strong | Single commoner bust with rice stalk; real alpha channel, compact enough for 24-32px HUD usage. |
| `icons/treasury-transparent.png` | Strong | Strong | Compact chest, coin, and ledger; real alpha channel and no baked card background. |
| `icons/army-transparent.png` | Strong | Strong | Guard bust with banner and sword; real alpha channel and strong read for兵权. |
| `icons/court-transparent.png` | Strong | Strong | Court official bust with memorial and seal; real alpha channel and strong read for朝政. |

## Endings

| Asset | Style Fit | Game Fit | Notes |
| --- | --- | --- | --- |
| `endings/rebellion.png` | Strong | Strong | Regenerated with a small emperor silhouette, fallen banner, distant figures, and collapsed palace gate; supports王朝倾覆/民变 while keeping top/lower text space. |
| `endings/coup.png` | Strong | Strong | Regenerated with empty throne, fallen crown, scrolls, and faceted court figures at the edges; supports政变/逼宫 endings without violence. |
| `endings/empty-treasury.png` | Strong | Strong | Regenerated with a worried treasurer mascot, empty chest, coins, ledger, and candle; clearly communicates国库崩溃. |
| `endings/peaceful-abdication.png` | Strong | Strong | Regenerated with an old emperor on a palace balcony facing soft polygon mountains; works for rare善终/退位 while staying gentle and restrained. |

## Share

| Asset | Style Fit | Game Fit | Notes |
| --- | --- | --- | --- |
| `share/result-card-bg.png` | Strong | Strong | Regenerated as an illustrated result-card background: large blank text zones remain, with light faceted crown, scroll, sword/coins, palace silhouettes, and a small emperor mascot. |

## Follow-Up Recommendations

- Use `*-transparent.png` for the in-game top HUD/resource bar. Keep the opaque `icons/*.png` for tutorial, explanation, and result-detail layouts.
- Backgrounds are slightly more scenic and watercolor-like than the portraits, but they are low-saturation, spacious, and useful for decision-card overlays.
- If the final UI needs stronger visual uniformity, the next useful pass would be to bring `backgrounds/frontier-outpost.png`, `backgrounds/village-street.png`, and `backgrounds/prison-chamber.png` closer to the faceted result-card style.
- Keep all game text in HTML/CSS. Do not bake Chinese labels into generated images.
