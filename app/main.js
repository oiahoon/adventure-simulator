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
  {
    id: "subway_incident",
    title: "地铁冲突",
    text: "早高峰被推搡后你手机差点掉轨道，心态直接爆表。",
    options: [
      { id: "argue", label: "当场理论", tag: "social", effects: { mood: -1, reputation: -1, heat: 2 } },
      { id: "walk_away", label: "深呼吸走开", tag: "control", effects: { mood: 1, heat: -1 } },
      { id: "post_online", label: "发帖吐槽", tag: "content", effects: { mood: 1, heat: 2, reputation: -1 } },
    ],
  },
  {
    id: "medical_bill",
    title: "医疗账单",
    text: "体检报告出来了，医生建议追加检查。",
    options: [
      { id: "full_check", label: "立刻检查", tag: "rest", effects: { money: -3, energy: 1, mood: 1 } },
      { id: "delay_check", label: "下月再说", tag: "risk", effects: { money: 0, mood: -2, heat: 1 } },
      { id: "company_insurance", label: "走公司报销", tag: "work", effects: { money: -1, reputation: -1, energy: -1 } },
    ],
  },
  {
    id: "group_buy_fail",
    title: "拼团翻车",
    text: "你组织的团购崩单，群友开始追着问进度。",
    options: [
      { id: "refund_now", label: "自己先垫退款", tag: "money", effects: { money: -2, reputation: 2, mood: -1 } },
      { id: "vendor_pressure", label: "逼商家处理", tag: "control", effects: { reputation: 1, heat: 1 } },
      { id: "silent_wait", label: "先拖一天", tag: "risk", effects: { money: 0, reputation: -3, heat: 2 } },
    ],
  },
  {
    id: "interview_ghosted",
    title: "面试后失联",
    text: "你花了一周准备的岗位，面试后再无回复。",
    options: [
      { id: "send_followup", label: "继续跟进", tag: "work", effects: { energy: -1, reputation: 1, mood: -1 } },
      { id: "rest_reset", label: "休整一天", tag: "rest", effects: { energy: 2, mood: 2, money: -1 } },
      { id: "rant_post", label: "发帖开喷", tag: "content", effects: { mood: 1, heat: 2, reputation: -2 } },
    ],
  },
  {
    id: "festival_spend",
    title: "节日消费诱惑",
    text: "平台大促疯狂推券，你购物车开始失控。",
    options: [
      { id: "buy_needed", label: "只买刚需", tag: "control", effects: { money: -1, mood: 1 } },
      { id: "buy_emotion", label: "情绪消费", tag: "risk", effects: { money: -3, mood: 2, heat: 1 } },
      { id: "share_coupon", label: "转发拼券", tag: "network", effects: { money: 1, reputation: 1, heat: 1 } },
    ],
  },
  {
    id: "pet_emergency",
    title: "宠物突发情况",
    text: "宠物半夜不舒服，你得马上决定怎么处理。",
    options: [
      { id: "night_clinic", label: "立刻急诊", tag: "rest", effects: { money: -2, mood: 1, energy: -1 } },
      { id: "online_doctor", label: "先线上问诊", tag: "control", effects: { money: -1, mood: 0, heat: 0 } },
      { id: "wait_morning", label: "等天亮再看", tag: "risk", effects: { money: 0, mood: -2, reputation: -1 } },
    ],
  },
  {
    id: "roommate_conflict",
    title: "合租摩擦升级",
    text: "室友在公共区堆满快递，生活节奏严重冲突。",
    options: [
      { id: "set_rules", label: "立规矩", tag: "control", effects: { reputation: 1, mood: -1, heat: 1 } },
      { id: "ignore_once", label: "先忍一周", tag: "social", effects: { mood: -2, heat: -1 } },
      { id: "find_new_room", label: "准备搬走", tag: "money", effects: { money: -2, mood: 1, reputation: 0 } },
    ],
  },
  {
    id: "ai_replacement_panic",
    title: "AI 替代焦虑",
    text: "同事群都在转“XX岗位将被替代”，你的情绪被瞬间拉满。",
    options: [
      { id: "upskill_now", label: "立刻补课", tag: "work", effects: { money: -1, energy: -2, reputation: 2 } },
      { id: "wait_and_see", label: "先观望", tag: "control", effects: { mood: -1, energy: 1 } },
      { id: "mock_post", label: "发梗图自嘲", tag: "content", effects: { mood: 1, heat: 2, reputation: -1 } },
    ],
  },
  {
    id: "traffic_fine",
    title: "违停罚单",
    text: "你赶时间把车随手一停，回来发现窗上贴了罚单。",
    options: [
      { id: "pay_fine", label: "立即缴费", tag: "money", effects: { money: -2, mood: -1, heat: -1 } },
      { id: "appeal", label: "申诉一次", tag: "control", effects: { money: 1, energy: -1, mood: -1 } },
      { id: "rant_moment", label: "发朋友圈吐槽", tag: "content", effects: { mood: 1, heat: 1, reputation: -1 } },
    ],
  },
  {
    id: "coupon_pyramid",
    title: "拉人头返现局",
    text: "老同学拉你进“返现群”，玩法看起来越来越像套娃。",
    options: [
      { id: "invite_friends", label: "拉人冲返现", tag: "risk", effects: { money: 2, reputation: -2, heat: 1 } },
      { id: "quit_group", label: "立刻退群", tag: "control", effects: { reputation: 1, mood: 0 } },
      { id: "watch_memes", label: "围观吃瓜", tag: "social", effects: { mood: 1, heat: 1 } },
    ],
  },
  {
    id: "office_gossip",
    title: "办公室匿名帖",
    text: "午休时你被卷进匿名爆料帖，评论区全在影射你组。",
    options: [
      { id: "stay_silent", label: "先不回应", tag: "control", effects: { heat: -1, mood: -1 } },
      { id: "private_chat", label: "私聊关键人", tag: "network", effects: { reputation: 1, mood: -1, energy: -1 } },
      { id: "public_reply", label: "公开回应", tag: "social", effects: { reputation: -1, heat: 2, mood: 1 } },
    ],
  },
  {
    id: "delivery_overcharge",
    title: "外卖超额扣费",
    text: "平台突然多扣了一笔配送费，客服让你自行举证。",
    options: [
      { id: "file_complaint", label: "认真投诉", tag: "control", effects: { money: 1, energy: -1, mood: -1 } },
      { id: "let_it_go", label: "算了别折腾", tag: "rest", effects: { money: -1, mood: 1 } },
      { id: "public_expose", label: "公开挂平台", tag: "content", effects: { heat: 2, reputation: -1, mood: 1 } },
    ],
  },
  {
    id: "freelance_default",
    title: "外包尾款失联",
    text: "你辛苦做完的外包，对方开始已读不回。",
    options: [
      { id: "legal_notice", label: "发律师函模板", tag: "control", effects: { money: -1, reputation: 1, mood: -1 } },
      { id: "spam_remind", label: "持续催款", tag: "social", effects: { energy: -1, mood: -1, heat: 1 } },
      { id: "accept_loss", label: "认亏止损", tag: "rest", effects: { mood: -1, energy: 1 } },
    ],
  },
  {
    id: "city_blackout",
    title: "片区停电",
    text: "晚高峰突然停电，电梯和网络都瘫了，节奏瞬间被打断。",
    options: [
      { id: "offline_reset", label: "线下休整", tag: "rest", effects: { energy: 2, mood: 1, money: -1 } },
      { id: "mobile_office", label: "手机热点顶上", tag: "work", effects: { energy: -2, money: 1, reputation: 1 } },
      { id: "chaos_post", label: "记录城市混乱", tag: "content", effects: { mood: 1, heat: 2 } },
    ],
  },
  {
    id: "fan_group_drama",
    title: "饭圈互撕波及",
    text: "你只是转了个梗图，却被两边粉丝都追着问立场。",
    options: [
      { id: "clear_stance", label: "明确立场", tag: "social", effects: { heat: 2, reputation: -1, mood: 1 } },
      { id: "neutral_mode", label: "保持中立", tag: "control", effects: { heat: -1, mood: -1, reputation: 1 } },
      { id: "mute_all", label: "全员静音", tag: "rest", effects: { mood: 1, heat: -2 } },
    ],
  },
];

