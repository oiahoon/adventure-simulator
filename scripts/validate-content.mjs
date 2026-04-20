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

const events = readJson("data/chinese-reigns/events.mvp.seed.json");
const objectives = readJson("data/chinese-reigns/objectives.mvp.seed.json");
const endings = readJson("data/chinese-reigns/endings.mvp.seed.json");
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

