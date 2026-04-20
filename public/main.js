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
let currentEnding;
let currentRecord;
let sharePreviewUrl;

const els = {
  start: document.querySelector("#start-screen"),
  game: document.querySelector("#game-screen"),
  result: document.querySelector("#result-screen"),
  error: document.querySelector("#error-screen"),
  errorMessage: document.querySelector("#error-message"),
  startButton: document.querySelector("#start-button"),
  restartButton: document.querySelector("#restart-button"),
  nextReignButton: document.querySelector("#next-reign-button"),
  generateShareButton: document.querySelector("#generate-share-button"),
  saveShareButton: document.querySelector("#save-share-button"),
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
  shareStatus: document.querySelector("#share-status"),
  sharePreviewPanel: document.querySelector("#share-preview-panel"),
  sharePreviewImage: document.querySelector("#share-preview-image"),
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
  els.generateShareButton.addEventListener("click", () => prepareShareCard(false));
  els.saveShareButton.addEventListener("click", () => prepareShareCard(true));
  els.leftButton.addEventListener("click", () => choose("left"));
  els.rightButton.addEventListener("click", () => choose("right"));

  els.card.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", resetDrag);
}

function startReign() {
  resetSharePreview();
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
  const result = selectEngineNextCard({ state, eventPack, currentCard, rules: rulesPack });
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
  currentEnding = ending;
  currentRecord = record;
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
  els.shareStatus.textContent = "可生成一张本地结果图，长按也能保存。";
  resetSharePreview();
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
  document.body.classList.toggle("game-active", name === "game");
  document.documentElement.classList.toggle("game-active", name === "game");
}

function showError(message) {
  els.errorMessage.textContent = message;
  showScreen("error");
}

function normalizeAssetPath(path) {
  return path.replace(/^public\//, "./");
}

async function prepareShareCard(triggerDownload) {
  if (!currentEnding || !currentRecord) return;
  els.shareStatus.textContent = triggerDownload ? "正在准备结果图..." : "正在生成结果图...";
  try {
    const blob = await buildShareCardBlob({
      ending: currentEnding,
      record: currentRecord,
      unlockedCount: readArchive().unlockedEndingIds.length,
      totalEndingCount: endingPack.endings.length,
    });
    showSharePreview(blob);
    if (triggerDownload) {
      downloadShareBlob(blob, `${currentEnding.id}-${currentRecord.years}y-share.png`);
      els.shareStatus.textContent = "结果图已生成。桌面会直接下载，手机也可长按预览图保存。";
    } else {
      els.shareStatus.textContent = "结果图已生成。长按预览图即可保存。";
    }
  } catch (error) {
    els.shareStatus.textContent = `结果图生成失败：${error.message}`;
  }
}

async function buildShareCardBlob({ ending, record, unlockedCount, totalEndingCount }) {
  const width = 1024;
  const height = 1536;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持 Canvas");

  const [background, endingImage] = await Promise.all([
    loadImage("./assets/chinese-reigns/share/result-card-bg.png"),
    loadImage(normalizeAssetPath(ending.image)),
  ]);

  ctx.drawImage(background, 0, 0, width, height);
  drawShareCard(ctx, { width, height, ending, record, unlockedCount, totalEndingCount, endingImage });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("导出图片失败"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

function drawShareCard(ctx, { width, height, ending, record, unlockedCount, totalEndingCount, endingImage }) {
  ctx.fillStyle = "rgba(251, 250, 241, 0.88)";
  roundRect(ctx, 58, 56, width - 116, height - 112, 32);
  ctx.fill();

  ctx.drawImage(endingImage, 128, 188, width - 256, width - 256);

  ctx.fillStyle = "#5b8b5a";
  ctx.font = "700 36px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("朕的一生", 128, 108);

  ctx.fillStyle = "#27302b";
  ctx.font = "900 72px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  wrapText(ctx, ending.name, 128, 900, width - 256, 88, 2);

  ctx.fillStyle = "#5b8b5a";
  ctx.font = "800 40px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  wrapText(ctx, record.title, 128, 1010, width - 256, 52, 2);

  ctx.fillStyle = "#69736b";
  ctx.font = "500 34px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  wrapText(ctx, ending.shareTone, 128, 1110, width - 256, 48, 3);

  const statsTop = 1290;
  drawStatBlock(ctx, { x: 128, y: statsTop, label: "在位", value: `${record.years} 年` });
  drawStatBlock(ctx, { x: 512, y: statsTop, label: "已解锁", value: `${unlockedCount}/${totalEndingCount}` });

  ctx.fillStyle = "#69736b";
  ctx.font = "500 26px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("长按保存这张结果图，继续看看下一任皇帝会把王朝滑去哪里。", 128, 1440);
}

function drawStatBlock(ctx, { x, y, label, value }) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  roundRect(ctx, x, y, 300, 112, 24);
  ctx.fill();
  ctx.fillStyle = "#69736b";
  ctx.font = "700 24px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(label, x + 28, y + 38);
  ctx.fillStyle = "#27302b";
  ctx.font = "900 42px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(value, x + 28, y + 84);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const chars = [...text];
  const lines = [];
  let current = "";
  chars.forEach((char) => {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  lines.slice(0, maxLines).forEach((line, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? "..." : "";
    ctx.fillText(line + suffix, x, y + index * lineHeight);
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function showSharePreview(blob) {
  resetSharePreview();
  sharePreviewUrl = URL.createObjectURL(blob);
  els.sharePreviewImage.src = sharePreviewUrl;
  els.sharePreviewPanel.classList.remove("hidden");
}

function resetSharePreview() {
  if (sharePreviewUrl) {
    URL.revokeObjectURL(sharePreviewUrl);
    sharePreviewUrl = undefined;
  }
  if (els.sharePreviewImage) els.sharePreviewImage.removeAttribute("src");
  els.sharePreviewPanel?.classList.add("hidden");
}

function downloadShareBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`图片加载失败：${src}`));
    image.src = src;
  });
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