const FOLLOWUP_EVENT_POOL = {
  risk: {
    id: "risk_aftershock",
    title: "风险反噬",
    text: "你前一天的激进选择开始反噬，追责和额外成本一起到来。",
    options: [
      { id: "take_loss", label: "认亏止损", tag: "control", effects: { money: -2, heat: -1, reputation: 1 } },
      { id: "double_down", label: "继续加码", tag: "risk", effects: { money: 2, mood: -2, reputation: -2, heat: 2 } },
      { id: "ask_team_help", label: "找人一起扛", tag: "network", effects: { money: -1, mood: 1, reputation: 1 } },
    ],
  },
  content: {
    id: "content_backlash",
    title: "评论区失控",
    text: "你之前的内容被截了片段，评论区风向开始失控。",
    options: [
      { id: "clarify", label: "发布澄清", tag: "social", effects: { reputation: 1, heat: -1, mood: -1 } },
      { id: "hide", label: "删帖避战", tag: "control", effects: { heat: -2, reputation: -1 } },
      { id: "stream", label: "开直播解释", tag: "content", effects: { heat: 2, reputation: 1, energy: -1 } },
    ],
  },
  network: {
    id: "network_return",
    title: "人情回流",
    text: "你之前维系的人情关系开始回流，机会和麻烦同时出现。",
    options: [
      { id: "accept_help", label: "接住资源", tag: "work", effects: { money: 2, reputation: 1, energy: -1 } },
      { id: "keep_distance", label: "保持边界", tag: "control", effects: { mood: 1, reputation: -1 } },
      { id: "trade_favor", label: "交换人情", tag: "network", effects: { money: 1, reputation: 1, heat: 1 } },
    ],
  },
  rest: {
    id: "rest_comeback",
    title: "状态回升",
    text: "休整后你状态明显回升，但任务也堆在眼前。",
    options: [
      { id: "slow_ramp", label: "慢慢提速", tag: "control", effects: { energy: 1, mood: 1, money: 0 } },
      { id: "full_charge", label: "直接冲刺", tag: "work", effects: { money: 2, energy: -2, reputation: 1 } },
      { id: "keep_rest", label: "继续保守", tag: "rest", effects: { energy: 2, money: -1 } },
    ],
  },
};

