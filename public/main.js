const RESOURCE_META = {
  people: { label: "民心", icon: "./assets/chinese-reigns/icons/people-transparent.png" },
  treasury: { label: "国库", icon: "./assets/chinese-reigns/icons/treasury-transparent.png" },
  army: { label: "兵权", icon: "./assets/chinese-reigns/icons/army-transparent.png" },
  court: { label: "朝政", icon: "./assets/chinese-reigns/icons/court-transparent.png" },
};

const RESOURCE_ORDER = ["people", "treasury", "army", "court"];
const STORAGE_KEY = "chinese-reigns-mvp-archive";
const DATA_PATHS = {
  events: "../data/chinese-reigns/events.mvp.seed.json",
  objectives: "../data/chinese-reigns/objectives.mvp.seed.json",
  endings: "../data/chinese-reigns/endings.mvp.seed.json",
};

const ACTOR_PATH = "./assets/chinese-reigns/portraits/";
const BACKGROUND_PATH = "./assets/chinese-reigns/backgrounds/";

let eventPack;
let objectivePack;
let endingPack;
let state;
let currentCard;
let forcedEndingId;
let dragStartX = 0;
let dragOffsetX = 0;
let isDragging = false;
let isResolvingChoice = false;

const els = {
  start: document.querySelector("#start-screen"),
  game: document.querySelector("#game-screen"),
  result: document.querySelector("#result-screen"),
  error: document.querySelector("#error-screen"),
  errorMessage: document.querySelector("#error-message"),
  startButton: document.querySelector("#start-button"),
  restartButton: document.querySelector("#restart-button"),
  nextReignButton: document.querySelector("#next-reign-button"),
  archiveSummary: document.querySelector("#archive-summary"),
  reignIndex: document.querySelector("#reign-index"),
  yearCount: document.querySelector("#year-count"),
  resourceHud: document.querySelector("#resource-hud"),
  objectiveList: document.querySelector("#objective-list"),
  card: document.querySelector("#event-card"),
  backgroundImage: document.querySelector("#background-image"),
  actorImage: document.querySelector("#actor-image"),
  cardTitle: document.querySelector("#card-title"),
  cardText: document.querySelector("#card-text"),
  choiceLeft: document.querySelector("#choice-left"),
  choiceRight: document.querySelector("#choice-right"),
  leftButton: document.querySelector("#left-button"),
  rightButton: document.querySelector("#right-button"),
  endingImage: document.querySelector("#ending-image"),
  endingName: document.querySelector("#ending-name"),
  endingTitle: document.querySelector("#ending-title"),
  endingSummary: document.querySelector("#ending-summary"),
  resultYears: document.querySelector("#result-years"),
  unlockedCount: document.querySelector("#unlocked-count"),
};

init();

