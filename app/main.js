import { createGameUI } from "../ui/game-ui.js";

const STORAGE_KEY = "wechat-survival-best";
const DAY_TOTAL = 7;

const EVENT_POOL = [
  {
    id: "rent_deadline",
    title: "房租提醒",
    text: "房东在群里@你：今晚12点前交租，不然加收违约金。",
    options: [
      { id: "pay_now", label: "硬着头皮先交", tag: "money", effects: { money: -3, reputation: 1, heat: -1 } },
      { id: "delay_excuse", label: "编理由缓一天", tag: "social", effects: { mood: -1, reputation: -2, heat: 1 } },
      { id: "roommate_split", label: "找室友先垫付", tag: "network", effects: { money: 1, reputation: -1, heat: 1 } },
    ],
  },
  {
    id: "boss_midnight",
    title: "领导深夜消息",
    text: "23:47 收到老板微信：明早8点前把方案重做一版。",
    options: [
      { id: "overtime", label: "连夜硬做", tag: "work", effects: { money: 2, energy: -3, mood: -1, heat: 1 } },
      { id: "deadline_talk", label: "争取合理时限", tag: "social", effects: { energy: 1, reputation: -1, mood: 1 } },
      { id: "template_fast", label: "套模板快改", tag: "risk", effects: { money: 1, energy: -1, reputation: -2, heat: 2 } },
    ],
  },
  {
    id: "viral_thread",
    title: "帖子爆了",
    text: "你随手发的吐槽贴突然上热门，评论区开始带节奏。",
    options: [
      { id: "ride_wave", label: "继续更新连载", tag: "content", effects: { money: 2, mood: 1, heat: 3, reputation: -1 } },
      { id: "lock_comments", label: "关评止损", tag: "control", effects: { heat: -2, reputation: 1, mood: -1 } },
      { id: "self_mock", label: "自嘲化解", tag: "social", effects: { mood: 1, reputation: 1, heat: 1 } },
    ],
  },
  {
    id: "health_alarm",
    title: "身体报警",
    text: "连续熬夜后心悸明显，你知道不能再硬顶。",
    options: [
      { id: "full_rest", label: "请假休息", tag: "rest", effects: { energy: 3, mood: 2, money: -2, heat: -1 } },
      { id: "coffee_push", label: "咖啡顶住", tag: "risk", effects: { energy: 1, mood: -2, reputation: 1, heat: 1 } },
      { id: "light_train", label: "去夜跑30分钟", tag: "rest", effects: { energy: 2, mood: 1, money: -1 } },
    ],
  },
  {
    id: "friend_wedding",
    title: "人情局",
    text: "朋友婚礼临时通知，红包、请假、关系都要处理。",
    options: [
      { id: "big_gift", label: "红包到位", tag: "network", effects: { money: -2, reputation: 2, mood: 1 } },
      { id: "small_gift", label: "礼轻情意重", tag: "social", effects: { money: -1, reputation: 0, mood: 0 } },
      { id: "skip_event", label: "找借口不去", tag: "control", effects: { money: 0, reputation: -2, mood: -1, heat: 1 } },
    ],
  },
  {
    id: "side_hustle",
    title: "副业机会",
    text: "群里有人发“稳赚副业”，看起来像风口也像坑。",
    options: [
      { id: "small_try", label: "小额试水", tag: "risk", effects: { money: 2, energy: -1, heat: 1 } },
      { id: "all_in", label: "直接梭哈", tag: "risk", effects: { money: 4, mood: 1, reputation: -3, heat: 3 } },
      { id: "ignore", label: "继续主业", tag: "work", effects: { money: 1, reputation: 1, mood: -1 } },
    ],
  },
  {
    id: "parent_call",
    title: "家里来电",
    text: "家里问你最近怎么样，催你稳定下来别折腾。",
    options: [
      { id: "honest", label: "坦白现状", tag: "social", effects: { mood: 1, reputation: 1, heat: -1 } },
      { id: "pretend_ok", label: "报喜不报忧", tag: "control", effects: { mood: -2, reputation: 1 } },
      { id: "ask_help", label: "开口求助", tag: "network", effects: { money: 2, reputation: -1, mood: 1 } },
    ],
  },
  {
    id: "team_conflict",
    title: "团队甩锅",
    text: "线上事故后群里互相甩锅，所有人都在截屏自保。",
    options: [
      { id: "collect_evidence", label: "先留证据", tag: "control", effects: { reputation: 2, mood: -1 } },
      { id: "direct_fight", label: "公开对线", tag: "social", effects: { reputation: -1, heat: 2, mood: 1 } },
      { id: "silent_fix", label: "闷头修复", tag: "work", effects: { money: 2, energy: -2, reputation: 1 } },
    ],
  },
];

