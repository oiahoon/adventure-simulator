export const RESOURCE_ORDER = ["people", "treasury", "army", "court"];

export const RESOURCE_ENDING_MAP = {
  people: { low: "rebellion", high: "expectation_revolt" },
  treasury: { low: "empty_treasury", high: "corruption_flood" },
  army: { low: "frontier_collapse", high: "military_takeover" },
  court: { low: "coup", high: "bureaucratic_suffocation" },
};

export const DEFAULT_ENDING_RULES = [
  { id: "forced-ending", priority: 1000, match: { type: "forced_ending" } },
  {
    id: "alchemy-death",
    priority: 900,
    endingId: "alchemy_death",
    match: { type: "all", conditions: [{ type: "counter_gte", key: "alchemy_trust", value: 3 }] },
  },
  {
    id: "puppet-emperor",
    priority: 850,
    endingId: "puppet_emperor",
    match: {
      type: "all",
      conditions: [
        { type: "flag_is", key: "puppet_regency", value: true },
        { type: "counter_gte", key: "eunuch_power", value: 2 },
        { type: "counter_gte", key: "consort_family_power", value: 2 },
        { type: "counter_gte", key: "years_ruled", value: 10 },
      ],
    },
  },
  ...RESOURCE_ORDER.flatMap((key) => [
    {
      id: `${key}-low`,
      priority: 800,
      endingId: RESOURCE_ENDING_MAP[key].low,
      match: { type: "resource_boundary", key, boundary: "low", valueFrom: "resourceRange.min" },
    },
    {
      id: `${key}-high`,
      priority: 800,
      endingId: RESOURCE_ENDING_MAP[key].high,
      match: { type: "resource_boundary", key, boundary: "high", valueFrom: "resourceRange.max" },
    },
  ]),
  {
    id: "peaceful-abdication",
    priority: 200,
    endingId: "peaceful_abdication",
    match: {
      type: "all",
      conditions: [
        { type: "counter_gte", key: "years_ruled", value: 24 },
        { type: "all_resources_between", min: 42, max: 68 },
        { type: "counter_lte", key: "eunuch_power", value: 1 },
        { type: "counter_lte", key: "consort_family_power", value: 1 },
      ],
    },
  },
  {
    id: "old-age-succession",
    priority: 100,
    endingId: "old_age_succession",
    match: { type: "counter_gte", key: "years_ruled", value: 60 },
  },
];

export function createInitialState({ archive, objectivePack, random = Math.random }) {
  const reignIndex = (archive?.reigns?.length ?? 0) + 1;
  return {
    emperorName: `第${reignIndex}任皇帝`,
    year: 1,
    turn: 0,
    reignIndex,
    resources: { people: 50, treasury: 50, army: 50, court: 50 },
    flags: { war_ongoing: false, famine_risk: false, taizi_established: false, puppet_regency: false },
    counters: {
      years_ruled: 0,
      eunuch_power: 0,
      consort_family_power: 0,
      tax_anger: 0,
      army_discontent: 0,
      alchemy_trust: 0,
      famine_events_seen: 0,
      frontier_events_seen: 0,
      succession_pressure: 0,
    },
    completedObjectiveIds: [],
    currentObjectiveIds: pickObjectives(objectivePack, 2, random),
    eventHistory: [],
    endingHistory: archive?.unlockedEndingIds ?? [],
    cooldowns: {},
    nextQueue: [],
    forcedEndingId: undefined,
  };
}

export function pickObjectives(objectivePack, count, random = Math.random) {
  return [...objectivePack.objectives]
    .sort(() => random() - 0.5)
    .slice(0, count)
    .map((objective) => objective.id);
}

export function applyChoiceToState(state, card, side, rules = defaultRules()) {
  const nextState = cloneState(state);
  const choice = card[side];
  applyEffects(nextState, choice.effects);
  nextState.eventHistory.push(card.id);
  markTagCounters(nextState, card);
  nextState.turn += 1;
  nextState.year += 1;
  nextState.counters.years_ruled += 1;
  applyLateReignPressure(nextState, rules);

  if (card.once) {
    nextState.cooldowns[card.id] = Number.POSITIVE_INFINITY;
  } else if (card.cooldown) {
    nextState.cooldowns[card.id] = nextState.turn + card.cooldown;
  }

  if (choice.nextCards?.length) {
    nextState.nextQueue.push(...choice.nextCards);
  }

  return nextState;
}

