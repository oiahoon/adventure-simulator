import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const allowedResources = new Set(["people", "treasury", "army", "court"]);
const allowedConditions = new Set([
  "resource_gte",
  "resource_lte",
  "flag_is",
  "counter_gte",
  "counter_lte",
  "not_seen",
]);
const allowedEffects = new Set([
  "resource",
  "set_flag",
  "counter",
  "unlock_card",
  "complete_objective",
  "force_ending",
]);
const allowedEndingMatchTypes = new Set([
  "forced_ending",
  "counter_gte",
  "resource_boundary",
  "all",
  "all_resources_between",
]);

const events = readJson("data/chinese-reigns/events.mvp.seed.json");
const objectives = readJson("data/chinese-reigns/objectives.mvp.seed.json");
const endings = readJson("data/chinese-reigns/endings.mvp.seed.json");
const rules = readJson("data/chinese-reigns/rules.mvp.seed.json");
const publicEvents = readJson("public/data/chinese-reigns/events.mvp.seed.json");
const publicObjectives = readJson("public/data/chinese-reigns/objectives.mvp.seed.json");
const publicEndings = readJson("public/data/chinese-reigns/endings.mvp.seed.json");
const publicRules = readJson("public/data/chinese-reigns/rules.mvp.seed.json");
const errors = [];
const warnings = [];

const cardIds = new Set();
const objectiveIds = new Set(objectives.objectives.map((objective) => objective.id));
const endingIds = new Set(endings.endings.map((ending) => ending.id));

events.cards.forEach((card) => {
  if (cardIds.has(card.id)) errors.push(`duplicate card id: ${card.id}`);
  cardIds.add(card.id);
});

validateUnique("objective", objectives.objectives, errors);
validateUnique("ending", endings.endings, errors);
validatePublicDataSync("events.mvp.seed.json", events, publicEvents);
validatePublicDataSync("objectives.mvp.seed.json", objectives, publicObjectives);
validatePublicDataSync("endings.mvp.seed.json", endings, publicEndings);
validatePublicDataSync("rules.mvp.seed.json", rules, publicRules);
validateRules(rules);

events.cards.forEach((card) => {
  validateAsset(`actor ${card.actor}`, `public/assets/chinese-reigns/portraits/${card.actor}.png`);
  validateAsset(`background ${card.background}`, `public/assets/chinese-reigns/backgrounds/${card.background}.png`);
  if (!card.left || !card.right) errors.push(`${card.id}: card must have left and right choices`);
  validateConditions(card.id, card.conditions ?? []);
  validateChoice(card, "left");
  validateChoice(card, "right");
  if (card.text.length > 44) warnings.push(`${card.id}: text is longer than suggested 44 chars`);
  if (card.left?.label?.length > 6) warnings.push(`${card.id}: left label is longer than suggested 6 chars`);
  if (card.right?.label?.length > 6) warnings.push(`${card.id}: right label is longer than suggested 6 chars`);
});

endings.endings.forEach((ending) => {
  if (!endingIds.has(ending.id)) errors.push(`missing ending id: ${ending.id}`);
  validateAsset(`ending ${ending.id}`, ending.image);
});

objectives.objectives.forEach((objective) => {
  validateConditions(`objective ${objective.id}`, objective.conditions ?? []);
});

if (events.cards.length < 40) {
  warnings.push(`card count ${events.cards.length} is below the 40-card public-playtest target`);
}

if (warnings.length) {
  console.log("Warnings:");
  warnings.forEach((warning) => console.log(`- ${warning}`));
}

