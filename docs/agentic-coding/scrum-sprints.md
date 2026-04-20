# Scrum Sprint Plan For MVP

Updated: 2026-04-20

## Team

- Product Owner: guards the Reigns-like player promise and MVP scope.
- Business Analyst: turns game rules into data contracts and acceptance criteria.
- Senior Developer: implements the H5 runtime and data-driven engine.
- QA Engineer: validates data, gameplay loops, endings, mobile interaction, and persistence.
- Code Reviewer: reviews scope, maintainability, data consistency, and regression risk.

## Sprint 0: Foundation And Context

Goal: make the project safe for agentic coding handoff.

Done:

- Root agent entry files exist.
- Project context, progress log, team roles, and sprint plan exist.
- MVP design documents and seed data are committed.
- Current planning commit has been pushed to `origin/main`.

Acceptance:

- A new agent can start from `AGENTS.md` and understand what to build.
- Existing art, design, and seed data locations are discoverable.

## Sprint 1: Playable Core

Goal: a browser-playable Reigns-like MVP loop.

Scope:

- Static H5 app shell.
- Load event/objective/ending JSON.
- Start reign.
- Render one decision card.
- Left/right choice via swipe and button fallback.
- Apply resource effects.
- Advance one year per card.
- Select next card by conditions, weight, once, and cooldown.

Acceptance:

- Player can complete at least 10 decisions without page reload.
- Exact resource deltas are not shown.
- Every resolved card increments the reign year.
- Main loop has no extra menu layer between cards.

## Sprint 2: Endings And Persistence

Goal: make death, abdication, and replay feel like the product.

Scope:

- Low and high resource ending checks.
- Special chain and rare peaceful ending checks.
- Result page with reign years, ending, title, and share tone.
- Local storage for best reign, unlocked endings, and recent history.
- Immediate next-emperor restart.

Acceptance:

- All four resources can trigger endings at low or high extremes.
- Result page records an ending without crashing.
- Restart creates the next emperor and preserves unlock history.

## Sprint 3: Mobile UX And Visual Polish

Goal: make the MVP feel like a mobile H5 game instead of a raw prototype.

Scope:

- Mobile-first layout.
- Resource HUD with transparent icons.
- Drag feedback and left/right option reveal.
- Background and portrait assets.
- Danger states for resource bars.
- Objective display.

Acceptance:

- Layout works at 390x844 and desktop narrow preview.
- Card drag is stable and does not shift surrounding layout.
- HUD icons are composited without opaque square artifacts.

## Sprint 4: QA, Review, And Content Expansion

Goal: prepare for a private playable review.

Scope:

- JSON syntax validation.
- Asset path check.
- Manual browser smoke test.
- Code review pass.
- Add more cards until the deck approaches 40 cards.

Acceptance:

- No missing referenced assets in seed data.
- No console errors in normal play.
- QA checklist is recorded.
- Review findings are addressed or documented.

## Current Phase

Active phase: Sprint 1 and Sprint 2 combined into a first playable MVP slice.