const CONTEXT_EVENT_POOL = {
  low_money: {
    id: "credit_bill_shock",
    title: "信用卡账单预警",
    text: "账单日提前提醒你：本月最低还款也很吃力。",
    options: [
      { id: "cut_spending", label: "立刻断舍离", tag: "control", effects: { money: 1, mood: -1 } },
      { id: "borrow_again", label: "再借一轮", tag: "risk", effects: { money: 2, reputation: -2, heat: 1 } },
      { id: "extra_shift", label: "加班补坑", tag: "work", effects: { money: 2, energy: -2 } },
    ],
  },
  low_energy: {
    id: "burnout_flash",
    title: "疲劳崩盘边缘",
    text: "你明显反应变慢，连开会都开始走神。",
    options: [
      { id: "take_leave", label: "请半天假", tag: "rest", effects: { energy: 3, money: -1 } },
      { id: "energy_drink", label: "靠功能饮料顶", tag: "risk", effects: { energy: 1, mood: -2, heat: 1 } },
      { id: "delegate", label: "把活拆出去", tag: "network", effects: { energy: 1, reputation: -1 } },
    ],
  },
  high_heat: {
    id: "public_opinion_reverse",
    title: "舆论反噬",
    text: "你最近热度太高，误解和断章开始成倍出现。",
    options: [
      { id: "issue_statement", label: "发布说明", tag: "control", effects: { heat: -2, reputation: 1, mood: -1 } },
      { id: "keep_farming", label: "继续冲热度", tag: "content", effects: { heat: 2, money: 1, reputation: -2 } },
      { id: "offline_break", label: "离线一天", tag: "rest", effects: { heat: -1, mood: 2 } },
    ],
  },
};

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
    random: seededRandom(seed),
    mode: "intro",
    dayIndex: 0,
    days: pickDailyEvents(seed),
    usedEventIds: new Set(),
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

    const impactScore = (Math.min(0, delta.money || 0) + Math.min(0, delta.energy || 0) + Math.min(0, delta.mood || 0) + Math.min(0, delta.reputation || 0));
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
    bullets.push(`最终短板：${weakName}仅 ${weakValue}，是最危险属性。`);
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

  if (riskChoices >= 2) {
    bullets.push(`你本局做了 ${riskChoices} 次高风险选择，波动明显变大。`);
  }

  if (worstDay) {
    bullets.push(`关键转折：Day ${worstDay.day}「${worstDay.eventTitle}」选择「${worstDay.optionLabel}」。`);
  }

  if (session.sameTagCount >= 3) {
    bullets.push("连续同风格决策触发了疲劳惩罚（心态/人设下降）。");
  }

  return {
    weakest: { name: weakName, value: weakValue },
    keyDay: worstDay ? worstDay.day : null,
    bullets,
  };
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