export function applyEffects(state, effects) {
  effects.forEach((effect) => {
    if (effect.type === "resource") {
      const nextValue = clamp(state.resources[effect.key] + effect.delta, 0, 100);
      state.resources[effect.key] = nextValue;
      if (nextValue <= 15) state.flags[`${effect.key}_once_danger_low`] = true;
      if (nextValue >= 85) state.flags[`${effect.key}_once_danger_high`] = true;
    }
    if (effect.type === "counter") {
      state.counters[effect.key] = Math.max(0, (state.counters[effect.key] ?? 0) + effect.delta);
    }
    if (effect.type === "set_flag") {
      state.flags[effect.key] = effect.value;
    }
    if (effect.type === "complete_objective") {
      completeObjective(state, effect.objectiveId);
    }
    if (effect.type === "force_ending") {
      state.forcedEndingId = effect.endingId;
    }
  });
}

export function markTagCounters(state, card) {
  if (card.tags.includes("famine")) {
    state.counters.famine_events_seen += 1;
  }
  if (card.tags.includes("frontier")) {
    state.counters.frontier_events_seen += 1;
  }
}

export function updateObjectiveProgress(state, objectivePack) {
  const nextState = cloneState(state);
  nextState.currentObjectiveIds.forEach((objectiveId) => {
    const objective = objectivePack.objectives.find((item) => item.id === objectiveId);
    if (!objective || nextState.completedObjectiveIds.includes(objectiveId)) return;
    if (objective.conditions.every((condition) => evaluateCondition(nextState, condition))) {
      completeObjective(nextState, objectiveId);
    }
  });
  return nextState;
}

export function completeObjective(state, objectiveId) {
  if (!state.completedObjectiveIds.includes(objectiveId)) {
    state.completedObjectiveIds.push(objectiveId);
  }
}

export function selectNextCard({ state, eventPack, currentCard, random = Math.random, rules = defaultRules() }) {
  const nextState = cloneState(state);
  while (nextState.nextQueue.length) {
    const queued = eventPack.cards.find((card) => card.id === nextState.nextQueue.shift());
    if (queued && isCardEligible(nextState, queued)) return { card: queued, state: nextState };
  }

  const eligible = eventPack.cards.filter((card) => isCardEligible(nextState, card));
  const actorBlockedCandidates = filterBlockedActorCandidates(eligible, nextState, eventPack);
  const candidates = actorBlockedCandidates.length
    ? actorBlockedCandidates
    : eligible.length
      ? eligible
      : eventPack.cards;
  const weighted = [];

  candidates.forEach((card) => {
    const boost = resourcePressureBoost(nextState, card, rules);
    const repeatPenalty = card.id === currentCard?.id && candidates.length > 1 ? 0.25 : 1;
    const count = Math.max(1, Math.round((card.weight + boost) * repeatPenalty));
    for (let index = 0; index < count; index += 1) weighted.push(card);
  });

  return { card: weighted[Math.floor(random() * weighted.length)], state: nextState };
}

export function filterBlockedActorCandidates(candidates, state, eventPack) {
  const blockedActor = getBlockedActor(state, eventPack);
  if (!blockedActor) return candidates;
  const filtered = candidates.filter((card) => card.actor !== blockedActor);
  return filtered.length ? filtered : candidates;
}

export function getBlockedActor(state, eventPack) {
  const lastTwoActorIds = state.eventHistory
    .slice(-2)
    .map((cardId) => eventPack.cards.find((card) => card.id === cardId)?.actor)
    .filter(Boolean);
  if (lastTwoActorIds.length < 2) return null;
  return lastTwoActorIds[0] === lastTwoActorIds[1] ? lastTwoActorIds[0] : null;
}

export function isCardEligible(state, card) {
  if (state.cooldowns[card.id] === Number.POSITIVE_INFINITY) return false;
  if ((state.cooldowns[card.id] ?? 0) > state.turn) return false;
  if (card.once && state.eventHistory.includes(card.id)) return false;
  return (card.conditions ?? []).every((condition) => evaluateCondition(state, condition));
}

export function evaluateCondition(state, condition) {
  if (condition.type === "resource_gte") return state.resources[condition.key] >= condition.value;
  if (condition.type === "resource_lte") return state.resources[condition.key] <= condition.value;
  if (condition.type === "flag_is") return state.flags[condition.key] === condition.value;
  if (condition.type === "counter_gte") return (state.counters[condition.key] ?? 0) >= condition.value;
  if (condition.type === "counter_lte") return (state.counters[condition.key] ?? 0) <= condition.value;
  if (condition.type === "not_seen") return !state.eventHistory.includes(condition.cardId);
  return true;
}

export function resourcePressureBoost(state, card, rules = defaultRules()) {
  const activeBand = getActivePressureBand(rules, state.counters.years_ruled);
  const pressureBonus = activeBand?.resourcePressureBonus ?? 0;
  return RESOURCE_ORDER.reduce((score, key) => {
    const isPressed = state.resources[key] <= 20 || state.resources[key] >= 80;
    return score + (isPressed && card.tags.includes(key) ? 3 + pressureBonus : 0);
  }, 0);
}