function seededRandom(seed) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

function clamp(value, min = 0, max = 12) {
  return Math.max(min, Math.min(max, value));
}

function pickDailyEvents(seed) {
  const random = seededRandom(seed);
  const pool = [...EVENT_POOL];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, DAY_TOTAL);
}

function effectToText(effects) {
  const labels = [];
  if (effects.money) labels.push(`现金${effects.money > 0 ? "+" : ""}${effects.money}`);
  if (effects.energy) labels.push(`体力${effects.energy > 0 ? "+" : ""}${effects.energy}`);
  if (effects.mood) labels.push(`心态${effects.mood > 0 ? "+" : ""}${effects.mood}`);
  if (effects.reputation) labels.push(`人设${effects.reputation > 0 ? "+" : ""}${effects.reputation}`);
  if (effects.heat) labels.push(`热度${effects.heat > 0 ? "+" : ""}${effects.heat}`);
  return labels.join(" · ");
}

function endingByScore(score, alive) {
  if (!alive) return { id: "collapse", title: "城市崩溃线", subtitle: "你被现实按下了暂停键。" };
  if (score >= 42) return { id: "legend", title: "都市传说线", subtitle: "你活成了群聊里的样本。" };
  if (score >= 32) return { id: "steady", title: "稳住节奏线", subtitle: "你在高压里找到了平衡。" };
  return { id: "drift", title: "随波求生线", subtitle: "你撑过了这周，但还没破局。" };
}

function encodeChallenge(payload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/=/g, "").slice(0, 120);
}

