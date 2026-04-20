# Post-Alignment Improvement Checklist

Date: 2026-04-20

This checklist turns the findings from `docs/game-design/MVP_Design_Alignment_Report_2026-04-20.md`
into concrete next steps for the team.

Purpose:

- keep the MVP closely aligned with Reigns;
- close the gap between "playable system" and "correct player feeling";
- give Product / UIUX / Dev / QA a shared execution order.

## Summary

Current judgement after alignment review:

- system-level Reigns clone fidelity: strong;
- feeling-level fidelity: partial but improving;
- main remaining gaps:
  - weak dynasty carryover feeling;
  - opening flow still reads a bit like an H5 landing page;
  - result/share experience is useful but not yet highly spreadable;
  - event chains exist, but some of the "I caused this years ago" feeling should be stronger.

## Priority Ladder

### P0 - Must improve before calling MVP "finished"

1. Strengthen dynasty continuity
2. Strengthen result/share personality
3. Strengthen first-3-card onboarding rhythm
4. Run human playtests focused on "does this really feel like Reigns?"

### P1 - Next after P0

1. Increase chain visibility and consequence readability
2. Reduce any remaining "task-list UI" feeling
3. Improve result-page hierarchy and social punch

### P2 - Nice to have for post-MVP hardening

1. Add more bridge cards between existing chains
2. Add lighter persistent dynasty traces
3. Continue content-density tuning after real-player feedback

## Work Items

## 1. Dynasty Continuity Pass

Priority: P0  
Owner: Product Owner + Senior Developer + BA

Goal:

- Make the next reign feel like succession, not just restart.

Why:

- The current implementation preserves archive records, but the player does not yet strongly feel they are inheriting a dynasty.

Scope:

- add a lightweight "previous reign summary" on new reign start;
- experiment with one small inherited trace, for example:
  - previous ending echo text;
  - dynasty chronicle line;
  - inherited reputation hint;
  - one soft starting condition tied to previous reign outcome;
- keep the inheritance light enough that the game still feels like Reigns, not rogue-lite meta progression.

Acceptance criteria:

- a player can clearly tell this is the next emperor, not a full app reset;
- the inherited trace does not add menus or extra player actions;
- starting a new reign remains fast.

Notes:

- Do not introduce permanent stat growth, unlock trees, or build systems here.

## 2. Opening Flow Compression

Priority: P0  
Owner: UIUX + Senior Developer

Goal:

- Make the game feel like it starts ruling immediately.

Why:

- Current start screen is clear, but it still feels slightly more like a conventional H5 start page than a sharp Reigns-style entry.

Scope:

- shorten the opening copy;
- reduce visual distance between "start" and first decision;
- consider framing the first memorial as the real tutorial and minimizing preamble;
- preserve archive summary, but keep it secondary.

Acceptance criteria:

- the path from page load to first card is faster and more direct;
- first impression emphasizes decision pressure instead of explanation;
- no extra onboarding modal is introduced.

## 3. First Three Cards Rhythm Pass

Priority: P0  
Owner: Product Owner + BA + Senior Developer

Goal:

- Ensure the first three cards teach the game through consequence, not through explanation.

Why:

- Reigns succeeds because the player learns by making a few painful decisions immediately.

Scope:

- review the first tutorial card and the weighted early pool;
- ensure first 3 cards expose:
  - a visible tradeoff;
  - at least one resource danger direction;
  - one memorable role voice;
- bias early draw toward representative court / people / treasury / army tension.

Acceptance criteria:

- a new player understands "every choice has a price" within the first minute;
- the early sequence exposes at least 3 different resource concerns;
- early cards do not feel like generic tutorial prompts.

## 4. Result Page Personality Pass

Priority: P0  
Owner: UIUX + Product Owner

Goal:

- Make the result page feel more like a personality-test-style royal verdict.

Why:

- The current result page works, but it does not yet fully deliver the "I should send this to a friend" impulse described in the PRD.

Scope:

- strengthen title / punchline hierarchy;
- review how `endingName`, `title`, `shareTone`, and reign years are presented together;
- make sure the first screenful of the result page has one dominant share-worthy statement;
- keep the dedicated ending illustration front and center.

Acceptance criteria:

- a player can understand the result in one glance;
- the page has a stronger "this is my type/result" feel;
- share image output matches the on-screen hierarchy closely enough.

## 5. Human Reigns-Fidelity Playtest

Priority: P0  
Owner: QA + Product Owner

Goal:

- Validate that the game does not just function like Reigns, but feels like Reigns.

Why:

- Automated tests can confirm rules; they cannot confirm instinct, tension, or replay urge.

Test questions:

- Did the player understand the loop within 30 seconds?
- Did they feel both left and right choices had cost?
- Did they understand that high resources can also kill them?
- Did they want to immediately try one more reign after death?
- Did any ending feel like the result of earlier decisions catching up?

Deliverables:

- short playtest notes from 3-5 sessions;
- a list of confusing early cards;
- a list of endings that felt satisfying vs flat;
- follow-up tuning recommendations.

Acceptance criteria:

- no major confusion about core controls or resource logic;
- at least some players describe the game as "像王权" or equivalent without prompting;
- at least one replay impulse is clearly observed in each session.

## 6. Event Consequence Visibility Pass

Priority: P1  
Owner: BA + Product Owner + Senior Developer

Goal:

- Increase the player's feeling that later trouble comes from earlier choices.

Why:

- Current chain logic exists, but some consequences may still feel like isolated random cards.

Scope:

- identify 3 highest-value chains:
  - eunuch / court;
  - famine / people;
  - heir / dowager / regency;
- add bridge cards or callbacks where needed;
- reinforce state transitions with short but recognizable phrasing.

Acceptance criteria:

- players can more easily connect at least some late cards to earlier decisions;
- chain discovery improves without showing explicit flowcharts or system text.

## 7. Objective Strip Softening

Priority: P1  
Owner: UIUX + Product Owner

Goal:

- Keep goals useful without making the UI feel like a checklist game.

Why:

- The current objective strip supports replay, but can slightly push the interface toward a task-list feeling.

Scope:

- test lighter copy, lighter visual weight, or folded presentation;
- preserve objective functionality;
- avoid adding progress meters or management-style detail.

Acceptance criteria:

- objectives remain readable;
- the screen still feels like a single-card decision game first.

## 8. Dynasty Chronicle Backlog

Priority: P2  
Owner: Product Owner + BA

Goal:

- Define optional post-MVP dynasty flavor that does not overload the MVP.

Scope:

- list candidate lightweight dynasty systems;
- mark which are safe for MVP and which should wait:
  - chronicle line;
  - inherited omen;
  - previous reign stain;
  - dynasty surname / era naming;
  - memorial timeline view.

Acceptance criteria:

- backlog is documented;
- MVP remains protected from system creep.

## Delivery Order

1. Dynasty Continuity Pass
2. Opening Flow Compression
3. First Three Cards Rhythm Pass
4. Result Page Personality Pass
5. Human Reigns-Fidelity Playtest
6. Event Consequence Visibility Pass
7. Objective Strip Softening
8. Dynasty Chronicle Backlog

## QA Signoff Questions

- Does the game still feel like one-card/two-choice Reigns after each change?
- Has any improvement introduced extra menu complexity?
- Is the first minute now sharper and more legible than before?
- Does the result page now produce a clearer shareable identity?
- Does the new-reign transition feel more like succession than reset?

## Out of Scope For This Checklist

- adding combat;
- adding maps;
- adding inventory;
- adding multi-ruler selection;
- adding exact resource numbers;
- building a server-side meta system.