function maybeInjectFollowup(session, optionTag) {
  const nextIndex = session.dayIndex + 1;
  if (nextIndex >= DAY_TOTAL) return;
  const followup = FOLLOWUP_EVENT_POOL[optionTag];
  if (!followup) return;
  if (session.usedEventIds.has(followup.id)) return;
  const roll = session.random();
  if (roll > 0.58) return;
  session.days[nextIndex] = followup;
}

function maybeInjectContext(session) {
  const nextIndex = session.dayIndex + 1;
  if (nextIndex >= DAY_TOTAL) return;
  if (session.usedEventIds.has(session.days[nextIndex]?.id)) return;

  let event = null;
  if (session.stats.money <= 2 && !session.usedEventIds.has(CONTEXT_EVENT_POOL.low_money.id)) {
    event = CONTEXT_EVENT_POOL.low_money;
  } else if (session.stats.energy <= 2 && !session.usedEventIds.has(CONTEXT_EVENT_POOL.low_energy.id)) {
    event = CONTEXT_EVENT_POOL.low_energy;
  } else if (session.stats.heat >= 8 && !session.usedEventIds.has(CONTEXT_EVENT_POOL.high_heat.id)) {
    event = CONTEXT_EVENT_POOL.high_heat;
  }
  if (event) {
    session.days[nextIndex] = event;
  }
}

function applyChoice(option) {
  const session = state.session;
  if (session.mode !== "playing") return;

  const currentEvent = session.days[session.dayIndex];
  const before = cloneStats(session.stats);

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

  maybeInjectFollowup(session, option.tag);
  maybeInjectContext(session);
  const after = cloneStats(session.stats);

  session.history.push({
    day: session.dayIndex + 1,
    eventId: currentEvent.id,
    eventTitle: currentEvent.title,
    optionId: option.id,
    optionLabel: option.label,
    tag: option.tag,
    impactText: effectToText(option.effects),
    delta: statsDelta(before, after),
  });
  session.usedEventIds.add(currentEvent.id);

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

function currentEvent(session) {
  return session.days[session.dayIndex] || null;
}

function shareText() {
  const result = state.session.result;
  if (!result) return "";
  const lines = [
    `我在《城市生存7天》打出 ${result.score} 分，结局：${result.ending.title}`,
    `结局成因：${result.reason?.bullets?.[0] || "稳住了主要属性"}`,
    `挑战码：${result.challengeCode}`,
    `打开同链接输入挑战码就能复刻我的局。`,
  ];
  return lines.join("\n");
}

async function generateStoryNarrative() {
  const result = state.session.result;
  if (!result) return;
  const payload = {
    history: state.session.history.filter((item) => item.eventId !== "skill_use"),
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
    history: session.history.filter((item) => item.eventId !== "skill_use").slice(-4),
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
          title: v.event.title,
          options: v.event.options.map((item) => ({ id: item.id, label: item.label, impactText: item.impactText })),
        }
      : null,
    history: v.history,
    result: v.result,
  });
};

window.advanceTime = () => refresh();

refresh();
