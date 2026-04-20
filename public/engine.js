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
        { type: "counter_gte", key: "years_ruled", value: 26 },
        { type: "all_resources_between", min: 44, max: 66 },
        { type: "flag_is", key: "taizi_established", value: true },
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

const LEGACY_RULES = {
  rebellion: {
    summary: "先帝把江山滑进了民变里，街巷里的怨气还没散。",
    effectText: "新帝登基时，民间仍带着旧火气。",
    resourceDelta: { key: "people", delta: -5 },
  },
  expectation_revolt: {
    summary: "先帝被万民期待推着往前跑，连新帝也立刻被盯上。",
    effectText: "新帝登基时，民望很高，要求也很高。",
    resourceDelta: { key: "people", delta: 5 },
  },
  empty_treasury: {
    summary: "先帝留下的是空库和长叹，连算盘都显得心虚。",
    effectText: "新帝登基时，国库先天发虚。",
    resourceDelta: { key: "treasury", delta: -6 },
  },
  corruption_flood: {
    summary: "先帝把钱留下了，也把伸手的人全养肥了。",
    effectText: "新帝登基时，库里有钱，朝里也更会花钱。",
    resourceDelta: { key: "treasury", delta: 4 },
  },
  frontier_collapse: {
    summary: "先帝丢了边关，地图上的风声还在往宫里吹。",
    effectText: "新帝登基时，兵气先天不足。",
    resourceDelta: { key: "army", delta: -6 },
  },
  military_takeover: {
    summary: "先帝差点把皇位让给将军，殿外的甲声还没退干净。",
    effectText: "新帝登基时，兵权格外扎眼。",
    resourceDelta: { key: "army", delta: 4 },
  },
  coup: {
    summary: "先帝在宫变里退场，朝堂上人人都学会了先看风向。",
    effectText: "新帝登基时，朝局先天不稳。",
    resourceDelta: { key: "court", delta: -6 },
  },
  bureaucratic_suffocation: {
    summary: "先帝被层层公文埋住了，连今天的奏折都还在往上摞。",
    effectText: "新帝登基时，朝政规矩已经多到会自己长出来。",
    resourceDelta: { key: "court", delta: 4 },
  },
  alchemy_death: {
    summary: "先帝把命交给了丹炉，宫里至今还飘着奇怪药味。",
    effectText: "新帝登基时，宫中对异术仍有余温。",
    resourceDelta: { key: "court", delta: -2 },
  },
  puppet_emperor: {
    summary: "先帝虽然坐在龙椅上，点头的人却总在帘后。",
    effectText: "新帝登基时，宫里已经习惯先看帘后。",
    resourceDelta: { key: "court", delta: -4 },
  },
  peaceful_abdication: {
    summary: "先帝居然活着交班了，史官写这段时都很客气。",
    effectText: "新帝登基时，朝中对平稳交接还留着几分信心。",
    resourceDelta: { key: "court", delta: 3 },
  },
  old_age_succession: {
    summary: "先帝熬到寿终传位，朝臣都默认皇位可以按时轮班。",
    effectText: "新帝登基时，朝廷对传位秩序略感安心。",
    resourceDelta: { key: "court", delta: 2 },
  },
};

export function createInitialState({ archive, objectivePack, random = Math.random }) {
  const reignIndex = (archive?.reigns?.length ?? 0) + 1;
  const succession = deriveSuccessionFromArchive(archive);
  const resources = { people: 50, treasury: 50, army: 50, court: 50 };
  if (succession.resourceDelta) {
    resources[succession.resourceDelta.key] = clamp(
      resources[succession.resourceDelta.key] + succession.resourceDelta.delta,
      0,
      100,
    );
  }
  return {
    emperorName: `第${reignIndex}任皇帝`,
    year: 1,
    turn: 0,
    reignIndex,
    resources,
    flags: {
      war_ongoing: false,
      famine_risk: false,
      taizi_established: false,
      puppet_regency: false,
      silenced_censors: false,
      heir_taught_by_dowager: false,
    },
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
    nextQueue: ["tutorial_first_memorial"],
    forcedEndingId: undefined,
    succession,
  };
}

export function deriveSuccessionFromArchive(archive) {
  const lastResult = archive?.lastResult;
  if (!lastResult?.endingId) {
    return {
      hasLegacy: false,
      summary: "",
      effectText: "",
      resourceDelta: null,
      previousEndingId: null,
      previousTitle: "",
      previousYears: null,
    };
  }

  const legacy = LEGACY_RULES[lastResult.endingId] ?? {
    summary: "先帝已经翻页，留下的却不只是年号。",
    effectText: "新帝登基时，前朝的余波还在宫里回响。",
    resourceDelta: null,
  };

  return {
    hasLegacy: true,
    summary: `${lastResult.title}在位${lastResult.years}年，以${lastResult.endingName}收场。${legacy.summary}`,
    effectText: legacy.effectText,
    resourceDelta: legacy.resourceDelta ?? null,
    previousEndingId: lastResult.endingId,
    previousTitle: lastResult.title,
    previousYears: lastResult.years,
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
    const earlyBoost = earlyReignTeachingBoost(nextState, card, eventPack);
    const repeatPenalty = card.id === currentCard?.id && candidates.length > 1 ? 0.25 : 1;
    const count = Math.max(1, Math.round((card.weight + boost + earlyBoost) * repeatPenalty));
    for (let index = 0; index < count; index += 1) weighted.push(card);
  });

  return { card: weighted[Math.floor(random() * weighted.length)], state: nextState };
}

export function earlyReignTeachingBoost(state, card, eventPack) {
  if (state.counters.years_ruled >= 3) return 0;
  if (card.id === "tutorial_first_memorial") return 0;

  const seenCards = state.eventHistory
    .map((cardId) => eventPack.cards.find((item) => item.id === cardId))
    .filter(Boolean);
  const seenActors = new Set(seenCards.map((seenCard) => seenCard.actor));
  const seenResources = new Set(
    seenCards.flatMap((seenCard) => (seenCard.tags ?? []).filter((tag) => RESOURCE_ORDER.includes(tag)))
  );

  let boost = 0;
  const missingResources = RESOURCE_ORDER.filter((key) => !seenResources.has(key));
  if (missingResources.some((key) => card.tags?.includes(key))) {
    boost += 6;
  }
  if (!seenActors.has(card.actor)) {
    boost += 2;
  }
  if (card.tags?.includes("rare")) {
    boost -= 3;
  }

  return boost;
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
