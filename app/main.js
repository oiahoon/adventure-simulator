import { createGameUI } from "../ui/game-ui.js";

const STORAGE_KEY = "wechat-survival-best";
const DAY_TOTAL = 7;

function clamp(value, min = 0, max = 12) {
  return Math.max(min, Math.min(max, value));
}

function cloneStats(stats) {
  return {
    money: stats.money,
    energy: stats.energy,
    mood: stats.mood,
    reputation: stats.reputation,
    heat: stats.heat,
  };
}

function statsDelta(before, after) {
  return {
    money: after.money - before.money,
    energy: after.energy - before.energy,
    mood: after.mood - before.mood,
    reputation: after.reputation - before.reputation,
    heat: after.heat - before.heat,
  };
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

function applyEffects(target, effects) {
  target.money = clamp(target.money + (effects.money || 0));
  target.energy = clamp(target.energy + (effects.energy || 0));
  target.mood = clamp(target.mood + (effects.mood || 0));
  target.reputation = clamp(target.reputation + (effects.reputation || 0));
  target.heat = clamp(target.heat + (effects.heat || 0), 0, 10);
}

function applyOptionMeta(session, option) {
  (option.setFlags || []).forEach((flag) => {
    session.flags[flag] = true;
  });
  (option.clearFlags || []).forEach((flag) => {
    delete session.flags[flag];
  });
}

function chapterTemplate(id, chapter, title, text, causeText, options) {
  return { id, chapter, title, text, causeText, options };
}

function resolveEvent(session, dayIndex) {
  const flags = session.flags;
  const s = session.stats;

  if (dayIndex === 0) {
    return chapterTemplate(
      "chapter_1_opening",
      "第一章：开局压力",
      "房租+绩效双重预警",
      "房东催租和绩效考核同天砸来，你必须先选一条生存策略。",
      "起点事件，决定后续是债务线还是职场线。",
      [
        {
          id: "pay_rent_first",
          label: "先交房租保底",
          tag: "money",
          effects: { money: -3, mood: -1, reputation: 1 },
          setFlags: ["rent_secured"],
        },
        {
          id: "ask_friend_buffer",
          label: "找朋友垫一周",
          tag: "network",
          effects: { money: 2, reputation: -1, heat: 1 },
          setFlags: ["debt_line"],
        },
        {
          id: "overtime_cash",
          label: "接夜班换现金",
          tag: "work",
          effects: { money: 2, energy: -2, mood: -1 },
          setFlags: ["overwork_line"],
        },
      ]
    );
  }

  if (dayIndex === 1) {
    if (flags.debt_line) {
      return chapterTemplate(
        "chapter_2_debt",
        "第二章：债务扩散",
        "熟人垫付开始催回",
        "你借的缓冲金开始到期，群里气氛越来越尴尬。",
        "由第一章“找朋友垫付”触发。",
        [
          {
            id: "repay_partial",
            label: "先还一半稳关系",
            tag: "money",
            effects: { money: -2, reputation: 2, mood: -1 },
            setFlags: ["reputation_stable"],
          },
          {
            id: "delay_again",
            label: "继续拖一拖",
            tag: "risk",
            effects: { mood: -1, reputation: -2, heat: 1 },
            setFlags: ["debt_overhang"],
          },
          {
            id: "swap_favor",
            label: "用人情置换",
            tag: "social",
            effects: { money: 1, reputation: 0, heat: 1 },
            setFlags: ["favor_trade"],
          },
        ]
      );
    }

    return chapterTemplate(
      "chapter_2_work",
      "第二章：工位风暴",
      "凌晨改方案",
      "你被点名做“紧急重构”，群聊里全是已读不回。",
      "由第一章选择后的生存策略进入职场线。",
      [
        {
          id: "hard_push",
          label: "硬顶交付",
          tag: "work",
          effects: { money: 2, energy: -3, mood: -1 },
          setFlags: ["overwork_line"],
        },
        {
          id: "negotiate_scope",
          label: "砍范围保质量",
          tag: "control",
          effects: { energy: 1, reputation: 1, money: 0 },
          setFlags: ["scope_control"],
        },
        {
          id: "template_quickfix",
          label: "模板速成",
          tag: "risk",
          effects: { money: 1, reputation: -2, heat: 1 },
          setFlags: ["quality_risk"],
        },
      ]
    );
  }

  if (dayIndex === 2) {
    if (flags.quality_risk || flags.debt_overhang) {
      return chapterTemplate(
        "chapter_3_public",
        "第三章：舆论起火",
        "匿名吐槽帖带节奏",
        "你的名字开始被影射，评论区逐渐失控。",
        "由前两章高风险选择触发反噬。",
        [
          {
            id: "post_clarify",
            label: "发澄清帖",
            tag: "social",
            effects: { reputation: 1, heat: -1, mood: -1 },
            setFlags: ["public_fight"],
          },
          {
            id: "silent_mute",
            label: "关评冷处理",
            tag: "control",
            effects: { heat: -2, reputation: -1, mood: 1 },
            setFlags: ["silent_line"],
          },
          {
            id: "counter_meme",
            label: "发梗反打",
            tag: "content",
            effects: { heat: 2, mood: 1, reputation: -1 },
            setFlags: ["content_line"],
          },
        ]
      );
    }

    return chapterTemplate(
      "chapter_3_breath",
      "第三章：短暂喘息",
      "你获得一个缓冲窗口",
      "危机暂时缓和，但后续分岔已经埋下。",
      "由前两章稳健选择触发。",
      [
        {
          id: "bank_budget",
          label: "做预算表",
          tag: "control",
          effects: { money: 1, mood: 1 },
          setFlags: ["budget_mode"],
        },
        {
          id: "social_dinner",
          label: "去社交饭局",
          tag: "network",
          effects: { reputation: 2, money: -1, energy: -1 },
          setFlags: ["network_mode"],
        },
        {
          id: "doom_scroll",
          label: "刷帖逃避",
          tag: "risk",
          effects: { mood: -2, heat: 1 },
          setFlags: ["anxiety_mode"],
        },
      ]
    );
  }

  if (dayIndex === 3) {
    if (flags.overwork_line || s.energy <= 3) {
      return chapterTemplate(
        "chapter_4_health",
        "第四章：身体预警",
        "体力断崖",
        "你开始出现明显疲劳症状，任何决定都在透支未来。",
        "由连续高压工作或低体力触发。",
        [
          {
            id: "force_rest",
            label: "强制休整",
            tag: "rest",
            effects: { energy: 3, mood: 2, money: -1 },
            setFlags: ["rest_recovery"],
          },
          {
            id: "energy_drink",
            label: "继续硬扛",
            tag: "risk",
            effects: { energy: 1, mood: -2, heat: 1 },
            setFlags: ["burnout_risk"],
          },
          {
            id: "delegate_tasks",
            label: "拆分任务",
            tag: "network",
            effects: { energy: 1, reputation: -1, mood: 1 },
            setFlags: ["delegation_path"],
          },
        ]
      );
    }

    return chapterTemplate(
      "chapter_4_relation",
      "第四章：关系拉扯",
      "人情与边界冲突",
      "你开始在“维系关系”与“保护自己”之间左右互搏。",
      "由前几章未触发体力危机进入关系线。",
      [
        {
          id: "help_everyone",
          label: "尽量都帮",
          tag: "social",
          effects: { reputation: 2, energy: -2, mood: -1 },
          setFlags: ["overcommit"],
        },
        {
          id: "set_boundary",
          label: "明确边界",
          tag: "control",
          effects: { mood: 1, reputation: -1, heat: -1 },
          setFlags: ["boundary_mode"],
        },
        {
          id: "trade_resources",
          label: "资源互换",
          tag: "network",
          effects: { money: 1, reputation: 1, heat: 1 },
          setFlags: ["resource_swap"],
        },
      ]
    );
  }

  if (dayIndex === 4) {
    if (s.heat >= 7 || flags.content_line) {
      return chapterTemplate(
        "chapter_5_heat",
        "第五章：热度反噬",
        "你被推上风口",
        "看似有流量，实则每条评论都在吃你的状态值。",
        "由高热度或内容路线触发。",
        [
          {
            id: "issue_statement",
            label: "发正式说明",
            tag: "control",
            effects: { heat: -2, reputation: 1, mood: -1 },
            setFlags: ["stabilized"],
          },
          {
            id: "farm_traffic",
            label: "继续冲热度",
            tag: "risk",
            effects: { heat: 2, money: 1, reputation: -2 },
            setFlags: ["viral_path"],
          },
          {
            id: "logout_day",
            label: "离线一天",
            tag: "rest",
            effects: { mood: 2, heat: -1, money: -1 },
            setFlags: ["offline_day"],
          },
        ]
      );
    }

    return chapterTemplate(
      "chapter_5_cash",
      "第五章：现金流临界",
      "账单集中到期",
      "各种账单在同一天到来，你只能保一个重点。",
      "由中低热度进入现金决策线。",
      [
        {
          id: "pay_necessity",
          label: "只保刚需",
          tag: "control",
          effects: { money: -1, mood: 1 },
          setFlags: ["survival_focus"],
        },
        {
          id: "borrow_rotate",
          label: "借新还旧",
          tag: "risk",
          effects: { money: 2, reputation: -2, heat: 1 },
          setFlags: ["debt_spiral"],
        },
        {
          id: "extra_job",
          label: "临时接单",
          tag: "work",
          effects: { money: 2, energy: -2, mood: -1 },
          setFlags: ["grind_path"],
        },
      ]
    );
  }

  if (dayIndex === 5) {
    if (flags.debt_spiral || s.money <= 2) {
      return chapterTemplate(
        "chapter_6_debt",
        "第六章：债务摊牌",
        "你必须解释钱去哪了",
        "借贷链条开始反噬，你要面对真实代价。",
        "由第五章借新还旧或低现金触发。",
        [
          {
            id: "full_disclose",
            label: "坦白并重排预算",
            tag: "control",
            effects: { reputation: 1, mood: -1, money: 1 },
            setFlags: ["budget_rebuild"],
          },
          {
            id: "hide_again",
            label: "继续隐瞒",
            tag: "risk",
            effects: { reputation: -2, mood: -1, heat: 1 },
            setFlags: ["trust_break"],
          },
          {
            id: "sell_assets",
            label: "处理闲置回血",
            tag: "money",
            effects: { money: 2, mood: -1 },
            setFlags: ["asset_liquidation"],
          },
        ]
      );
    }

    return chapterTemplate(
      "chapter_6_pivot",
      "第六章：方向抉择",
      "你要决定接下来怎么活",
      "短期止血还是长期转型，决定第七天结局基调。",
      "由前五章表现进入转型线。",
      [
        {
          id: "upskill_focus",
          label: "投入学习",
          tag: "work",
          effects: { money: -1, energy: -1, reputation: 2 },
          setFlags: ["upgrade_route"],
        },
        {
          id: "relationship_route",
          label: "经营关系网络",
          tag: "network",
          effects: { reputation: 2, heat: 1, mood: 1 },
          setFlags: ["network_route"],
        },
        {
          id: "survival_route",
          label: "继续保守求生",
          tag: "rest",
          effects: { mood: 1, energy: 1, money: -1 },
          setFlags: ["survival_route"],
        },
      ]
    );
  }

  return chapterTemplate(
    "chapter_7_finale",
    "第七章：结局之夜",
    "最后一次选择",
    "这不是单一事件，而是你前六章选择的集中兑现。",
    "结局节点：系统将综合你的历程给出结局线。",
    [
      {
        id: "final_attack",
        label: "搏一把翻盘",
        tag: "risk",
        effects: { money: 2, energy: -2, mood: -1, heat: 1 },
      },
      {
        id: "final_balance",
        label: "稳住基本盘",
        tag: "control",
        effects: { money: 0, energy: 1, mood: 1, reputation: 1 },
      },
      {
        id: "final_logout",
        label: "给自己留白",
        tag: "rest",
        effects: { mood: 2, energy: 2, money: -1, heat: -1 },
      },
    ]
  );
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

function weakestStat(stats) {
  const entries = [
    ["现金", stats.money],
    ["体力", stats.energy],
    ["心态", stats.mood],
    ["人设", stats.reputation],
  ];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0];
}

function endingByScore(score, alive) {
  if (!alive) return { id: "collapse", title: "城市崩溃线", subtitle: "你被现实按下了暂停键。" };
  if (score >= 42) return { id: "legend", title: "都市传说线", subtitle: "你活成了群聊里的样本。" };
  if (score >= 32) return { id: "steady", title: "稳住节奏线", subtitle: "你在高压里找到了平衡。" };
  return { id: "drift", title: "随波求生线", subtitle: "你撑过了这周，但还没破局。" };
}

function buildEndingReason(session, alive) {
  const totals = { money: 0, energy: 0, mood: 0, reputation: 0, heat: 0 };
  let worstDay = null;
  let worstImpactScore = 0;

  session.history.forEach((entry) => {
    const delta = entry.delta || {};
    totals.money += delta.money || 0;
    totals.energy += delta.energy || 0;
    totals.mood += delta.mood || 0;
    totals.reputation += delta.reputation || 0;
    totals.heat += delta.heat || 0;

    const impactScore =
      Math.min(0, delta.money || 0) +
      Math.min(0, delta.energy || 0) +
      Math.min(0, delta.mood || 0) +
      Math.min(0, delta.reputation || 0);
    if (impactScore < worstImpactScore) {
      worstImpactScore = impactScore;
      worstDay = entry;
    }
  });

  const [weakName, weakValue] = weakestStat(session.stats);
  const riskChoices = session.history.filter((entry) => entry.tag === "risk").length;

  const bullets = [];
  if (!alive) {
    bullets.push(`触发失败条件：${weakName}跌到 ${weakValue}。`);
  } else {
    bullets.push(`最终短板：${weakName}仅 ${weakValue}，是你最危险的维度。`);
  }

  const losses = [
    ["现金", totals.money],
    ["体力", totals.energy],
    ["心态", totals.mood],
    ["人设", totals.reputation],
  ]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map((item) => `${item[0]}${item[1] > 0 ? "+" : ""}${item[1]}`)
    .join("、");
  bullets.push(`整局主要损耗：${losses}。`);

  if (riskChoices >= 2) bullets.push(`你本局做了 ${riskChoices} 次高风险选择，波动明显变大。`);
  if (worstDay) bullets.push(`关键转折：Day ${worstDay.day}「${worstDay.eventTitle}」选择「${worstDay.optionLabel}」。`);
  if (session.sameTagCount >= 3) bullets.push("连续同风格决策触发疲劳惩罚（心态/人设下降）。");

  return {
    weakest: { name: weakName, value: weakValue },
    keyDay: worstDay ? worstDay.day : null,
    bullets,
  };
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
    stats: {
      money: 6,
      energy: 6,
      mood: 6,
      reputation: 6,
      heat: 2,
    },
    flags: {},
    skills: {
      powerNap: 1,
      borrowCash: 1,
    },
    history: [],
    sameTagCount: 0,
    lastTag: null,
    result: null,
  };
}