async function init() {
  try {
    [eventPack, objectivePack, endingPack] = await Promise.all([
      loadJson(DATA_PATHS.events),
      loadJson(DATA_PATHS.objectives),
      loadJson(DATA_PATHS.endings),
    ]);
    bindEvents();
    renderArchiveSummary();
    showScreen("start");
  } catch (error) {
    showError(`数据加载失败。请从项目根目录启动静态服务器后访问 public/index.html。${error.message}`);
  }
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} ${response.status}`);
  }
  return response.json();
}

function bindEvents() {
  els.startButton.addEventListener("click", startReign);
  els.restartButton.addEventListener("click", startReign);
  els.nextReignButton.addEventListener("click", startReign);
  els.leftButton.addEventListener("click", () => choose("left"));
  els.rightButton.addEventListener("click", () => choose("right"));

  els.card.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", resetDrag);
}

function startReign() {
  const archive = readArchive();
  forcedEndingId = undefined;
  state = {
    emperorName: `第${archive.reigns.length + 1}任皇帝`,
    year: 1,
    turn: 0,
    reignIndex: archive.reigns.length + 1,
    resources: { people: 50, treasury: 50, army: 50, court: 50 },
    flags: { war_ongoing: false, famine_risk: false, taizi_established: false },
    counters: {
      years_ruled: 0,
      eunuch_power: 0,
      tax_anger: 0,
      army_discontent: 0,
      alchemy_trust: 0,
      famine_events_seen: 0,
      frontier_events_seen: 0,
    },
    completedObjectiveIds: [],
    currentObjectiveIds: pickObjectives(2),
    eventHistory: [],
    endingHistory: archive.unlockedEndingIds,
    cooldowns: {},
    nextQueue: [],
  };
  currentCard = selectNextCard();
  renderGame();
  showScreen("game");
}

function pickObjectives(count) {
  return [...objectivePack.objectives]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((objective) => objective.id);
}

function choose(side) {
  if (!currentCard || !state || isResolvingChoice) return;
  isResolvingChoice = true;

  const choice = currentCard[side];
  applyChoice(choice);
  state.eventHistory.push(currentCard.id);
  markTagCounters(currentCard);
  state.turn += 1;
  state.year += 1;
  state.counters.years_ruled += 1;
  if (currentCard.once) {
    state.cooldowns[currentCard.id] = Number.POSITIVE_INFINITY;
  } else if (currentCard.cooldown) {
    state.cooldowns[currentCard.id] = state.turn + currentCard.cooldown;
  }
  if (choice.nextCards?.length) {
    state.nextQueue.push(...choice.nextCards);
  }

  updateObjectiveProgress();
  const ending = resolveEnding();
  if (ending) {
    endReign(ending);
    isResolvingChoice = false;
    return;
  }

  currentCard = selectNextCard();
  resetDrag();
  renderGame();
  isResolvingChoice = false;
}

function applyChoice(choice) {
  choice.effects.forEach((effect) => {
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
      completeObjective(effect.objectiveId);
    }
    if (effect.type === "force_ending") {
      forcedEndingId = effect.endingId;
    }
  });
}

function markTagCounters(card) {
  if (card.tags.includes("famine")) {
    state.counters.famine_events_seen += 1;
  }
  if (card.tags.includes("frontier")) {
    state.counters.frontier_events_seen += 1;
  }
}

function selectNextCard() {
  while (state.nextQueue.length) {
    const queued = eventPack.cards.find((card) => card.id === state.nextQueue.shift());
    if (queued && isCardEligible(queued)) return queued;
  }

  const eligible = eventPack.cards.filter(isCardEligible);
  const candidates = eligible.length ? eligible : eventPack.cards;
  const weighted = [];

  candidates.forEach((card) => {
    const boost = resourcePressureBoost(card);
    const repeatPenalty = card.id === currentCard?.id && candidates.length > 1 ? 0.25 : 1;
    const count = Math.max(1, Math.round((card.weight + boost) * repeatPenalty));
    for (let index = 0; index < count; index += 1) weighted.push(card);
  });

  return weighted[Math.floor(Math.random() * weighted.length)];
}

function isCardEligible(card) {
  if (state.cooldowns[card.id] === Number.POSITIVE_INFINITY) return false;
  if ((state.cooldowns[card.id] ?? 0) > state.turn) return false;
  if (card.once && state.eventHistory.includes(card.id)) return false;
  return (card.conditions ?? []).every(evaluateCondition);
}

function evaluateCondition(condition) {
  if (condition.type === "resource_gte") return state.resources[condition.key] >= condition.value;
  if (condition.type === "resource_lte") return state.resources[condition.key] <= condition.value;
  if (condition.type === "flag_is") return state.flags[condition.key] === condition.value;
  if (condition.type === "counter_gte") return (state.counters[condition.key] ?? 0) >= condition.value;
  if (condition.type === "counter_lte") return (state.counters[condition.key] ?? 0) <= condition.value;
  if (condition.type === "not_seen") return !state.eventHistory.includes(condition.cardId);
  return true;
}

function resourcePressureBoost(card) {
  return RESOURCE_ORDER.reduce((score, key) => {
    const isPressed = state.resources[key] <= 20 || state.resources[key] >= 80;
    return score + (isPressed && card.tags.includes(key) ? 3 : 0);
  }, 0);
}

function updateObjectiveProgress() {
  state.currentObjectiveIds.forEach((objectiveId) => {
    const objective = objectivePack.objectives.find((item) => item.id === objectiveId);
    if (!objective || state.completedObjectiveIds.includes(objectiveId)) return;
    if (objective.conditions.every(evaluateCondition)) {
      completeObjective(objectiveId);
    }
  });
}

function completeObjective(objectiveId) {
  if (!state.completedObjectiveIds.includes(objectiveId)) {
    state.completedObjectiveIds.push(objectiveId);
  }
}

function resolveEnding() {
  if (forcedEndingId) return findEnding(forcedEndingId);
  if ((state.counters.alchemy_trust ?? 0) >= 3) return findEnding("alchemy_death");

  const resourceEndingMap = {
    people: { low: "rebellion", high: "expectation_revolt" },
    treasury: { low: "empty_treasury", high: "corruption_flood" },
    army: { low: "frontier_collapse", high: "military_takeover" },
    court: { low: "coup", high: "bureaucratic_suffocation" },
  };

  for (const key of RESOURCE_ORDER) {
    if (state.resources[key] <= 0) return findEnding(resourceEndingMap[key].low);
    if (state.resources[key] >= 100) return findEnding(resourceEndingMap[key].high);
  }

  const isStable = RESOURCE_ORDER.every((key) => state.resources[key] >= 35 && state.resources[key] <= 75);
  if (state.counters.years_ruled >= 20 && isStable) {
    return findEnding("peaceful_abdication");
  }

  return null;
}

function endReign(ending) {
  const archive = readArchive();
  const title = makeTitle(ending);
  const record = {
    endedAt: new Date().toISOString(),
    emperorName: state.emperorName,
    reignIndex: state.reignIndex,
    years: state.counters.years_ruled,
    endingId: ending.id,
    endingName: ending.name,
    title,
    finalResources: { ...state.resources },
    completedObjectiveIds: state.completedObjectiveIds,
    memorableCardIds: state.eventHistory.slice(-6),
  };
  archive.reigns.unshift(record);
  archive.reigns = archive.reigns.slice(0, 12);
  archive.bestYears = Math.max(archive.bestYears, record.years);
  archive.unlockedEndingIds = [...new Set([...archive.unlockedEndingIds, ending.id])];
  archive.lastResult = record;
  writeArchive(archive);

  els.endingImage.src = normalizeAssetPath(ending.image);
  els.endingName.textContent = ending.name;
  els.endingTitle.textContent = title;
  els.endingSummary.textContent = ending.shareTone;
  els.resultYears.textContent = record.years;
  els.unlockedCount.textContent = `${archive.unlockedEndingIds.length}/${endingPack.endings.length}`;
  renderArchiveSummary();
  showScreen("result");
}

function makeTitle(ending) {
  const completedHints = state.completedObjectiveIds
    .map((id) => objectivePack.objectives.find((objective) => objective.id === id)?.reward?.titleHint)
    .filter(Boolean);
  if (completedHints.length) return `${completedHints[completedHints.length - 1]}皇帝`;
  if (ending.type === "rare_good") return "准时下班皇帝";
  if (ending.type === "high_resource") return "用力过猛皇帝";
  return "祖宗摇头皇帝";
}

function findEnding(id) {
  return endingPack.endings.find((ending) => ending.id === id) ?? endingPack.endings[0];
}

function renderGame() {
  els.reignIndex.textContent = state.reignIndex;
  els.yearCount.textContent = state.year;
  renderResources();
  renderObjectives();
  renderCard();
}

function renderResources(preview = {}) {
  els.resourceHud.innerHTML = RESOURCE_ORDER.map((key) => {
    const value = state.resources[key];
    const danger = value <= 15 || value >= 85 ? "danger" : "";
    const previewClass = preview[key] ? `preview-${preview[key]}` : "";
    return `
      <div class="resource ${danger} ${previewClass}" aria-label="${RESOURCE_META[key].label}">
        <div class="resource-top">
          <img class="resource-icon" src="${RESOURCE_META[key].icon}" alt="${RESOURCE_META[key].label}" />
        </div>
        <div class="resource-bar">
          <div class="resource-fill" style="width: ${value}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderObjectives() {
  els.objectiveList.innerHTML = state.currentObjectiveIds.map((id) => {
    const objective = objectivePack.objectives.find((item) => item.id === id);
    const done = state.completedObjectiveIds.includes(id);
    return `<li class="${done ? "done" : ""}">${done ? "已成" : "未竟"}：${objective?.text ?? id}</li>`;
  }).join("");
}

