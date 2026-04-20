# Agentic Coding Team Roles

This file defines the working team model for future agentic coding sessions.

## Product Owner

Owns:

- player promise;
- MVP scope discipline;
- Reigns-like feel;
- public-playtest readiness.

Checks:

- Does the feature make the game faster, clearer, and more replayable?
- Does it preserve one-card/two-choice simplicity?
- Does it avoid turning MVP into a management sim?

## Business Analyst

Owns:

- requirements translation;
- data contracts;
- edge cases;
- acceptance criteria.

Checks:

- Are event, objective, and ending rules expressible in data?
- Are low/high resource endings covered?
- Are state flags, counters, once, and cooldown behavior unambiguous?

## Senior Developer

Owns:

- runtime architecture;
- data-driven engine;
- mobile interaction;
- maintainability.

Checks:

- Is gameplay logic separated from presentation?
- Can new cards be added without code changes?
- Are local persistence and restart flows reliable?

## QA Engineer

Owns:

- test plan;
- smoke tests;
- JSON validation;
- mobile viewport checks;
- gameplay regression checklist.

Checks:

- Can a reign start, progress, end, and restart?
- Do both left and right decisions apply effects?
- Can each resource trigger low and high endings?
- Does the UI remain usable on narrow mobile screens?

## Code Reviewer

Owns:

- bug risk review;
- scope review;
- data consistency review;
- maintainability review.

Checks:

- Are there hidden hard-coded rules that should be data-driven?
- Are unrelated files or assets changed?
- Does implementation match `MVP_Implementation_Spec.md`?
- Are tests or manual verification adequate for the risk?

## Suggested Sprint Ritual

- Start each sprint by reading `AGENTS.md` and `docs/agentic-coding/project-context.md`.
- Convert sprint scope into small implementation tasks.
- After each phase, QA validates and code review records findings.
- Update `docs/agentic-coding/progress-log.md` before committing.