if (errors.length) {
  console.error("Content validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Content validation passed: ${events.cards.length} cards, ${objectives.objectives.length} objectives, ${endings.endings.length} endings.`);

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function validateUnique(label, items, targetErrors) {
  const ids = new Set();
  items.forEach((item) => {
    if (ids.has(item.id)) targetErrors.push(`duplicate ${label} id: ${item.id}`);
    ids.add(item.id);
  });
}

function validateConditions(owner, conditions) {
  conditions.forEach((condition) => {
    if (!allowedConditions.has(condition.type)) errors.push(`${owner}: unsupported condition ${condition.type}`);
    if (condition.key && allowedResources.has(condition.key) === false && condition.type.startsWith("resource")) {
      errors.push(`${owner}: invalid resource condition key ${condition.key}`);
    }
  });
}

function validateChoice(card, side) {
  const choice = card[side];
  if (!choice) return;
  Object.keys(choice.preview ?? {}).forEach((key) => {
    if (!allowedResources.has(key)) errors.push(`${card.id}.${side}: invalid preview key ${key}`);
  });
  choice.effects.forEach((effect) => {
    if (!allowedEffects.has(effect.type)) errors.push(`${card.id}.${side}: unsupported effect ${effect.type}`);
    if (effect.type === "resource" && !allowedResources.has(effect.key)) {
      errors.push(`${card.id}.${side}: invalid resource effect key ${effect.key}`);
    }
    if (effect.type === "unlock_card" && !cardIds.has(effect.cardId)) {
      errors.push(`${card.id}.${side}: unlock_card references missing card ${effect.cardId}`);
    }
    if (effect.type === "force_ending" && !endingIds.has(effect.endingId)) {
      errors.push(`${card.id}.${side}: force_ending references missing ending ${effect.endingId}`);
    }
    if (effect.type === "complete_objective" && !objectiveIds.has(effect.objectiveId)) {
      errors.push(`${card.id}.${side}: complete_objective references missing objective ${effect.objectiveId}`);
    }
  });
  (choice.nextCards ?? []).forEach((cardId) => {
    if (!cardIds.has(cardId)) errors.push(`${card.id}.${side}: nextCards references missing card ${cardId}`);
  });
  validatePreview(card, side, choice);
}

function validatePreview(card, side, choice) {
  const effectTotals = {};
  choice.effects
    .filter((effect) => effect.type === "resource")
    .forEach((effect) => {
      effectTotals[effect.key] = (effectTotals[effect.key] ?? 0) + effect.delta;
    });
  Object.entries(choice.preview ?? {}).forEach(([key, direction]) => {
    const total = effectTotals[key] ?? 0;
    if (direction === "up" && total < 0) errors.push(`${card.id}.${side}: preview ${key}=up but delta is ${total}`);
    if (direction === "down" && total > 0) errors.push(`${card.id}.${side}: preview ${key}=down but delta is ${total}`);
  });
}

function validateAsset(label, relativePath) {
  if (!existsSync(path.join(root, relativePath))) {
    errors.push(`${label}: missing asset ${relativePath}`);
  }
}

function validatePublicDataSync(filename, canonical, deployedCopy) {
  if (JSON.stringify(canonical) !== JSON.stringify(deployedCopy)) {
    errors.push(`public/data/chinese-reigns/${filename} is out of sync with data/chinese-reigns/${filename}`);
  }
}

function validateRules(rulesData) {
  validateNumber("rules.resourceRange.min", rulesData.resourceRange?.min, { min: 0, max: 100 });
  validateNumber("rules.resourceRange.max", rulesData.resourceRange?.max, { min: 0, max: 100 });
  validateNumber("rules.resourceRange.dangerLow", rulesData.resourceRange?.dangerLow, { min: 0, max: 100 });
  validateNumber("rules.resourceRange.dangerHigh", rulesData.resourceRange?.dangerHigh, { min: 0, max: 100 });
  if ((rulesData.resourceRange?.min ?? 0) >= (rulesData.resourceRange?.max ?? 100)) {
    errors.push("rules.resourceRange.min must be lower than rules.resourceRange.max");
  }

  if (!Array.isArray(rulesData.endingRules) || rulesData.endingRules.length === 0) {
    errors.push("rules.endingRules must be a non-empty array");
  } else {
    const endingRuleIds = new Set();
    rulesData.endingRules.forEach((rule, index) => {
      if (!rule?.id) {
        errors.push(`rules.endingRules[${index}].id is required`);
      } else if (endingRuleIds.has(rule.id)) {
        errors.push(`duplicate rules.endingRules id: ${rule.id}`);
      } else {
        endingRuleIds.add(rule.id);
      }
      validateNumber(`rules.endingRules[${index}].priority`, rule?.priority);
      if (rule?.match?.type !== "forced_ending" && !endingIds.has(rule?.endingId)) {
        errors.push(`rules.endingRules[${index}].endingId references missing ending ${rule?.endingId}`);
      }
      validateEndingMatch(rule?.match, `rules.endingRules[${index}].match`, rulesData);
    });
  }

  validateNumber("rules.lateReignPressure.startsAtYear", rulesData.lateReignPressure?.startsAtYear, { min: 1 });
  validateNumber("rules.lateReignPressure.endingAtYear", rulesData.lateReignPressure?.endingAtYear, { min: 1 });
  if ((rulesData.lateReignPressure?.startsAtYear ?? 1) >= (rulesData.lateReignPressure?.endingAtYear ?? 60)) {
    errors.push("rules.lateReignPressure.startsAtYear must be lower than rules.lateReignPressure.endingAtYear");
  }
  if (typeof rulesData.lateReignPressure?.pressureCounterKey !== "string") {
    errors.push("rules.lateReignPressure.pressureCounterKey must be a string");
  }
  const lateEnding = rulesData.lateReignPressure?.endingId;
  if (!endingIds.has(lateEnding)) {
    errors.push(`rules.lateReignPressure.endingId references missing ending ${lateEnding}`);
  }
}

function validateEndingMatch(match, label, rulesData) {
  if (!match || typeof match !== "object") {
    errors.push(`${label} must be an object`);
    return;
  }
  if (!allowedEndingMatchTypes.has(match.type)) {
    errors.push(`${label}.type unsupported: ${match.type}`);
    return;
  }

  if (match.type === "forced_ending") return;

  if (match.type === "counter_gte") {
    if (typeof match.key !== "string") errors.push(`${label}.key must be a string`);
    validateNumber(`${label}.value`, match.value);
    return;
  }

  if (match.type === "resource_boundary") {
    if (!allowedResources.has(match.key)) errors.push(`${label}.key invalid resource ${match.key}`);
    if (!["low", "high"].includes(match.boundary)) errors.push(`${label}.boundary must be low or high`);
    const valueFrom = match.valueFrom;
    if (!["resourceRange.min", "resourceRange.max"].includes(valueFrom)) {
      errors.push(`${label}.valueFrom must be resourceRange.min or resourceRange.max`);
    } else {
      const resolved = valueFrom.split(".").reduce((current, key) => current?.[key], rulesData);
      if (!Number.isFinite(resolved)) errors.push(`${label}.valueFrom resolves to non-number ${valueFrom}`);
    }
    return;
  }

  if (match.type === "all") {
    if (!Array.isArray(match.conditions) || match.conditions.length === 0) {
      errors.push(`${label}.conditions must be a non-empty array`);
      return;
    }
    match.conditions.forEach((condition, index) => {
      validateEndingMatch(condition, `${label}.conditions[${index}]`, rulesData);
    });
    return;
  }

  if (match.type === "all_resources_between") {
    validateNumber(`${label}.min`, match.min, { min: 0, max: 100 });
    validateNumber(`${label}.max`, match.max, { min: 0, max: 100 });
    if ((match.min ?? 0) >= (match.max ?? 100)) {
      errors.push(`${label}.min must be lower than ${label}.max`);
    }
  }
}

function validateNumber(label, value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  if (!Number.isFinite(value)) {
    errors.push(`${label} must be a finite number`);
    return;
  }
  if (value < min || value > max) {
    errors.push(`${label} must be between ${min} and ${max}`);
  }
}