function renderCard() {
  els.backgroundImage.src = `${BACKGROUND_PATH}${currentCard.background}.png`;
  els.actorImage.src = `${ACTOR_PATH}${currentCard.actor}.png`;
  els.cardTitle.textContent = currentCard.title ?? "奏对";
  els.cardText.textContent = currentCard.text;
  els.choiceLeft.textContent = currentCard.left.label;
  els.choiceRight.textContent = currentCard.right.label;
  els.leftButton.textContent = currentCard.left.label;
  els.rightButton.textContent = currentCard.right.label;
}

function renderArchiveSummary() {
  const archive = readArchive();
  if (!archive.reigns.length) {
    els.archiveSummary.textContent = "尚无王朝记录。史官正在磨墨。";
    return;
  }
  els.archiveSummary.textContent = `已记下 ${archive.reigns.length} 任皇帝，最长在位 ${archive.bestYears} 年，解锁 ${archive.unlockedEndingIds.length} 个结局。`;
}

function onPointerDown(event) {
  if (!currentCard) return;
  isDragging = true;
  dragStartX = event.clientX;
  dragOffsetX = 0;
  els.card.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event) {
  if (!isDragging) return;
  dragOffsetX = event.clientX - dragStartX;
  const rotate = dragOffsetX / 18;
  els.card.style.transform = `translateX(${dragOffsetX}px) rotate(${rotate}deg)`;
  const side = dragOffsetX < 0 ? "left" : "right";
  const activeChoice = currentCard?.[side];
  renderResources(Math.abs(dragOffsetX) > 20 ? activeChoice.preview ?? {} : {});
  els.choiceLeft.classList.toggle("visible", dragOffsetX < -20);
  els.choiceRight.classList.toggle("visible", dragOffsetX > 20);
}

