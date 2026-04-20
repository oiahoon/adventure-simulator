# Agentic Coding Entry Point

This repository is now dedicated to `朕的一生`, a mobile H5 strategy card game inspired by Reigns.

Start here before making design, code, asset, QA, or review changes.

## Project Snapshot

- Product: `朕的一生`
- Format: vertical mobile H5 web game
- Core loop: one card per screen, swipe left/right, each card advances one reign year
- Main inspiration: Reigns-style binary royal decisions, four-resource balance, frequent endings, quick restart
- Visual baseline: SBTI testing inspired low-saturation low-poly cutout illustration
- Current repository state: documentation, seed data, and generated art assets are present; MVP runtime implementation is the next major work

## Canonical Context Files

- `docs/agentic-coding/project-context.md`: product, design, implementation, and asset context for agents
- `docs/agentic-coding/progress-log.md`: current progress, decisions, risks, and next steps
- `docs/agentic-coding/team-roles.md`: suggested agent/team roles for product, BA, senior dev, QA, and review
- `docs/game-design/Reigns_Reference_Analysis.md`: Reigns reference analysis and clone principles
- `docs/game-design/MVP_Implementation_Spec.md`: MVP engineering specification
- `docs/game-design/MVP_Build_Plan.md`: phased MVP build plan
- `docs/game-design/MVP_Asset_Backlog.md`: known missing assets and art debt
- `docs/art/sbti-lowpoly-style-guide.md`: locked art style guide
- `docs/art/asset-quality-review.md`: asset quality review
- `data/chinese-reigns/events.schema.json`: event-card schema
- `data/chinese-reigns/events.mvp.seed.json`: seed event cards
- `data/chinese-reigns/objectives.mvp.seed.json`: seed reign objectives
- `data/chinese-reigns/endings.mvp.seed.json`: seed endings

## Non-Negotiable MVP Rules

- Keep the main experience Reigns-like: one card, two choices, swipe left/right.
- Do not add management menus, map systems, inventory, combat, skill trees, or precise number panels to MVP.
- Four resources are `people`, `treasury`, `army`, and `court`.
- Resources are dangerous when too low and when too high.
- The UI should show direction/risk, not exact effect numbers.
- Death or abdication is a feature: record ending, title, reign years, and immediately allow a new emperor.
- All user-facing text should be short, sharp, and suitable for a dark-humor royal decision game.
- Images must not contain baked text, logos, watermarks, or UI labels.

## Working Rules For Agents

- Read the context files before editing.
- Preserve existing user or agent work; do not revert unrelated changes.
- Keep implementation small and data-driven.
- Update `docs/agentic-coding/progress-log.md` whenever a meaningful milestone, decision, blocker, or phase completion happens.
- When adding resources or content, update the relevant guide or backlog.
- Run available validation after changes and record what was checked.