const state = {
  session: createSession(20260227),
  importCode: "",
  bestScore: Number(localStorage.getItem(STORAGE_KEY) || 0),
};

const root = document.querySelector("#app");

function currentEvent(session) {
  return resolveEvent(session, session.dayIndex);
}

async function generateStoryNarrative() {
  const result = state.session.result;
  if (!result) return;

  const payload = {
    history: state.session.history,
    stats: state.session.stats,
    ending: result.ending,
    reasonBullets: result.reason?.bullets || [],
  };

  try {
    const endpoints = ["/api/story/summary", "/api/story-summary"];
    let okData = null;
    let lastError = "story_unavailable";

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        lastError = `http_${response.status}`;
        continue;
      }
      const data = await response.json();
      if (data?.ok && data.story) {
        okData = data;
        break;
      }
      lastError = data?.error || "story_unavailable";
    }

    if (okData?.story) {
      result.storyNarrative = okData.story;
      result.storyLoading = false;
      result.storyError = "";
    } else {
      result.storyLoading = false;
      result.storyError = lastError;
    }
  } catch {
    result.storyLoading = false;
    result.storyError = "story_request_failed";
  }
  refresh();
}

function finishSession(alive) {
  const score = computeScore(state.session);
  const ending = endingByScore(score, alive);
  const reason = buildEndingReason(state.session, alive);
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
    reason,
    challengeCode,
    storyNarrative: "",
    storyLoading: true,
    storyError: "",
  };

  state.bestScore = Math.max(state.bestScore, score);
  localStorage.setItem(STORAGE_KEY, String(state.bestScore));

  generateStoryNarrative();
}