function onPointerUp() {
  if (!isDragging) return;
  const threshold = Math.min(120, window.innerWidth * 0.24);
  if (dragOffsetX <= -threshold) {
    choose("left");
    return;
  }
  if (dragOffsetX >= threshold) {
    choose("right");
    return;
  }
  resetDrag();
}

function resetDrag() {
  isDragging = false;
  dragOffsetX = 0;
  els.card.style.transform = "";
  els.choiceLeft.classList.remove("visible");
  els.choiceRight.classList.remove("visible");
  if (state) renderResources();
}

function readArchive() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeArchive(JSON.parse(raw));
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      return defaultArchive();
    }
  }
  return defaultArchive();
}

function writeArchive(archive) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeArchive(archive)));
  } catch {
    // Storage can fail in private browsing or quota-limited mobile contexts.
  }
}

function showScreen(name) {
  els.start.classList.toggle("hidden", name !== "start");
  els.game.classList.toggle("hidden", name !== "game");
  els.result.classList.toggle("hidden", name !== "result");
  els.error.classList.toggle("hidden", name !== "error");
}

function showError(message) {
  els.errorMessage.textContent = message;
  showScreen("error");
}

function normalizeAssetPath(path) {
  return path.replace(/^public\//, "./");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function defaultArchive() {
  return { version: 1, reigns: [], unlockedEndingIds: [], bestYears: 0, lastResult: null };
}

function normalizeArchive(archive) {
  return {
    version: 1,
    reigns: Array.isArray(archive?.reigns) ? archive.reigns : [],
    unlockedEndingIds: Array.isArray(archive?.unlockedEndingIds) ? archive.unlockedEndingIds : [],
    bestYears: Number.isFinite(archive?.bestYears) ? archive.bestYears : 0,
    lastResult: archive?.lastResult ?? null,
  };
}

function renderGameToText() {
  const archive = readArchive();
  return JSON.stringify({
    screen: els.start.classList.contains("hidden")
      ? els.game.classList.contains("hidden")
        ? els.result.classList.contains("hidden") ? "error" : "result"
        : "game"
      : "start",
    reignIndex: state?.reignIndex ?? archive.reigns.length + 1,
    year: state?.year ?? null,
    resources: state ? { ...state.resources } : null,
    currentCard: currentCard ? {
      id: currentCard.id,
      actor: currentCard.actor,
      left: currentCard.left.label,
      right: currentCard.right.label,
    } : null,
    objectives: state?.currentObjectiveIds ?? [],
    completedObjectives: state?.completedObjectiveIds ?? [],
    archive: {
      bestYears: archive.bestYears,
      unlockedEndingIds: archive.unlockedEndingIds,
      reignCount: archive.reigns.length,
      lastResult: archive.lastResult,
    },
    coordinateSystem: "DOM viewport pixels, origin top-left, x right, y down",
  });
}

window.render_game_to_text = renderGameToText;
window.advanceTime = () => {};
window.__chineseReignsDebug = {
  startReign,
  choose,
  setResource(key, value) {
    if (!state || !RESOURCE_ORDER.includes(key)) return;
    state.resources[key] = clamp(value, 0, 100);
    renderGame();
  },
  resolveEndingNow() {
    if (!state) return null;
    const ending = resolveEnding();
    if (ending) endReign(ending);
    return ending?.id ?? null;
  },
};
