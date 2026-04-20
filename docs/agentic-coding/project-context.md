# Agentic Coding Project Context

Updated: 2026-04-20

## What We Are Building

`朕的一生` is a vertical mobile H5 game that aims to reproduce the successful core of Reigns in a Chinese imperial setting.

The MVP should feel like:

- a personality-test-like royal life simulator;
- a fast left/right swipe decision game;
- a darkly funny sequence of court requests;
- a fragile balancing act across four resources;
- a game where dying is frequent, memorable, and replayable.

The product should not feel like a conventional simulation, city builder, RPG, or strategy menu game.

## Core Loop

1. Start a reign.
2. Show one event card.
3. Player swipes left or right.
4. Apply hidden resource and state effects.
5. Advance one year.
6. Trigger an ending if any resource becomes too low or too high, or if a special ending condition is met.
7. Record title, ending, reign length, and unlocked progress.
8. Start the next emperor quickly.

## Reigns-Like Design Constraints

- One card per screen.
- Only two choices per card.
- Every resolved card advances one year.
- Four resources must be kept in a middle range.
- Too much of a resource can be as dangerous as too little.
- The player sees preview direction, not exact numeric impact.
- Cards should appear semi-random but be filtered and weighted by state.
- Death should be entertaining and should unlock collection progress.

## Game-Specific Mapping

| Reigns Role | 朕的一生 Mapping |
| --- | --- |
| Church | 朝政 / 士林 / 礼法 |
| People | 民心 |
| Army | 兵权 |
| Treasury | 国库 |
| Advisors | 宰相、老臣、言官、宦官、将军、贵妃、百姓 |
| Dynasty | 下一任皇帝、年号、谥号、王朝记录 |

## MVP Runtime Scope

MVP runtime should include:

- mobile-first H5 shell;
- resource HUD with icon bars and danger states;
- draggable/swipeable decision card;
- event engine reading JSON seed data;
- condition and effect evaluator;
- weighted card selection with once/cooldown support;
- ending resolution from low/high resources and special effects;
- reign objectives;
- result page and local history;
- replay flow.

MVP runtime should exclude:

- inventory;
- battle system;
- map;
- building/management menus;
- account system;
- leaderboard;
- server persistence;
- exact numeric resource panels.

## Data Files

- `data/chinese-reigns/events.schema.json`: event-card contract
- `data/chinese-reigns/events.mvp.seed.json`: initial event cards
- `data/chinese-reigns/objectives.mvp.seed.json`: reign objective seed data
- `data/chinese-reigns/endings.mvp.seed.json`: ending seed data

Runtime code should treat content as data. Add new events or endings by extending JSON first, not by hard-coding story logic into UI components.

## Visual Direction

The art direction is locked in `docs/art/sbti-lowpoly-style-guide.md`.

Short version:

- SBTI testing inspired;
- low-saturation geometric cutout;
- visible low-poly faceted planes;
- large polygon head, small simple body;
- minimal face;
- ancient Chinese court cues as light symbols only;
- generous negative space;
- no baked text in images.

Runtime should use transparent `*-transparent.png` icons for HUD and composited UI surfaces.

## Current Risks

- If the MVP adds too many systems, it will stop feeling like Reigns.
- If content count stays too low, replay will feel repetitive.
- If UI shows exact values, player behavior may become spreadsheet optimization instead of instinctive decision-making.
- If art becomes too ornate, it will lose the SBTI personality-test flavor.

## Definition Of Done For MVP

- A user can complete multiple reigns in browser.
- The main interaction works by left/right swipe and click fallback.
- Four resources update and can trigger low/high endings.
- A new emperor starts after each ending.
- Local progress records endings and best reign.
- The UI works on mobile viewport sizes.
- Seed data validates.
- The result page can be shared visually later, even if real platform sharing is not yet integrated.