function applyChoice(optionId) {
  const session = state.session;
  if (session.mode !== "playing") return;

  const event = currentEvent(session);
  const option = event.options.find((item) => item.id === optionId);
  if (!option) return;

  const before = cloneStats(session.stats);
  applyEffects(session.stats, option.effects);
  applyOptionMeta(session, option);

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

  const after = cloneStats(session.stats);
  session.history.push({
    day: session.dayIndex + 1,
    eventId: event.id,
    eventTitle: event.title,
    optionId: option.id,
    optionLabel: option.label,
    tag: option.tag,
    impactText: effectToText(option.effects),
    delta: statsDelta(before, after),
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

  const before = cloneStats(session.stats);
  if (skillId === "powerNap") {
    session.skills.powerNap = 0;
    applyEffects(session.stats, { energy: 2, mood: 1, heat: -1 });
  }
  if (skillId === "borrowCash") {
    session.skills.borrowCash = 0;
    applyEffects(session.stats, { money: 3, reputation: -2, heat: 1 });
  }
  const after = cloneStats(session.stats);

  session.history.push({
    day: session.dayIndex + 1,
    eventId: "skill_use",
    eventTitle: "临时技能",
    optionId: skillId,
    optionLabel: skillId === "powerNap" ? "打个盹" : "找朋友借钱",
    tag: "skill",
    impactText: effectToText(statsDelta(before, after)),
    delta: statsDelta(before, after),
  });

  const dead = [session.stats.money, session.stats.energy, session.stats.mood, session.stats.reputation].some((v) => v <= 0);
  if (dead) finishSession(false);
}

function startNew(seed = Date.now()) {
  state.session = createSession(seed);
  state.session.mode = "playing";
}

function shareText() {
  const result = state.session.result;
  if (!result) return "";
  return [
    `我在《城市生存7天》打出 ${result.score} 分，结局：${result.ending.title}`,
    `结局成因：${result.reason?.bullets?.[0] || "稳住了主要属性"}`,
    `挑战码：${result.challengeCode}`,
    "打开同链接输入挑战码就能复刻我的局。",
  ].join("\n");
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
    event:
      session.mode === "playing"
        ? {
            id: event.id,
            chapter: event.chapter,
            title: event.title,
            text: event.text,
            causeText: event.causeText,
            options: event.options.map((option) => ({
              ...option,
              impactText: effectToText(option.effects),
            })),
          }
        : null,
    skills: { ...session.skills },
    history: session.history.filter((item) => item.eventId !== "skill_use").slice(-5),
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
    applyChoice(optionId);
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
    if (!parsed || !parsed.seed) return;
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
          chapter: v.event.chapter,
          title: v.event.title,
          causeText: v.event.causeText,
          options: v.event.options.map((item) => ({ id: item.id, label: item.label, impactText: item.impactText })),
        }
      : null,
    history: v.history,
    result: v.result,
  });
};

window.advanceTime = () => refresh();

refresh();