function decodeChallenge(code) {
  try {
    const json = decodeURIComponent(escape(atob(code)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function createSession(seed = Date.now()) {
  return {
    seed,
    mode: "intro",
    dayIndex: 0,
    days: pickDailyEvents(seed),
    stats: {
      money: 6,
      energy: 6,
      mood: 6,
      reputation: 6,
      heat: 2,
    },
    skills: {
      powerNap: 1,
      borrowCash: 1,
    },
    history: [],
    lastTag: null,
    sameTagCount: 0,
    result: null,
  };
}

const state = {
  session: createSession(20260227),
  importCode: "",
  bestScore: Number(localStorage.getItem(STORAGE_KEY) || 0),
};

const root = document.querySelector("#app");

function applyEffects(target, effects) {
  target.money = clamp(target.money + (effects.money || 0));
  target.energy = clamp(target.energy + (effects.energy || 0));
  target.mood = clamp(target.mood + (effects.mood || 0));
  target.reputation = clamp(target.reputation + (effects.reputation || 0));
  target.heat = clamp(target.heat + (effects.heat || 0), 0, 10);
}

function computeScore(session) {
  return (
    session.stats.money * 2 +
    session.stats.energy * 2 +
    session.stats.mood * 2 +
    session.stats.reputation * 2 +
    session.stats.heat
  );
}

function finishSession(alive) {
  const score = computeScore(state.session);
  const ending = endingByScore(score, alive);
  const challengeCode = encodeChallenge({
    seed: state.session.seed,
    score,
    ending: ending.id,
    days: state.session.history.map((item) => `${item.eventId}.${item.optionId}`).slice(0, 10),
  });

  state.session.mode = "ended";
  state.session.result = {
    alive,
    score,
    ending,
    challengeCode,
  };

  state.bestScore = Math.max(state.bestScore, score);
  localStorage.setItem(STORAGE_KEY, String(state.bestScore));
}

function applyChoice(option) {
  const session = state.session;
  if (session.mode !== "playing") return;

  applyEffects(session.stats, option.effects);

  if (session.lastTag === option.tag) {
    session.sameTagCount += 1;
  } else {
    session.sameTagCount = 1;
    session.lastTag = option.tag;
  }

  if (session.sameTagCount >= 3) {
    session.stats.mood = clamp(session.stats.mood - 1);
    session.stats.reputation = clamp(session.stats.reputation - 1);
  }

  const currentEvent = session.days[session.dayIndex];
  session.history.push({
    day: session.dayIndex + 1,
    eventId: currentEvent.id,
    optionId: option.id,
    optionLabel: option.label,
    tag: option.tag,
    impactText: effectToText(option.effects),
  });

  const dead = [session.stats.money, session.stats.energy, session.stats.mood, session.stats.reputation].some((v) => v <= 0);
  if (dead) {
    finishSession(false);
    return;
  }

  session.dayIndex += 1;
  if (session.dayIndex >= DAY_TOTAL) {
    finishSession(true);
  }
}

function useSkill(skillId) {
  const session = state.session;
  if (session.mode !== "playing") return;
  if (!session.skills[skillId]) return;

  if (skillId === "powerNap") {
    session.skills.powerNap = 0;
    applyEffects(session.stats, { energy: 2, mood: 1, heat: -1 });
  }
  if (skillId === "borrowCash") {
    session.skills.borrowCash = 0;
    applyEffects(session.stats, { money: 3, reputation: -2, heat: 1 });
  }

  const dead = [session.stats.money, session.stats.energy, session.stats.mood, session.stats.reputation].some((v) => v <= 0);
  if (dead) finishSession(false);
}

function startNew(seed = Date.now()) {
  state.session = createSession(seed);
  state.session.mode = "playing";
}

function currentEvent(session) {
  return session.days[session.dayIndex] || null;
}

function shareText() {
  const result = state.session.result;
  if (!result) return "";
  const lines = [
    `我在《城市生存7天》打出 ${result.score} 分，结局：${result.ending.title}`,
    `挑战码：${result.challengeCode}`,
    `打开同链接输入挑战码就能复刻我的局。`,
  ];
  return lines.join("\n");
}

function buildView() {
  const session = state.session;
  const event = currentEvent(session);
  const score = computeScore(session);

  return {
    mode: session.mode,
    day: session.dayIndex + 1,
    dayTotal: DAY_TOTAL,
    bestScore: state.bestScore,
    score,
    stats: { ...session.stats },
    event: event
      ? {
          id: event.id,
          title: event.title,
          text: event.text,
          options: event.options.map((option) => ({
            ...option,
            impactText: effectToText(option.effects),
          })),
        }
      : null,
    skills: { ...session.skills },
    history: session.history.slice(-4),
    result: session.result,
    importCode: state.importCode,
    shareText: shareText(),
  };
}

function refresh() {
  ui.render(buildView());
}

function copyShare() {
  const text = shareText();
  if (!text) return;
  navigator.clipboard?.writeText(text).catch(() => {
    window.prompt("复制这段分享文案", text);
  });
}

const ui = createGameUI(root, {
  onStart: () => {
    startNew(Date.now());
    refresh();
  },
  onPickOption: (optionId) => {
    const event = currentEvent(state.session);
    const option = event?.options.find((item) => item.id === optionId);
    if (!option) return;
    applyChoice(option);
    refresh();
  },
  onUseSkill: (skillId) => {
    useSkill(skillId);
    refresh();
  },
  onRestart: () => {
    startNew(Date.now());
    refresh();
  },
  onCopyShare: () => copyShare(),
  onImportCodeChange: (value) => {
    state.importCode = value.trim();
  },
  onImportChallenge: () => {
    const parsed = decodeChallenge(state.importCode);
    if (!parsed || !parsed.seed) {
      return;
    }
    startNew(Number(parsed.seed));
    refresh();
  },
});

window.render_game_to_text = () => {
  const v = buildView();
  return JSON.stringify({
    coordinateSystem: "UI only; one-column mobile card layout.",
    mode: v.mode,
    day: `${Math.min(v.day, v.dayTotal)}/${v.dayTotal}`,
    score: v.score,
    stats: v.stats,
    currentEvent: v.event
      ? {
          id: v.event.id,
          title: v.event.title,
          options: v.event.options.map((item) => ({ id: item.id, label: item.label, impactText: item.impactText })),
        }
      : null,
    skills: v.skills,
    history: v.history,
    result: v.result,
  });
};

window.advanceTime = () => refresh();

refresh();
