# Sprint 1/2 Review And QA Notes

Date: 2026-04-20

Scope reviewed:

- `public/index.html`
- `public/styles.css`
- `public/main.js`
- `scripts/validate-content.mjs`
- `scripts/smoke-playwright.mjs`
- `data/chinese-reigns/*.json`

## Product Review

Pass:

- The playable loop is Reigns-like: one card, two choices, resource pressure, one year per choice, quick result/restart.
- MVP still avoids forbidden systems: no map, inventory, battle, building menu, exact number panel, or skill tree.
- UI hides exact numeric resource values from the normal player interface.
- Low/high resource deaths are represented and smoke-tested across all four resources.

Open:

- Seed deck now has 45 cards, meeting the first public-playtest count target. It still needs tuning for repetition, actor cadence, and event-chain feel.
- Current result page is functional; share-card polish is still later-sprint work.

## BA Review

Pass:

- Runtime consumes JSON data from `data/chinese-reigns/`.
- Implemented condition support: `resource_gte`, `resource_lte`, `flag_is`, `counter_gte`, `counter_lte`, `not_seen`.
- Implemented effect support used by current seed data: `resource`, `set_flag`, `counter`, `complete_objective`, `force_ending`.
- Implemented `weight`, `once`, `cooldown`, and objective completion.

Open:

- `unlock_card` is validated but not yet meaningfully used by current seed data.
- `nextCards` exists as a queue in runtime, but no seed card currently exercises it.

## QA Results

Commands run:

```bash
npm run validate:content
npm run smoke
```

Results:

- Content validation passed after expansion: 45 cards, 6 objectives, 10 endings.
- Browser smoke passed at 390x844 mobile viewport.
- Smoke flow covered start screen, game screen, 8 choices, all 8 low/high resource endings, result page, local archive update, and console error capture.
- Latest screenshots were inspected:
  - `tmp/smoke/01-start.png`
  - `tmp/smoke/02-game.png`
  - `tmp/smoke/03-after-choices.png`

## Code Review

No blocking issues found for this internal Sprint 1/2 slice.

Risks to address before broader playtest:

- `public/main.js` currently contains both UI orchestration and game engine logic. Extract pure functions before adding many more card types.
- Rare chain ending and peaceful abdication still need automated coverage.
- Real mobile Safari testing is still required for pointer/touch behavior.
- Event deck needs actor-repeat tuning once the card count grows.

## Sprint Status

Sprint 1 is functionally complete for an internal playable slice.

Sprint 2 is partially complete:

- Endings exist.
- Result page exists.
- Local archive exists.
- All 8 low/high resource endings are smoke-tested.
- Rare chain ending and peaceful abdication still need automated coverage.