export function resolveEnding(state, endingPack) {
  return resolveEndingWithRules(state, endingPack);
}

export function resolveEndingWithRules(state, endingPack, rules = defaultRules()) {
  const endingRules = getOrderedEndingRules(rules);
  for (const rule of endingRules) {
    const endingId = matchEndingRule(state, rule, rules);
    if (endingId) {
      return findEnding(endingPack, endingId);
    }
  }
  return null;
}

export function applyLateReignPressure(state, rules = defaultRules()) {
  const pressureSystem = rules.pressureSystem ?? defaultRules().pressureSystem;
  const activeBand = getActivePressureBand(rules, state.counters.years_ruled);
  const counterKey = pressureSystem.counterKey;
  if (!activeBand) {
    state.counters[counterKey] = 0;
    return;
  }
  state.counters[counterKey] = Math.max(0, (state.counters[counterKey] ?? 0) + activeBand.pressureIncrement);
}

export function findEnding(endingPack, id) {
  return endingPack.endings.find((ending) => ending.id === id) ?? endingPack.endings[0];
}

export function createReignRecord({ state, ending, title, now = new Date() }) {
  return {
    endedAt: now.toISOString(),
    emperorName: state.emperorName,
    reignIndex: state.reignIndex,
    years: state.counters.years_ruled,
    endingId: ending.id,
    endingName: ending.name,
    title,
    finalResources: { ...state.resources },
    completedObjectiveIds: [...state.completedObjectiveIds],
    memorableCardIds: state.eventHistory.slice(-6),
  };
}

export function cloneState(state) {
  return {
    ...state,
    resources: { ...state.resources },
    flags: { ...state.flags },
    counters: { ...state.counters },
    completedObjectiveIds: [...state.completedObjectiveIds],
    currentObjectiveIds: [...state.currentObjectiveIds],
    eventHistory: [...state.eventHistory],
    endingHistory: [...state.endingHistory],
    cooldowns: { ...state.cooldowns },
    nextQueue: [...state.nextQueue],
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function defaultRules() {
  return {
    resourceRange: { min: 0, max: 100, dangerLow: 15, dangerHigh: 85 },
    endingRules: DEFAULT_ENDING_RULES,
    pressureSystem: {
      counterKey: "succession_pressure",
      bands: [
        { startsAtYear: 35, pressureIncrement: 1, resourcePressureBonus: 0 },
        { startsAtYear: 45, pressureIncrement: 2, resourcePressureBonus: 1 },
        { startsAtYear: 55, pressureIncrement: 3, resourcePressureBonus: 2 },
      ],
    },
  };
}

export function getActivePressureBand(rules = defaultRules(), yearsRuled = 0) {
  const bands = [...(rules.pressureSystem?.bands ?? defaultRules().pressureSystem.bands)]
    .sort((left, right) => left.startsAtYear - right.startsAtYear);
  let activeBand = null;
  bands.forEach((band) => {
    if (yearsRuled >= band.startsAtYear) activeBand = band;
  });
  return activeBand;
}

function getOrderedEndingRules(rules) {
  return [...(rules.endingRules ?? DEFAULT_ENDING_RULES)].sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));
}

function matchEndingRule(state, rule, rules) {
  if (rule.match?.type === "forced_ending") {
    return state.forcedEndingId ?? null;
  }
  if (!rule.endingId) return null;
  return evaluateEndingMatch(state, rule.match, rules) ? rule.endingId : null;
}

function evaluateEndingMatch(state, match, rules) {
  if (!match) return false;
  if (match.type === "counter_gte") return (state.counters[match.key] ?? 0) >= match.value;
  if (match.type === "counter_lte") return (state.counters[match.key] ?? 0) <= match.value;
  if (match.type === "flag_is") return state.flags[match.key] === match.value;
  if (match.type === "all") return (match.conditions ?? []).every((condition) => evaluateEndingMatch(state, condition, rules));
  if (match.type === "all_resources_between") {
    return RESOURCE_ORDER.every((key) => state.resources[key] >= match.min && state.resources[key] <= match.max);
  }
  if (match.type === "resource_boundary") {
    const boundaryValue = resolveRuleValue(rules, match.valueFrom);
    if (!Number.isFinite(boundaryValue)) return false;
    return match.boundary === "low"
      ? state.resources[match.key] <= boundaryValue
      : state.resources[match.key] >= boundaryValue;
  }
  return false;
}

function resolveRuleValue(rules, path) {
  if (!path) return undefined;
  return path.split(".").reduce((current, key) => current?.[key], rules);
}
