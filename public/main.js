import {
  RESOURCE_ORDER,
  applyChoiceToState,
  createInitialState,
  createReignRecord,
  resolveEnding as resolveEngineEnding,
  resolveEndingWithRules,
  selectNextCard as selectEngineNextCard,
  updateObjectiveProgress,
  clamp,
} from "./engine.js";

const RESOURCE_META = {
  people: { label: "民心", icon: "./assets/chinese-reigns/icons/people-transparent.png" },
  treasury: { label: "国库", icon: "./assets/chinese-reigns/icons/treasury-transparent.png" },
  army: { label: "兵权", icon: "./assets/chinese-reigns/icons/army-transparent.png" },
  court: { label: "朝政", icon: "./assets/chinese-reigns/icons/court-transparent.png" },
};

const STORAGE_KEY = "chinese-reigns-mvp-archive";
const DATA_PATHS = {
  events: "./data/chinese-reigns/events.mvp.seed.json",
  objectives: "./data/chinese-reigns/objectives.mvp.seed.json",
  endings: "./data/chinese-reigns/endings.mvp.seed.json",
  rules: "./data/chinese-reigns/rules.mvp.seed.json",
};

const ACTOR_PATH = "./assets/chinese-reigns/portraits/";
const BACKGROUND_PATH = "./assets/chinese-reigns/backgrounds/";

let eventPack;
let objectivePack;
let endingPack;
let rulesPack;
let state;
let currentCard;
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
    [eventPack, objectivePack, endingPack, rulesPack] = await Promise.all([
      loadJson(DATA_PATHS.events),
      loadJson(DATA_PATHS.objectives),
      loadJson(DATA_PATHS.endings),
      loadJson(DATA_PATHS.rules),
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
  state = createInitialState({ archive, objectivePack });
  currentCard = selectNextCard();
  renderGame();
  showScreen("game");
}

function choose(side) {
  if (!currentCard || !state || isResolvingChoice) return;
  isResolvingChoice = true;

  state = applyChoiceToState(state, currentCard, side, rulesPack);
  state = updateObjectiveProgress(state, objectivePack);
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

function selectNextCard() {
  const result = selectEngineNextCard({ state, eventPack, currentCard });
  state = result.state;
  return result.card;
}

function resolveEnding() {
  return resolveEndingWithRules(state, endingPack, rulesPack);
}

function endReign(ending) {
  const archive = readArchive();
  const title = makeTitle(ending);
  const record = createReignRecord({ state, ending, title });
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
  if (ending.type === "late_reign") return "熬过三代史官皇帝";
  if (ending.type === "high_resource") return "用力过猛皇帝";
  return "祖宗摇头皇帝";
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
  setCounter(key, value) {
    if (!state) return;
    state.counters[key] = Math.max(0, value);
    if (key === "years_ruled") {
      state.year = value + 1;
    }
    renderGame();
  },
  resolveEndingNow() {
    if (!state) return null;
    const ending = resolveEnding();
    if (ending) endReign(ending);
    return ending?.id ?? null;
  },
};
