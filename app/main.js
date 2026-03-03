import { createGameUI } from "../ui/game-ui.js?v=20260303_45";

const STORAGE_KEY = "wechat-survival-best";
const TARGET_DAY = 100;

function clamp(value, min = 0, max = 12) {
  return Math.max(min, Math.min(max, value));
}

function effectToText(effects = {}) {
  const labels = [];
  if (effects.money) labels.push(`现金${effects.money > 0 ? "+" : ""}${effects.money}`);
  if (effects.energy) labels.push(`体力${effects.energy > 0 ? "+" : ""}${effects.energy}`);
  if (effects.mood) labels.push(`心态${effects.mood > 0 ? "+" : ""}${effects.mood}`);
  if (effects.reputation) labels.push(`人设${effects.reputation > 0 ? "+" : ""}${effects.reputation}`);
  if (effects.heat) labels.push(`热度${effects.heat > 0 ? "+" : ""}${effects.heat}`);
  return labels.join(" · ");
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

function applyEffects(target, effects = {}) {
  target.money = clamp(target.money + (effects.money || 0));
  target.energy = clamp(target.energy + (effects.energy || 0));
  target.mood = clamp(target.mood + (effects.mood || 0));
  target.reputation = clamp(target.reputation + (effects.reputation || 0));
  target.heat = clamp(target.heat + (effects.heat || 0), 0, 10);
}

const STARTER_ARCHETYPES = [
  {
    id: "office_worker",
    name: "工位打工人",
    baseStats: { money: 6, energy: 5, mood: 6, reputation: 6, heat: 2 },
    openingIds: ["opening_rent_kpi", "opening_midnight_msg"],
  },
  {
    id: "content_hustler",
    name: "内容副业人",
    baseStats: { money: 5, energy: 6, mood: 5, reputation: 5, heat: 4 },
    openingIds: ["opening_viral_conflict", "opening_ad_offer"],
  },
  {
    id: "debt_runner",
    name: "现金流求生者",
    baseStats: { money: 4, energy: 6, mood: 6, reputation: 5, heat: 2 },
    openingIds: ["opening_rent_kpi", "opening_bill_alarm"],
  },
  {
    id: "network_player",
    name: "关系局操盘手",
    baseStats: { money: 6, energy: 6, mood: 5, reputation: 7, heat: 3 },
    openingIds: ["opening_friend_request", "opening_group_invite"],
  },
  {
    id: "wang_saozhu",
    name: "王骚猪",
    baseStats: { money: 6, energy: 5, mood: 4, reputation: 7, heat: 2 },
    openingIds: ["opening_wang_midlife_alarm"],
  },
];

const TEMP_SKILL_POOL = [
  {
    id: "sprint_transfer",
    name: "地铁冲刺换乘",
    text: "多跑两站省钱省时间，但体力和心态会被挤压。",
    effects: { money: 1, heat: 1, energy: -1, mood: -1 },
  },
  {
    id: "late_night_gig",
    name: "深夜接急单",
    text: "现金立刻回血，但睡眠被硬切掉一块。",
    effects: { money: 2, reputation: 1, energy: -2, mood: -1 },
  },
  {
    id: "borrow_face",
    name: "借面子走关系",
    text: "办事效率提升，但要付出人设和热度代价。",
    effects: { reputation: 2, money: 1, heat: 1, mood: -1 },
  },
  {
    id: "silent_mode",
    name: "全平台静音",
    text: "心态稳住了，但热度和关系会掉一截。",
    effects: { mood: 2, heat: -2, reputation: -1, money: -1 },
  },
  {
    id: "coupon_hunt",
    name: "全网薅券",
    text: "现金省下来，但精力被琐碎事务消耗。",
    effects: { money: 2, mood: 1, energy: -2, reputation: -1 },
  },
  {
    id: "hot_take_post",
    name: "发条狠活热评",
    text: "热度和现金有机会起飞，但人设可能掉。",
    effects: { heat: 2, money: 1, reputation: -2, mood: -1 },
  },
  {
    id: "group_cleanup",
    name: "群聊断舍离",
    text: "心态和体力恢复，但部分关系会受损。",
    effects: { mood: 2, energy: 1, reputation: -2, heat: -1 },
  },
  {
    id: "credit_roll",
    name: "信用卡缓冲",
    text: "先拿到现金缓冲，但后续压力更高。",
    effects: { money: 3, heat: 1, reputation: -2, mood: -1 },
  },
  {
    id: "wb_hot_search",
    name: "蹭热搜发癫",
    text: "一波流量直接拉满，但评论区也会反噬。",
    effects: { heat: 3, money: 1, reputation: -2, mood: -1 },
  },
  {
    id: "group_mute_99",
    name: "99+群聊静音",
    text: "耳根清净一整天，但错过了几个人情节点。",
    effects: { mood: 2, energy: 1, reputation: -1, heat: -1 },
  },
  {
    id: "friends_circle_flex",
    name: "朋友圈硬装体面",
    text: "人设暂时稳住，但钱包会先受伤。",
    effects: { reputation: 2, heat: 1, money: -2, mood: -1 },
  },
  {
    id: "ai_side_hustle",
    name: "AI副业冲KPI",
    text: "接单效率提升，但你会更像流水线机器。",
    effects: { money: 2, reputation: 1, energy: -2, mood: -1 },
  },
  {
    id: "late_night_emo_post",
    name: "凌晨emo长文",
    text: "宣泄后心态回一点，但容易引战。",
    effects: { mood: 2, heat: 2, reputation: -1, energy: -1 },
  },
  {
    id: "bargain_king",
    name: "砍价圣体附体",
    text: "薅到实惠但社交体面会掉一点。",
    effects: { money: 2, energy: -1, reputation: -1, mood: 1 },
  },
  {
    id: "bullet_commentary",
    name: "弹幕嘴替模式",
    text: "发言更犀利，热度上来但争议也会增加。",
    effects: { heat: 2, mood: 1, reputation: -1, energy: -1 },
  },
  {
    id: "subway_powernap",
    name: "地铁补觉术",
    text: "路上补眠，精力回一点但容易误事。",
    effects: { energy: 2, mood: 1, reputation: -1, heat: -1 },
  },
  {
    id: "rush_delivery",
    name: "下班跑腿接单",
    text: "现金回血更快，但体力消耗明显。",
    effects: { money: 2, energy: -2, mood: -1, heat: 1 },
  },
  {
    id: "quiet_exit",
    name: "安静退群保命",
    text: "减少噪音保护心态，但社交势能会掉。",
    effects: { mood: 2, heat: -1, reputation: -1, money: -1 },
  },
];

const WANG_SAOZHU_SKILL_POOL = [
  {
    id: "wang_ex_buffer",
    name: "消息已读缓冲术",
    text: "先把节奏摁住再回消息，心态回血但面子和热度会波动。",
    effects: { mood: 2, heat: -1, reputation: -1, money: -1 },
  },
  {
    id: "wang_resume_polish",
    name: "简历抛光冲刺",
    text: "把近三年成果重写一遍，口碑能涨但精力会被榨干。",
    effects: { reputation: 2, money: 1, energy: -2, mood: -1 },
  },
  {
    id: "wang_firefight",
    name: "老本行救火",
    text: "临危接锅能保住收入，但体力和情绪都要掉。",
    effects: { money: 2, reputation: 1, energy: -2, mood: -1 },
  },
  {
    id: "wang_night_walk",
    name: "深夜散步断网",
    text: "绕河走一圈，脑雾少了但你会错过一些关系节点。",
    effects: { mood: 2, energy: 1, reputation: -1, heat: -1 },
  },
  {
    id: "wang_apartment_downgrade",
    name: "合租降本重排",
    text: "马上省下一笔，但体面和舒适度会降级。",
    effects: { money: 2, mood: -1, reputation: -1, heat: 1 },
  },
  {
    id: "wang_rebound_post",
    name: "朋友圈体面更新",
    text: "看起来你还很稳，实际是拿现金和心态去换面子。",
    effects: { reputation: 2, heat: 1, money: -2, mood: -1 },
  },
];

const PIXEL_AVATAR_STAGE_POOLS = {
  office_worker: {
    early: ["./assets/pixel/avatars/jojo/office-early.png"],
    mid: ["./assets/pixel/avatars/jojo/office-mid.png"],
    late: ["./assets/pixel/avatars/jojo/office-late.png"],
    crisis: ["./assets/pixel/avatars/jojo/office-crisis.png"],
  },
  content_hustler: {
    early: ["./assets/pixel/avatars/jojo/content-early.png"],
    mid: ["./assets/pixel/avatars/jojo/content-mid.png"],
    late: ["./assets/pixel/avatars/jojo/content-late.png"],
    crisis: ["./assets/pixel/avatars/jojo/content-crisis.png"],
  },
  debt_runner: {
    early: ["./assets/pixel/avatars/jojo/debt-early.png"],
    mid: ["./assets/pixel/avatars/jojo/debt-mid.png"],
    late: ["./assets/pixel/avatars/jojo/debt-late.png"],
    crisis: ["./assets/pixel/avatars/jojo/debt-crisis.png"],
  },
  network_player: {
    early: ["./assets/pixel/avatars/jojo/network-early.png"],
    mid: ["./assets/pixel/avatars/jojo/network-mid.png"],
    late: ["./assets/pixel/avatars/jojo/network-late.png"],
    crisis: ["./assets/pixel/avatars/jojo/network-crisis.png"],
  },
  wang_saozhu: {
    early: ["./assets/pixel/avatars/jojo/wang-early.png"],
    mid: ["./assets/pixel/avatars/jojo/wang-mid.png"],
    late: ["./assets/pixel/avatars/jojo/wang-late.png"],
    crisis: ["./assets/pixel/avatars/jojo/wang-crisis.png"],
  },
};

const PIXEL_AVATAR_RISK_POOLS = {
  cash_crunch: ["./assets/pixel/avatars/risk/risk-cash-crunch.png"],
  energy_burnout: ["./assets/pixel/avatars/risk/risk-energy-burnout.png"],
  mood_crash: ["./assets/pixel/avatars/risk/risk-mood-crash.png"],
  reputation_fall: ["./assets/pixel/avatars/risk/risk-reputation-fall.png"],
  heat_overload: ["./assets/pixel/avatars/risk/risk-heat-overload.png"],
};

const FOOD_ICON_VARIANTS = {
  food_bun: [
    "./assets/pixel/items/food-bun.png",
    "./assets/pixel/items/food-bun-2.png",
    "./assets/pixel/items/food-bun-3.png",
  ],
  food_bento: [
    "./assets/pixel/items/food-bento.png",
    "./assets/pixel/items/food-bento-2.png",
    "./assets/pixel/items/food-bento-3.png",
  ],
  food_hotpot: [
    "./assets/pixel/items/food-hotpot.png",
    "./assets/pixel/items/food-hotpot-2.png",
    "./assets/pixel/items/food-hotpot-3.png",
  ],
  food_noodle: ["./assets/pixel/items/food-hotpot-2.png", "./assets/pixel/items/food-hotpot-3.png"],
  food_tea_egg: ["./assets/pixel/items/food-bun.png", "./assets/pixel/items/food-default.png"],
  food_fruit_pack: ["./assets/pixel/items/food-bento-2.png", "./assets/pixel/items/food-default-2.png"],
  food_bbq: ["./assets/pixel/items/food-hotpot.png", "./assets/pixel/items/food-hotpot-2.png"],
  default: ["./assets/pixel/items/food-default.png", "./assets/pixel/items/food-default-2.png"],
};

const SKILL_ICON_VARIANTS = {
  sprint_transfer: ["./assets/pixel/skills/skill-sprint.png", "./assets/pixel/skills/skill-sprint-2.png"],
  late_night_gig: ["./assets/pixel/skills/skill-gig.png", "./assets/pixel/skills/skill-gig-2.png"],
  borrow_face: ["./assets/pixel/skills/skill-network.png", "./assets/pixel/skills/skill-network-2.png"],
  silent_mode: ["./assets/pixel/skills/skill-calm.png", "./assets/pixel/skills/skill-calm-2.png"],
  coupon_hunt: ["./assets/pixel/skills/skill-coupon.png", "./assets/pixel/skills/skill-coupon-2.png"],
  hot_take_post: ["./assets/pixel/skills/skill-hot.png", "./assets/pixel/skills/skill-hot-2.png"],
  group_cleanup: ["./assets/pixel/skills/skill-calm.png", "./assets/pixel/skills/skill-calm-2.png"],
  credit_roll: ["./assets/pixel/skills/skill-credit.png", "./assets/pixel/skills/skill-credit-2.png"],
  wb_hot_search: ["./assets/pixel/skills/skill-hot.png", "./assets/pixel/skills/skill-hot-2.png"],
  group_mute_99: ["./assets/pixel/skills/skill-calm.png", "./assets/pixel/skills/skill-calm-2.png"],
  friends_circle_flex: ["./assets/pixel/skills/skill-flex.png", "./assets/pixel/skills/skill-flex-2.png"],
  ai_side_hustle: ["./assets/pixel/skills/skill-ai.png", "./assets/pixel/skills/skill-ai-2.png"],
  late_night_emo_post: ["./assets/pixel/skills/skill-emo.png", "./assets/pixel/skills/skill-emo-2.png"],
  bargain_king: ["./assets/pixel/skills/skill-coupon.png", "./assets/pixel/skills/skill-coupon-2.png"],
  bullet_commentary: ["./assets/pixel/skills/skill-hot.png", "./assets/pixel/skills/skill-hot-2.png"],
  subway_powernap: ["./assets/pixel/skills/skill-calm.png", "./assets/pixel/skills/skill-calm-2.png"],
  rush_delivery: ["./assets/pixel/skills/skill-gig.png", "./assets/pixel/skills/skill-gig-2.png"],
  quiet_exit: ["./assets/pixel/skills/skill-calm.png", "./assets/pixel/skills/skill-calm-2.png"],
  wang_ex_buffer: ["./assets/pixel/skills/wang-saozhu/wang-skill-ex-buffer.png"],
  wang_resume_polish: ["./assets/pixel/skills/wang-saozhu/wang-skill-resume.png"],
  wang_firefight: ["./assets/pixel/skills/wang-saozhu/wang-skill-firefight.png"],
  wang_night_walk: ["./assets/pixel/skills/wang-saozhu/wang-skill-nightwalk.png"],
  wang_apartment_downgrade: ["./assets/pixel/skills/wang-saozhu/wang-skill-resume.png"],
  wang_rebound_post: ["./assets/pixel/skills/wang-saozhu/wang-skill-ex-buffer.png"],
  default: ["./assets/pixel/skills/skill-default.png", "./assets/pixel/skills/skill-default-2.png"],
};

const FOOD_OPTIONS = [
  {
    id: "food_bun",
    name: "馒头配榨菜",
    text: "先把肚子垫住，开销最小。",
    effects: { money: -1, energy: 1, mood: -1 },
  },
  {
    id: "food_bento",
    name: "便利店便当",
    text: "花销中等，恢复更稳。",
    effects: { money: -2, energy: 2, mood: 1 },
  },
  {
    id: "food_hotpot",
    name: "深夜小火锅",
    text: "回血明显，但钱包会痛。",
    effects: { money: -3, energy: 3, mood: 1, heat: 1 },
  },
  {
    id: "food_noodle",
    name: "深夜牛肉面",
    text: "开销中高，情绪和体力都能回一点。",
    effects: { money: -2, energy: 2, mood: 2 },
  },
  {
    id: "food_tea_egg",
    name: "茶叶蛋顶一顶",
    text: "最便宜的应急补给，主打先活着。",
    effects: { money: -1, energy: 1, mood: 0 },
  },
  {
    id: "food_fruit_pack",
    name: "水果酸奶杯",
    text: "轻补给，心情回得更快。",
    effects: { money: -2, energy: 1, mood: 2 },
  },
  {
    id: "food_bbq",
    name: "路边烧烤局",
    text: "当下最爽，但会带来额外围观热度。",
    effects: { money: -3, energy: 2, mood: 2, heat: 1 },
  },
];

const FORCED_EVENTS = {
  forced_sick_mild: {
    id: "forced_sick_mild",
    chapter: "强制事件：身体报警",
    title: "低电量直接宕机",
    text: "你今天起床就头重脚轻，常规安排基本干不动。",
    causeText: "由低体力触发，今天必须先处理身体问题。",
    options: [
      { id: "sick_hospital", label: "去医院挂号", tag: "rest", effects: { money: -2, energy: 3, mood: -1, reputation: -1 } },
      { id: "sick_clinic", label: "社区门诊先顶住", tag: "control", effects: { money: -1, energy: 2, mood: 0 } },
      { id: "sick_ask_help", label: "发圈求助众筹药费", tag: "social", effects: { money: 1, energy: 1, reputation: -1, heat: 1, mood: -1 } },
    ],
  },
  forced_sick_heavy: {
    id: "forced_sick_heavy",
    chapter: "强制事件：重度透支",
    title: "你被现实按进病床",
    text: "体力连续见底后，今天只能先处理病情，日常事件暂停。",
    causeText: "由长期低体力触发的强制剧情。",
    options: [
      { id: "heavy_hospital", label: "急诊处理", tag: "rest", effects: { money: -3, energy: 4, mood: -1, reputation: -1 } },
      { id: "heavy_short_stay", label: "开药回家躺平", tag: "control", effects: { money: -2, energy: 3, mood: 1, heat: -1 } },
      { id: "heavy_social_help", label: "向朋友借钱看病", tag: "network", effects: { money: 2, energy: 2, reputation: -2, mood: -1 } },
    ],
  },
  forced_cash_crunch: {
    id: "forced_cash_crunch",
    chapter: "强制事件：断粮预警",
    title: "兜里见底只能街头求生",
    text: "现金快归零，你今天先得解决吃饭和交通，不然连日常都开不了。",
    causeText: "由低现金触发，今日行动受限。",
    options: [
      { id: "cash_busk", label: "地铁口才艺讨赏", tag: "content", effects: { money: 1, heat: 1, reputation: -1, energy: -1 } },
      { id: "cash_borrow", label: "找熟人先借100", tag: "network", effects: { money: 2, reputation: -1, mood: -1 } },
      { id: "cash_skip_meal", label: "饿一顿硬撑", tag: "risk", effects: { money: 1, energy: -2, mood: -1 } },
    ],
  },
};

const OPENING_EVENTS = {
  opening_rent_kpi: {
    id: "opening_rent_kpi",
    chapter: "第一章：开局压力",
    title: "房租+绩效双重预警",
    text: "房东催租和绩效考核同天砸来，你必须先选一条生存策略。",
    causeText: "由开局角色和初始现金触发。",
    options: [
      { id: "pay_rent_first", label: "先交房租保底", tag: "money", effects: { money: -3, mood: -1, reputation: 1 }, setFlags: ["rent_secured"] },
      { id: "ask_friend_buffer", label: "找朋友垫一周", tag: "network", effects: { money: 2, reputation: -1, heat: 1 }, setFlags: ["debt_line"] },
      { id: "overtime_cash", label: "接夜班换现金", tag: "work", effects: { money: 2, energy: -2, mood: -1 }, setFlags: ["overwork_line"] },
    ],
  },
  opening_midnight_msg: {
    id: "opening_midnight_msg",
    chapter: "第一章：开局压力",
    title: "23:47 紧急消息",
    text: "老板突然让你明早交新方案，你刚准备睡下。",
    causeText: "由开局角色偏职场线触发。",
    options: [
      { id: "rush_submit", label: "立刻改到天亮", tag: "work", effects: { energy: -3, reputation: 1, money: 1 }, setFlags: ["overwork_line"] },
      { id: "negotiate_deadline", label: "争取延期", tag: "control", effects: { energy: 1, mood: 1, reputation: -1 }, setFlags: ["scope_control"] },
      { id: "template_patch", label: "模板应付", tag: "risk", effects: { money: 1, reputation: -2, heat: 1 }, setFlags: ["quality_risk"] },
    ],
  },
  opening_viral_conflict: {
    id: "opening_viral_conflict",
    chapter: "第一章：开局压力",
    title: "帖子意外爆火",
    text: "你随手发的吐槽冲上同城榜，评论区突然开战。",
    causeText: "由开局角色偏内容线触发。",
    options: [
      { id: "ride_traffic", label: "继续追热点", tag: "content", effects: { heat: 2, money: 1, reputation: -1 }, setFlags: ["content_line"] },
      { id: "cool_down", label: "降温处理", tag: "control", effects: { heat: -1, mood: 1, reputation: 1 }, setFlags: ["silent_line"] },
      { id: "public_battle", label: "公开对线", tag: "social", effects: { heat: 2, mood: 1, reputation: -2 }, setFlags: ["public_fight"] },
    ],
  },
  opening_ad_offer: {
    id: "opening_ad_offer",
    chapter: "第一章：开局压力",
    title: "离谱商务合作",
    text: "一个“日入四位数”的合作私信你，条款却写得云里雾里。",
    causeText: "由开局角色偏内容线触发。",
    options: [
      { id: "take_offer", label: "先接一单", tag: "risk", effects: { money: 2, reputation: -1, heat: 1 }, setFlags: ["quality_risk"] },
      { id: "verify_first", label: "先做背调", tag: "control", effects: { money: 0, reputation: 1, mood: 1 }, setFlags: ["scope_control"] },
      { id: "ignore_offer", label: "直接拒绝", tag: "work", effects: { money: 1, mood: -1, reputation: 1 }, setFlags: ["work_focus"] },
    ],
  },
  opening_bill_alarm: {
    id: "opening_bill_alarm",
    chapter: "第一章：开局压力",
    title: "账单提前预警",
    text: "系统提示本月支出已超预算，你的卡里余额只剩下三位数。",
    causeText: "由开局角色偏现金流线触发。",
    options: [
      { id: "cut_now", label: "立刻降消费", tag: "control", effects: { money: 1, mood: -1 }, setFlags: ["budget_mode"] },
      { id: "borrow_rotate", label: "借新还旧", tag: "risk", effects: { money: 2, reputation: -2, heat: 1 }, setFlags: ["debt_line"] },
      { id: "extra_shift", label: "接夜班单", tag: "work", effects: { money: 2, energy: -2, mood: -1 }, setFlags: ["overwork_line"] },
    ],
  },
  opening_friend_request: {
    id: "opening_friend_request",
    chapter: "第一章：开局压力",
    title: "人情求助同天涌来",
    text: "三个熟人同时来找你帮忙，你也正缺资源。",
    causeText: "由开局角色偏关系线触发。",
    options: [
      { id: "help_all", label: "尽量都帮", tag: "social", effects: { reputation: 2, energy: -2, mood: -1 }, setFlags: ["overcommit"] },
      { id: "set_boundary", label: "明确边界", tag: "control", effects: { mood: 1, heat: -1, reputation: -1 }, setFlags: ["boundary_mode"] },
      { id: "resource_swap", label: "资源互换", tag: "network", effects: { money: 1, reputation: 1, heat: 1 }, setFlags: ["resource_swap"] },
    ],
  },
  opening_group_invite: {
    id: "opening_group_invite",
    chapter: "第一章：开局压力",
    title: "社群邀约风口",
    text: "你被拉进一个“互助致富群”，消息速度快到看不懂。",
    causeText: "由开局角色偏关系线触发。",
    options: [
      { id: "observe_group", label: "先潜水观察", tag: "control", effects: { mood: 1, money: 0 }, setFlags: ["scope_control"] },
      { id: "active_group", label: "主动发言混脸熟", tag: "network", effects: { reputation: 2, heat: 1 }, setFlags: ["network_mode"] },
      { id: "join_invest", label: "直接跟投", tag: "risk", effects: { money: 2, reputation: -2, heat: 2 }, setFlags: ["debt_line"] },
    ],
  },
  opening_wang_midlife_alarm: {
    id: "opening_wang_midlife_alarm",
    chapter: "第一章：开局压力",
    title: "王骚猪的周一暴击",
    text: "周一早高峰刚到工位，王骚猪就收到项目压缩通知，合租续租和搬家开销也同时弹窗。",
    causeText: "由开局角色压力线触发。",
    options: [
      { id: "wang_hold_job", label: "先稳住主业节奏", tag: "work", effects: { reputation: 1, mood: -1, energy: -1 }, setFlags: ["wang_line", "work_focus"] },
      { id: "wang_find_side", label: "晚上开副业补现金", tag: "money", effects: { money: 1, energy: -2, mood: -1 }, setFlags: ["wang_line", "grind_path"] },
      { id: "wang_call_old_friend", label: "找老同事探机会", tag: "network", effects: { reputation: 1, money: 1, mood: -1 }, setFlags: ["wang_line", "network_mode"] },
    ],
  },
};

const STATE_INCIDENT_POOLS = {
  moneyLow: [
    {
      id: "incident_money_street_show",
      chapter: "临时插曲：现金告急",
      title: "地铁口开麦讨赏",
      text: "你卡里只剩两位数，路过地铁口时突然想靠才艺顶一晚饭钱。",
      causeText: "由低现金状态触发的临时事件。",
      options: [
        { id: "show_safe", label: "老实唱两首", tag: "work", effects: { money: 1, mood: 1, reputation: -1 } },
        { id: "show_hype", label: "整活博眼球", tag: "content", effects: { money: 2, heat: 2, reputation: -2, mood: -1 }, setFlags: ["public_fight"] },
        { id: "show_abort", label: "算了先回去", tag: "control", effects: { mood: -1, energy: 1 }, setFlags: ["budget_mode"] },
      ],
    },
    {
      id: "incident_money_night_shift",
      chapter: "临时插曲：现金告急",
      title: "夜班零工弹窗",
      text: "一个“现结零工”群拉你进来，今晚去就能拿钱。",
      causeText: "由低现金和债务压力触发。",
      options: [
        { id: "gig_accept", label: "咬牙接了", tag: "work", effects: { money: 2, energy: -2, mood: -1 }, setFlags: ["overwork_line"] },
        { id: "gig_bargain", label: "先谈价再去", tag: "network", effects: { money: 1, reputation: 1, mood: -1 } },
        { id: "gig_skip", label: "先保状态", tag: "rest", effects: { money: -1, energy: 1, mood: 1 }, setFlags: ["survival_route"] },
      ],
    },
  ],
  moodLow: [
    {
      id: "incident_mood_drink",
      chapter: "临时插曲：心态下坠",
      title: "夜宵摊买醉",
      text: "你心态快见底，朋友发来定位说‘来两杯先别想了’。",
      causeText: "由低心态触发的情绪事件。",
      options: [
        { id: "drink_release", label: "喝两杯散散压", tag: "rest", effects: { mood: 2, money: -1, energy: -1 } },
        { id: "drink_livestream", label: "边喝边开播", tag: "content", effects: { mood: 1, heat: 2, reputation: -1, money: 1 } },
        { id: "drink_refuse", label: "拒绝，去散步", tag: "control", effects: { mood: 1, energy: 1, heat: -1 } },
      ],
    },
    {
      id: "incident_mood_river_walk",
      chapter: "临时插曲：心态下坠",
      title: "河堤夜风局",
      text: "你想清空脑子，一个人去河堤吹风，手机里消息还在炸。",
      causeText: "由低心态与舆论压力触发。",
      options: [
        { id: "river_offline", label: "彻底断网1小时", tag: "control", effects: { mood: 2, heat: -1, reputation: -1 } },
        { id: "river_call_friend", label: "打给老友吐槽", tag: "network", effects: { mood: 1, reputation: 1, money: -1 } },
        { id: "river_post", label: "发条深夜长文", tag: "content", effects: { mood: 1, heat: 2, reputation: -2 }, setFlags: ["content_line"] },
      ],
    },
  ],
  energyLow: [
    {
      id: "incident_energy_powernap",
      chapter: "临时插曲：体力见底",
      title: "工位十分钟断片",
      text: "你眼睛一闭就开始点头，会议纪要还没写完。",
      causeText: "由低体力与过劳线触发。",
      options: [
        { id: "nap_short", label: "抢十分钟补眠", tag: "rest", effects: { energy: 2, reputation: -1, mood: 1 } },
        { id: "nap_coffee", label: "咖啡硬顶", tag: "work", effects: { energy: 1, money: -1, mood: -1 } },
        { id: "nap_delegate", label: "找同事帮顶一下", tag: "network", effects: { energy: 1, reputation: 1, money: -1 } },
      ],
    },
    {
      id: "incident_energy_missed_stop",
      chapter: "临时插曲：体力见底",
      title: "地铁坐过站",
      text: "你在地铁上直接睡过去，醒来已经多坐了好几站。",
      causeText: "由低体力状态触发。",
      options: [
        { id: "stop_take_ride", label: "打车补救", tag: "money", effects: { money: -2, energy: 1, reputation: 1 } },
        { id: "stop_run_back", label: "跑回去赶上", tag: "work", effects: { energy: -1, mood: -1, reputation: 1 } },
        { id: "stop_accept_delay", label: "认栽慢一点", tag: "control", effects: { mood: 1, reputation: -1, energy: 1 } },
      ],
    },
  ],
  reputationLow: [
    {
      id: "incident_reputation_comment_overturn",
      chapter: "临时插曲：口碑走低",
      title: "评论区风向翻车",
      text: "你最近几次处理都被吐槽“只会甩锅”，评论区开始追旧账。",
      causeText: "由低口碑面子状态触发。",
      options: [
        { id: "rep_open_apology", label: "公开认错并补方案", tag: "control", effects: { reputation: 2, mood: -1, heat: -1 }, setFlags: ["scope_control"] },
        { id: "rep_find_mediator", label: "找熟人中间调停", tag: "network", effects: { reputation: 1, heat: -1, money: -1 }, setFlags: ["network_mode"] },
        { id: "rep_hard_reply", label: "正面回怼", tag: "risk", effects: { reputation: -2, heat: 2, mood: -1 }, setFlags: ["public_fight"] },
      ],
    },
    {
      id: "incident_reputation_credit_split",
      chapter: "临时插曲：口碑走低",
      title: "功劳归属争议",
      text: "一个项目成果发布后，你被说“只拿名头不干活”，群里开始内涵。",
      causeText: "由低口碑和社交压力触发。",
      options: [
        { id: "rep_share_credit", label: "主动分功劳", tag: "social", effects: { reputation: 2, mood: 1, money: -1 } },
        { id: "rep_show_evidence", label: "晒过程证据", tag: "work", effects: { reputation: 1, energy: -1, heat: 1 } },
        { id: "rep_ignore_noise", label: "不回应先干活", tag: "control", effects: { energy: 1, mood: 1, reputation: -1 }, setFlags: ["boundary_mode"] },
      ],
    },
  ],
  heatHigh: [
    {
      id: "incident_heat_trending",
      chapter: "临时插曲：热度过高",
      title: "突然冲上同城热榜",
      text: "你的一条动态被转疯了，私信和评论瞬间爆仓。",
      causeText: "由高围观热度触发。",
      options: [
        { id: "heat_schedule_response", label: "定时统一回应", tag: "control", effects: { heat: -1, reputation: 1, energy: -1 }, setFlags: ["boundary_mode"] },
        { id: "heat_keep_stream", label: "趁热继续连发", tag: "content", effects: { heat: 2, money: 1, mood: -1 }, setFlags: ["viral_path"] },
        { id: "heat_delegate_to_friend", label: "交给朋友代管", tag: "network", effects: { heat: -1, reputation: 1, money: -1 } },
      ],
    },
    {
      id: "incident_heat_offline_day",
      chapter: "临时插曲：热度过高",
      title: "线下被认出来",
      text: "你去便利店都被人喊昵称，拍照请求一波接一波。",
      causeText: "由高围观热度与舆论压力触发。",
      options: [
        { id: "heat_socialize_politely", label: "礼貌合影走流程", tag: "social", effects: { reputation: 1, heat: 1, energy: -1 } },
        { id: "heat_take_break", label: "先躲开冷处理", tag: "rest", effects: { heat: -2, mood: 1, reputation: -1 }, setFlags: ["rest_recovery"] },
        { id: "heat_live_react", label: "现场开播做节目", tag: "content", effects: { heat: 2, money: 1, reputation: -1, energy: -1 }, setFlags: ["content_line"] },
      ],
    },
  ],
};

const CHAPTER_POOLS = {
  1: {
    debt: [
      {
        id: "debt_followup_a",
        chapter: "第二章：债务扩散",
        title: "垫付款开始催回",
        text: "你借的缓冲金到期，群里开始阴阳怪气。",
        causeText: "由第一章借款路线触发。",
        options: [
          { id: "repay_partial", label: "先还一半", tag: "money", effects: { money: -2, reputation: 2, mood: -1 }, setFlags: ["reputation_stable"] },
          { id: "delay_again", label: "继续拖一拖", tag: "risk", effects: { mood: -1, reputation: -2, heat: 1 }, setFlags: ["debt_overhang"] },
          { id: "favor_swap", label: "人情置换", tag: "network", effects: { money: 1, reputation: 0, heat: 1 }, setFlags: ["favor_trade"] },
        ],
      },
      {
        id: "debt_followup_b",
        chapter: "第二章：债务扩散",
        title: "分期陷阱弹窗",
        text: "平台推送“无息分期”，细看才发现手续费更狠。",
        causeText: "由债务压力触发。",
        options: [
          { id: "decline_installment", label: "拒绝分期", tag: "control", effects: { money: 0, mood: -1, reputation: 1 }, setFlags: ["budget_mode"] },
          { id: "small_installment", label: "小额分期", tag: "risk", effects: { money: 1, reputation: -1, heat: 1 }, setFlags: ["debt_overhang"] },
          { id: "sell_idle", label: "卖闲置回血", tag: "money", effects: { money: 2, mood: -1 }, setFlags: ["asset_liquidation"] },
        ],
      },
    ],
    work: [
      {
        id: "work_followup_a",
        chapter: "第二章：工位风暴",
        title: "凌晨改方案",
        text: "你被点名做紧急重构，群聊里全是已读不回。",
        causeText: "由第一章职场路线触发。",
        options: [
          { id: "hard_push", label: "硬顶交付", tag: "work", effects: { money: 2, energy: -3, mood: -1 }, setFlags: ["overwork_line"] },
          { id: "negotiate_scope", label: "砍范围保质量", tag: "control", effects: { energy: 1, reputation: 1 }, setFlags: ["scope_control"] },
          { id: "template_quickfix", label: "模板速成", tag: "risk", effects: { money: 1, reputation: -2, heat: 1 }, setFlags: ["quality_risk"] },
        ],
      },
      {
        id: "work_followup_b",
        chapter: "第二章：工位风暴",
        title: "临时周报会",
        text: "领导临时拉会追问进度，你发现很多口径对不上。",
        causeText: "由第一章职场路线触发。",
        options: [
          { id: "cover_team", label: "先替团队兜底", tag: "social", effects: { reputation: 2, mood: -1, energy: -1 }, setFlags: ["overcommit"] },
          { id: "state_facts", label: "只讲事实", tag: "control", effects: { reputation: 1, mood: 0 }, setFlags: ["boundary_mode"] },
          { id: "bluff_output", label: "数据美化", tag: "risk", effects: { money: 1, reputation: -2, heat: 1 }, setFlags: ["quality_risk"] },
        ],
      },
      {
        id: "work_followup_c",
        chapter: "第二章：工位风暴",
        title: "凌晨群里@全体",
        text: "项目群突然开始“谁懂啊”接龙，你被连环点名交付进度。",
        causeText: "由第一章职场线与加班惯性触发。",
        options: [
          { id: "instant_report", label: "连夜写完汇报", tag: "work", effects: { reputation: 2, energy: -2, mood: -1 }, setFlags: ["overwork_line"] },
          { id: "sync_boundary", label: "明确边界明早回", tag: "control", effects: { mood: 1, energy: 1, reputation: -1 }, setFlags: ["boundary_mode"] },
          { id: "meme_defuse", label: "发梗缓和气氛", tag: "content", effects: { heat: 1, mood: 1, reputation: -1 }, setFlags: ["content_line"] },
        ],
      },
    ],
  },
  2: {
    backlash: [
      {
        id: "public_backlash_a",
        chapter: "第三章：舆论起火",
        title: "匿名帖影射你",
        text: "你的名字被打码截图传播，评论风向迅速变坏。",
        causeText: "由第二章高风险选择反噬。",
        options: [
          { id: "clarify", label: "发澄清帖", tag: "social", effects: { reputation: 1, heat: -1, mood: -1 }, setFlags: ["public_fight"] },
          { id: "mute", label: "关评冷处理", tag: "control", effects: { heat: -2, reputation: -1, mood: 1 }, setFlags: ["silent_line"] },
          { id: "meme_reply", label: "发梗反击", tag: "content", effects: { heat: 2, mood: 1, reputation: -1 }, setFlags: ["content_line"] },
        ],
      },
      {
        id: "public_backlash_b",
        chapter: "第三章：舆论起火",
        title: "朋友圈对线",
        text: "熟人开始在朋友圈隔空内涵你，围观人数持续上升。",
        causeText: "由第二章高风险选择反噬。",
        options: [
          { id: "private_talk", label: "私聊降火", tag: "network", effects: { heat: -1, reputation: 1, mood: -1 }, setFlags: ["network_mode"] },
          { id: "public_counter", label: "公开回应", tag: "social", effects: { heat: 2, reputation: -1, mood: 1 }, setFlags: ["public_fight"] },
          { id: "offline_break", label: "离线一天", tag: "rest", effects: { mood: 2, heat: -1 }, setFlags: ["offline_day"] },
        ],
      },
      {
        id: "public_backlash_c",
        chapter: "第三章：舆论起火",
        title: "词条评论区失控",
        text: "一条截图被二次搬运，评论从调侃升级到站队互喷。",
        causeText: "由高热度内容线持续外溢触发。",
        options: [
          { id: "long_clarify", label: "发长文解释", tag: "social", effects: { reputation: 1, heat: -1, energy: -1 }, setFlags: ["stabilized"] },
          { id: "reply_with_meme", label: "用梗图回击", tag: "content", effects: { heat: 2, mood: 1, reputation: -1 }, setFlags: ["public_fight"] },
          { id: "delegate_friend", label: "让朋友代为沟通", tag: "network", effects: { reputation: 1, money: -1, mood: 0 }, setFlags: ["network_mode"] },
        ],
      },
      {
        id: "public_backlash_d",
        chapter: "第三章：舆论起火",
        title: "热搜反转现场",
        text: "一段新视频冲上热榜，昨天还在站队的评论区今天集体掉头。",
        causeText: "由高热度与公共舆情波动触发。",
        options: [
          { id: "backlash_follow_turn", label: "立刻改口顺风", tag: "social", effects: { reputation: -1, heat: 1, mood: -1 }, setFlags: ["public_fight"] },
          { id: "backlash_post_apology", label: "发帖认错止损", tag: "control", effects: { reputation: 1, heat: -1, mood: -1 }, setFlags: ["stabilized"] },
          { id: "backlash_keep_meme", label: "继续玩梗带节奏", tag: "content", effects: { heat: 2, money: 1, reputation: -2 }, setFlags: ["viral_path"] },
        ],
      },
    ],
    stable: [
      {
        id: "stable_branch_a",
        chapter: "第三章：短暂喘息",
        title: "你拿到缓冲窗口",
        text: "危机暂时缓和，但后续分岔已经埋下。",
        causeText: "由前两章稳健选择触发。",
        options: [
          { id: "bank_budget", label: "做预算表", tag: "control", effects: { money: 1, mood: 1 }, setFlags: ["budget_mode"] },
          { id: "social_dinner", label: "去社交饭局", tag: "network", effects: { reputation: 2, money: -1, energy: -1 }, setFlags: ["network_mode"] },
          { id: "doom_scroll", label: "刷帖逃避", tag: "risk", effects: { mood: -2, heat: 1 }, setFlags: ["anxiety_mode"] },
        ],
      },
      {
        id: "stable_branch_b",
        chapter: "第三章：短暂喘息",
        title: "可控的一天",
        text: "终于有一天没被消息轰炸，你可以主动规划节奏。",
        causeText: "由前两章稳健选择触发。",
        options: [
          { id: "upskill", label: "学一小时技能", tag: "work", effects: { energy: -1, reputation: 1, mood: 1 }, setFlags: ["upgrade_route"] },
          { id: "sleep_early", label: "早睡回血", tag: "rest", effects: { energy: 2, mood: 1 }, setFlags: ["rest_recovery"] },
          { id: "part_time", label: "接个小单", tag: "money", effects: { money: 2, energy: -1 }, setFlags: ["grind_path"] },
        ],
      },
      {
        id: "stable_branch_c",
        chapter: "第三章：短暂喘息",
        title: "算法忽然给你一口饭",
        text: "你随手发的日常内容突然被推荐，评论区意外友好。",
        causeText: "由前两章稳健处理与低争议路线触发。",
        options: [
          { id: "cash_out_fast", label: "趁热接推广", tag: "money", effects: { money: 2, reputation: -1, heat: 1 }, setFlags: ["content_line"] },
          { id: "quality_first", label: "慢慢打磨内容", tag: "control", effects: { reputation: 2, mood: 1, money: -1 }, setFlags: ["upgrade_route"] },
          { id: "keep_low_profile", label: "见好就收", tag: "rest", effects: { mood: 2, heat: -1 }, setFlags: ["silent_line"] },
        ],
      },
      {
        id: "stable_branch_d",
        chapter: "第三章：短暂喘息",
        title: "头条副业课刷屏",
        text: "你刷到一堆“0基础副业翻倍”热帖，评论区全在晒收益截图。",
        causeText: "由短暂稳定期与外部机会刺激触发。",
        options: [
          { id: "stable_try_small_course", label: "先小额试水", tag: "risk", effects: { money: -1, heat: 1, mood: 1 }, setFlags: ["grind_path"] },
          { id: "stable_collect_free_info", label: "只看免费经验", tag: "control", effects: { mood: 1, reputation: 1 }, setFlags: ["scope_control"] },
          { id: "stable_ignore_noise", label: "直接划走", tag: "rest", effects: { mood: 1, heat: -1, money: 0 }, setFlags: ["silent_line"] },
        ],
      },
    ],
  },
  3: {
    health: [
      {
        id: "health_break_a",
        chapter: "第四章：身体与关系",
        title: "体力断崖",
        text: "你开始出现明显疲劳症状，开会时都在走神。",
        causeText: "由连续高压工作或低体力触发。",
        options: [
          { id: "force_rest", label: "强制休整", tag: "rest", effects: { energy: 3, mood: 2, money: -1 }, setFlags: ["rest_recovery"] },
          { id: "energy_drink", label: "继续硬扛", tag: "risk", effects: { energy: 1, mood: -2, heat: 1 }, setFlags: ["burnout_risk"] },
          { id: "delegate_tasks", label: "拆分任务", tag: "network", effects: { energy: 1, reputation: -1, mood: 1 }, setFlags: ["delegation_path"] },
        ],
      },
      {
        id: "health_break_b",
        chapter: "第四章：身体与关系",
        title: "体检报告预警",
        text: "报告提示多个指标偏红，你不得不重新安排节奏。",
        causeText: "由低体力/过劳线触发。",
        options: [
          { id: "full_checkup", label: "立刻复查", tag: "rest", effects: { money: -2, mood: 1, energy: 1 }, setFlags: ["rest_recovery"] },
          { id: "skip_checkup", label: "先顶过去", tag: "risk", effects: { money: 0, mood: -2, heat: 1 }, setFlags: ["burnout_risk"] },
          { id: "insurance_route", label: "走报销流程", tag: "control", effects: { money: -1, reputation: 1, energy: -1 }, setFlags: ["scope_control"] },
        ],
      },
    ],
    relation: [
      {
        id: "relation_pull_a",
        chapter: "第四章：身体与关系",
        title: "关系拉扯",
        text: "你开始在“维系关系”与“保护自己”之间左右互搏。",
        causeText: "由前三章关系/舆论余波触发。",
        options: [
          { id: "help_everyone", label: "尽量都帮", tag: "social", effects: { reputation: 2, energy: -2, mood: -1 }, setFlags: ["overcommit"] },
          { id: "set_boundary", label: "明确边界", tag: "control", effects: { mood: 1, reputation: -1, heat: -1 }, setFlags: ["boundary_mode"] },
          { id: "trade_resources", label: "资源互换", tag: "network", effects: { money: 1, reputation: 1, heat: 1 }, setFlags: ["resource_swap"] },
        ],
      },
      {
        id: "relation_pull_b",
        chapter: "第四章：身体与关系",
        title: "群聊站队点名",
        text: "你被群管理点名表态，沉默也会被解读成立场。",
        causeText: "由社交线积累触发。",
        options: [
          { id: "pick_side", label: "明确站队", tag: "social", effects: { reputation: -1, heat: 2, mood: 1 }, setFlags: ["public_fight"] },
          { id: "neutral_reply", label: "中立回应", tag: "control", effects: { mood: 0, reputation: 1, heat: -1 }, setFlags: ["boundary_mode"] },
          { id: "dm_key_people", label: "私聊关键人", tag: "network", effects: { reputation: 1, energy: -1, mood: -1 }, setFlags: ["network_mode"] },
        ],
      },
      {
        id: "relation_pull_c",
        chapter: "第四章：身体与关系",
        title: "饭局临时加座",
        text: "本来小范围的饭局突然变大型社交局，人人都在观察你。",
        causeText: "由关系线积累与前章社交选择触发。",
        options: [
          { id: "hard_socialize", label: "硬着头皮社交", tag: "social", effects: { reputation: 2, energy: -2, mood: -1 }, setFlags: ["network_mode"] },
          { id: "early_leave", label: "找借口提前撤", tag: "control", effects: { mood: 1, energy: 1, reputation: -1 }, setFlags: ["boundary_mode"] },
          { id: "trade_contact", label: "精准交换资源", tag: "network", effects: { money: 1, reputation: 1, heat: 1 }, setFlags: ["resource_swap"] },
        ],
      },
      {
        id: "relation_pull_d",
        chapter: "第四章：身体与关系",
        title: "贴吧内推排队帖",
        text: "你在打工吧刷到一条“内推排队”热帖，留言区全是‘哥带带我’。",
        causeText: "由关系线与就业焦虑触发。",
        options: [
          { id: "relation_post_resume", label: "发简历求带", tag: "network", effects: { reputation: 1, heat: 1, mood: -1 }, setFlags: ["network_mode"] },
          { id: "relation_pay_consult", label: "花钱买咨询", tag: "money", effects: { money: -2, reputation: 1, mood: 1 }, setFlags: ["upgrade_route"] },
          { id: "relation_self_study", label: "自己做作品集", tag: "work", effects: { reputation: 2, energy: -1, mood: 0 }, setFlags: ["upgrade_route"] },
        ],
      },
    ],
  },
  4: {
    heat: [
      {
        id: "heat_branch_a",
        chapter: "第五章：热度或现金",
        title: "你被推上风口",
        text: "看似有流量，实则每条评论都在吃你的状态值。",
        causeText: "由高热度或内容路线触发。",
        options: [
          { id: "issue_statement", label: "发正式说明", tag: "control", effects: { heat: -2, reputation: 1, mood: -1 }, setFlags: ["stabilized"] },
          { id: "farm_traffic", label: "继续冲热度", tag: "risk", effects: { heat: 2, money: 1, reputation: -2 }, setFlags: ["viral_path"] },
          { id: "logout_day", label: "离线一天", tag: "rest", effects: { mood: 2, heat: -1, money: -1 }, setFlags: ["offline_day"] },
        ],
      },
      {
        id: "heat_branch_b",
        chapter: "第五章：热度或现金",
        title: "微博热搜擦边",
        text: "你被挂在热搜边缘词条，路人和熟人同时围观。",
        causeText: "由高热度触发。",
        options: [
          { id: "pin_clarify", label: "置顶说明", tag: "control", effects: { heat: -1, reputation: 1, mood: -1 }, setFlags: ["stabilized"] },
          { id: "followup_post", label: "再发一条", tag: "content", effects: { heat: 2, mood: 1, reputation: -1 }, setFlags: ["content_line"] },
          { id: "silent_disappear", label: "暂时消失", tag: "rest", effects: { mood: 2, heat: -2 }, setFlags: ["offline_day"] },
        ],
      },
      {
        id: "heat_branch_c",
        chapter: "第五章：热度或现金",
        title: "评论区开始玩你的梗",
        text: "本来只是吐槽，结果被改成模板二创到处复读。",
        causeText: "由高热度持续发酵触发。",
        options: [
          { id: "embrace_meme", label: "顺势认领梗", tag: "content", effects: { heat: 2, money: 1, reputation: -1 }, setFlags: ["viral_path"] },
          { id: "copyright_claim", label: "发声明止损", tag: "control", effects: { heat: -1, reputation: 1, mood: -1 }, setFlags: ["stabilized"] },
          { id: "quit_social_day", label: "社媒休息日", tag: "rest", effects: { mood: 2, heat: -1, money: -1 }, setFlags: ["offline_day"] },
        ],
      },
      {
        id: "heat_branch_d",
        chapter: "第五章：热度或现金",
        title: "平台规则突改",
        text: "平台更新推荐规则，昨天有效的玩法今天突然不灵了。",
        causeText: "由高热度内容路线与平台波动触发。",
        options: [
          { id: "heat_adapt_fast", label: "连夜改打法", tag: "work", effects: { heat: 1, reputation: 1, energy: -2 }, setFlags: ["upgrade_route"] },
          { id: "heat_buy_tool", label: "付费上工具", tag: "money", effects: { money: -2, heat: 1, mood: -1 }, setFlags: ["grind_path"] },
          { id: "heat_pause_observe", label: "停更观察一天", tag: "control", effects: { heat: -1, mood: 1, reputation: 0 }, setFlags: ["scope_control"] },
        ],
      },
    ],
    cash: [
      {
        id: "cash_branch_a",
        chapter: "第五章：热度或现金",
        title: "账单集中到期",
        text: "各种账单在同一天到来，你只能保一个重点。",
        causeText: "由中低热度进入现金决策线。",
        options: [
          { id: "pay_necessity", label: "只保刚需", tag: "control", effects: { money: -1, mood: 1 }, setFlags: ["survival_focus"] },
          { id: "borrow_rotate", label: "借新还旧", tag: "risk", effects: { money: 2, reputation: -2, heat: 1 }, setFlags: ["debt_spiral"] },
          { id: "extra_job", label: "临时接单", tag: "work", effects: { money: 2, energy: -2, mood: -1 }, setFlags: ["grind_path"] },
        ],
      },
      {
        id: "cash_branch_b",
        chapter: "第五章：热度或现金",
        title: "平台扣款异常",
        text: "自动续费和隐藏扣款同时触发，余额直线下降。",
        causeText: "由现金压力线触发。",
        options: [
          { id: "chargeback_now", label: "立刻申诉", tag: "control", effects: { money: 1, energy: -1, mood: -1 }, setFlags: ["budget_mode"] },
          { id: "ignore_small_loss", label: "先不管小额", tag: "rest", effects: { money: -1, mood: 1 }, setFlags: ["survival_focus"] },
          { id: "public_expose_pay", label: "公开挂平台", tag: "content", effects: { heat: 2, reputation: -1, mood: 1 }, setFlags: ["content_line"] },
        ],
      },
      {
        id: "cash_branch_c",
        chapter: "第五章：热度或现金",
        title: "房租到期倒计时",
        text: "钱包和账单开始贴脸输出，你必须做一个当下最现实的选择。",
        causeText: "由中低现金与预算压力触发。",
        options: [
          { id: "move_cheaper_room", label: "搬去更便宜房", tag: "money", effects: { money: 2, mood: -1, reputation: -1 }, setFlags: ["survival_focus"] },
          { id: "ask_landlord_delay", label: "和房东谈延期", tag: "network", effects: { money: 1, reputation: 1, heat: 1 }, setFlags: ["rent_secured"] },
          { id: "consume_credit", label: "刷卡先顶住", tag: "risk", effects: { money: 2, mood: -1, reputation: -1 }, setFlags: ["debt_spiral"] },
        ],
      },
      {
        id: "cash_branch_d",
        chapter: "第五章：热度或现金",
        title: "兼职平台新门槛",
        text: "新规上线后，很多原本能接的零活突然要补材料和资质。",
        causeText: "由现金压力线与外部规则变化触发。",
        options: [
          { id: "cash_prepare_docs", label: "补资料硬过审", tag: "work", effects: { money: 1, energy: -1, reputation: 1 }, setFlags: ["work_focus"] },
          { id: "cash_find_offline_job", label: "转线下零工", tag: "network", effects: { money: 1, reputation: 1, mood: -1 }, setFlags: ["grind_path"] },
          { id: "cash_skip_risky_job", label: "放弃高风险单", tag: "control", effects: { money: -1, mood: 1, reputation: 1 }, setFlags: ["survival_focus"] },
        ],
      },
    ],
  },
  5: {
    debt: [
      {
        id: "debt_end_a",
        chapter: "第六章：摊牌或转型",
        title: "你必须解释钱去哪了",
        text: "借贷链条开始反噬，你要面对真实代价。",
        causeText: "由第五章债务/低现金触发。",
        options: [
          { id: "full_disclose", label: "坦白并重排预算", tag: "control", effects: { reputation: 1, mood: -1, money: 1 }, setFlags: ["budget_rebuild"] },
          { id: "hide_again", label: "继续隐瞒", tag: "risk", effects: { reputation: -2, mood: -1, heat: 1 }, setFlags: ["trust_break"] },
          { id: "sell_assets", label: "处理闲置回血", tag: "money", effects: { money: 2, mood: -1 }, setFlags: ["asset_liquidation"] },
        ],
      },
      {
        id: "debt_end_b",
        chapter: "第六章：摊牌或转型",
        title: "催款电话连环响",
        text: "从白天到深夜不断来电，你不得不正面回应。",
        causeText: "由债务螺旋触发。",
        options: [
          { id: "repay_plan", label: "给出还款计划", tag: "control", effects: { reputation: 1, mood: -1, money: 1 }, setFlags: ["budget_rebuild"] },
          { id: "switch_number", label: "先躲几天", tag: "risk", effects: { mood: -1, reputation: -2, heat: 1 }, setFlags: ["trust_break"] },
          { id: "ask_family_help", label: "向家里求助", tag: "network", effects: { money: 2, reputation: -1, mood: 1 }, setFlags: ["family_help"] },
        ],
      },
    ],
    pivot: [
      {
        id: "pivot_end_a",
        chapter: "第六章：摊牌或转型",
        title: "你要决定接下来怎么活",
        text: "短期止血还是长期转型，决定你后续几十天的生存基调。",
        causeText: "由前五章表现进入转型线。",
        options: [
          { id: "upskill_focus", label: "投入学习", tag: "work", effects: { money: -1, energy: -1, reputation: 2 }, setFlags: ["upgrade_route"] },
          { id: "relationship_route", label: "经营关系网络", tag: "network", effects: { reputation: 2, heat: 1, mood: 1 }, setFlags: ["network_route"] },
          { id: "survival_route", label: "继续保守求生", tag: "rest", effects: { mood: 1, energy: 1, money: -1 }, setFlags: ["survival_route"] },
        ],
      },
      {
        id: "pivot_end_b",
        chapter: "第六章：摊牌或转型",
        title: "赛道切换窗口",
        text: "你拿到一次转型机会，但代价是真实的时间和金钱。",
        causeText: "由稳定线触发。",
        options: [
          { id: "switch_track", label: "切新赛道", tag: "work", effects: { money: -2, energy: -1, reputation: 2 }, setFlags: ["upgrade_route"] },
          { id: "stay_track", label: "留在原轨道", tag: "control", effects: { mood: 1, money: 1 }, setFlags: ["survival_route"] },
          { id: "hybrid_route", label: "主副并行", tag: "risk", effects: { money: 1, energy: -2, heat: 1 }, setFlags: ["grind_path"] },
        ],
      },
      {
        id: "pivot_end_c",
        chapter: "第六章：摊牌或转型",
        title: "赛博班味与理想冲突",
        text: "你开始怀疑自己是在升级人生，还是只是在换一种方式内耗。",
        causeText: "由长期高压但未崩盘状态触发。",
        options: [
          { id: "join_training_camp", label: "报班强行升级", tag: "work", effects: { money: -2, reputation: 2, energy: -1 }, setFlags: ["upgrade_route"] },
          { id: "small_business_try", label: "试水小买卖", tag: "risk", effects: { money: 1, heat: 1, mood: -1 }, setFlags: ["grind_path"] },
          { id: "slow_life_reset", label: "慢节奏重置", tag: "rest", effects: { mood: 2, energy: 1, money: -1 }, setFlags: ["survival_route"] },
        ],
      },
      {
        id: "pivot_end_d",
        chapter: "第六章：摊牌或转型",
        title: "热榜都在聊AI提效",
        text: "微博和头条都在讨论“AI替代焦虑”，你也被催着立刻升级工具链。",
        causeText: "由长期生存线与职业压力线叠加触发。",
        options: [
          { id: "pivot_ai_upgrade", label: "氪金上AI工具", tag: "money", effects: { money: -2, reputation: 2, energy: -1 }, setFlags: ["upgrade_route"] },
          { id: "pivot_ai_collab", label: "找人组队共用", tag: "network", effects: { reputation: 1, money: -1, mood: 1 }, setFlags: ["network_route"] },
          { id: "pivot_ai_wait", label: "先观察不跟风", tag: "control", effects: { mood: 1, money: 0, heat: -1 }, setFlags: ["survival_route"] },
        ],
      },
    ],
  },
};

const WANG_CHAPTER_POOLS = {
  1: {
    job: [
      {
        id: "wang_stage1_job_a",
        chapter: "第二章：工位保卫",
        title: "季度述职临时加码",
        text: "王骚猪刚坐下就被通知：述职要补一页“AI提效成果”，下午就要交。",
        causeText: "由职场转折主线触发。",
        options: [
          { id: "wang_s1_job_hard", label: "硬做一版先交", tag: "work", effects: { reputation: 2, energy: -2, mood: -1 }, setFlags: ["overwork_line"] },
          { id: "wang_s1_job_scope", label: "砍范围保质量", tag: "control", effects: { reputation: 1, mood: 1 }, setFlags: ["scope_control"] },
          { id: "wang_s1_job_template", label: "模板先顶住", tag: "risk", effects: { money: 1, reputation: -2, heat: 1 }, setFlags: ["quality_risk"] },
        ],
      },
      {
        id: "wang_stage1_job_b",
        chapter: "第二章：工位保卫",
        title: "年轻同事卷到凌晨",
        text: "组里新人连续通宵冲榜，王骚猪感觉自己被比成了“旧版本”。",
        causeText: "由工位压力和年龄焦虑触发。",
        options: [
          { id: "wang_s1_compete", label: "跟着一起卷", tag: "work", effects: { reputation: 1, money: 1, energy: -2, mood: -1 }, setFlags: ["overwork_line"] },
          { id: "wang_s1_collab", label: "主动结对协作", tag: "network", effects: { reputation: 2, mood: 1, money: 0 }, setFlags: ["network_mode"] },
          { id: "wang_s1_boundary", label: "守住节奏不硬卷", tag: "control", effects: { mood: 1, energy: 1, reputation: -1 }, setFlags: ["boundary_mode"] },
        ],
      },
    ],
    side: [
      {
        id: "wang_stage1_side_a",
        chapter: "第二章：副业补坑",
        title: "下班后代运营邀约",
        text: "老同学问你要不要接短期代运营，钱不多但来得快。",
        causeText: "由开局副业补坑路线触发。",
        options: [
          { id: "wang_s1_side_take", label: "接单补现金", tag: "money", effects: { money: 2, energy: -2, mood: -1 }, setFlags: ["grind_path"] },
          { id: "wang_s1_side_negotiate", label: "先谈清边界", tag: "control", effects: { money: 1, reputation: 1 }, setFlags: ["scope_control"] },
          { id: "wang_s1_side_decline", label: "拒绝保状态", tag: "rest", effects: { energy: 1, mood: 1, money: -1 }, setFlags: ["rest_recovery"] },
        ],
      },
      {
        id: "wang_stage1_side_b",
        chapter: "第二章：副业补坑",
        title: "周末摆摊计划",
        text: "小区夜市摊位空出来，你可以试试卖点熟悉的二手数码。",
        causeText: "由现金压力与副业线叠加触发。",
        options: [
          { id: "wang_s1_stall_try", label: "试摆两晚", tag: "money", effects: { money: 2, heat: 1, energy: -1 }, setFlags: ["grind_path"] },
          { id: "wang_s1_stall_partner", label: "拉朋友合伙", tag: "network", effects: { money: 1, reputation: 1, mood: 1 }, setFlags: ["network_route"] },
          { id: "wang_s1_stall_cancel", label: "先不折腾", tag: "control", effects: { mood: 1, heat: -1, money: 0 }, setFlags: ["survival_focus"] },
        ],
      },
    ],
    network: [
      {
        id: "wang_stage1_network_a",
        chapter: "第二章：老友资源局",
        title: "前同事内推消息",
        text: "前同事发来内推窗口，但要求你这周补齐一套作品证明。",
        causeText: "由开局联系老同事路线触发。",
        options: [
          { id: "wang_s1_referral_push", label: "连夜补作品", tag: "work", effects: { reputation: 2, energy: -2, mood: -1 }, setFlags: ["upgrade_route"] },
          { id: "wang_s1_referral_trade", label: "资源互换求协助", tag: "network", effects: { reputation: 1, money: -1, mood: 1 }, setFlags: ["resource_swap"] },
          { id: "wang_s1_referral_skip", label: "暂缓这次机会", tag: "control", effects: { mood: 1, energy: 1, reputation: -1 }, setFlags: ["boundary_mode"] },
        ],
      },
    ],
  },
  2: {
    pressure: [
      {
        id: "wang_stage2_pressure_a",
        chapter: "第三章：家庭与账单",
        title: "单人账单爆发",
        text: "少了两个人分摊后，房租、通勤、外卖和搬家尾款一起压上来，现金流突然变窄。",
        causeText: "由单人现金流压力触发。",
        options: [
          { id: "wang_s2_pay_mortgage", label: "先保房租与通勤", tag: "money", effects: { money: -2, mood: -1, reputation: 1 }, setFlags: ["rent_secured"] },
          { id: "wang_s2_cut_course", label: "全面降本生活", tag: "control", effects: { money: 1, mood: -1, reputation: -1 }, setFlags: ["budget_mode"] },
          { id: "wang_s2_credit_roll", label: "信用卡先周转", tag: "risk", effects: { money: 2, mood: -1, reputation: -1, heat: 1 }, setFlags: ["debt_spiral"] },
        ],
      },
      {
        id: "wang_stage2_pressure_b",
        chapter: "第三章：家庭与账单",
        title: "状态波动传到同事圈",
        text: "午休时你被同事关心“还好吗”，明明想装没事，状态还是被看出来了。",
        causeText: "由家庭压力与职业不确定性触发。",
        options: [
          { id: "wang_s2_job_search", label: "把波动转成行动", tag: "work", effects: { reputation: 1, energy: -1, mood: 1 }, setFlags: ["upgrade_route"] },
          { id: "wang_s2_hold_position", label: "保持体面低调", tag: "control", effects: { mood: 1, reputation: 1, money: 0 }, setFlags: ["work_focus"] },
          { id: "wang_s2_start_sidebiz", label: "深夜副业转移注意", tag: "money", effects: { money: 1, energy: -1, heat: 1 }, setFlags: ["grind_path"] },
        ],
      },
    ],
    backlash: [
      {
        id: "wang_stage2_backlash_a",
        chapter: "第三章：舆论和职场反噬",
        title: "骨干优化传言扩散",
        text: "公司内部群开始流传“下一轮优化名单”，你的名字被多次提到。",
        causeText: "由高风险选择或高压状态反噬触发。",
        options: [
          { id: "wang_s2_backlash_pr", label: "主动找领导对齐", tag: "social", effects: { reputation: 1, mood: -1, heat: -1 }, setFlags: ["stabilized"] },
          { id: "wang_s2_backlash_quiet", label: "保持低调观察", tag: "control", effects: { mood: 1, heat: -1, money: 0 }, setFlags: ["silent_line"] },
          { id: "wang_s2_backlash_post", label: "发帖吐槽发泄", tag: "content", effects: { mood: 1, heat: 2, reputation: -2 }, setFlags: ["public_fight"] },
        ],
      },
    ],
  },
  3: {
    health: [
      {
        id: "wang_stage3_health_a",
        chapter: "第四章：身体报警",
        title: "体检单三项预警",
        text: "体检报告刚出来，医生建议你立刻调整作息，不然问题会连锁放大。",
        causeText: "由持续透支触发。",
        options: [
          { id: "wang_s3_health_rest", label: "请假休整两天", tag: "rest", effects: { energy: 3, mood: 2, money: -1 }, setFlags: ["rest_recovery"] },
          { id: "wang_s3_health_medicine", label: "吃药继续扛", tag: "risk", effects: { energy: 1, mood: -2, reputation: 1 }, setFlags: ["burnout_risk"] },
          { id: "wang_s3_health_delegate", label: "把非核心活分出去", tag: "network", effects: { energy: 1, reputation: -1, mood: 1 }, setFlags: ["delegation_path"] },
        ],
      },
      {
        id: "wang_stage3_health_b",
        chapter: "第四章：身体报警",
        title: "凌晨胃痛到醒",
        text: "连续熬夜后你半夜被胃痛叫醒，第二天会议还排满。",
        causeText: "由过劳和不规律饮食触发。",
        options: [
          { id: "wang_s3_hospital", label: "早上先去门诊", tag: "rest", effects: { money: -1, energy: 2, mood: 1 }, setFlags: ["rest_recovery"] },
          { id: "wang_s3_keep_meeting", label: "顶着开会", tag: "work", effects: { reputation: 1, energy: -2, mood: -1 }, setFlags: ["overwork_line"] },
          { id: "wang_s3_move_remote", label: "申请线上参会", tag: "control", effects: { energy: 1, mood: 1, reputation: 0 }, setFlags: ["scope_control"] },
        ],
      },
    ],
    relation: [
      {
        id: "wang_stage3_relation_a",
        chapter: "第四章：关系拉扯",
        title: "旧关系待办找上门",
        text: "你下班回到家，门口放着待取的纸箱，消息框里是“今晚方便吗”。",
        causeText: "由关系线和高压节奏叠加触发。",
        options: [
          { id: "wang_s3_relation_apology", label: "平和交接避免拉扯", tag: "social", effects: { reputation: 2, mood: 1, energy: -1 }, setFlags: ["reputation_stable"] },
          { id: "wang_s3_relation_ignore", label: "拖着不回消息", tag: "risk", effects: { mood: -1, reputation: -2, heat: 1 }, setFlags: ["trust_break"] },
          { id: "wang_s3_relation_schedule", label: "找朋友代为处理", tag: "control", effects: { mood: 1, reputation: 1, money: -1 }, setFlags: ["boundary_mode"] },
        ],
      },
    ],
  },
  4: {
    heat: [
      {
        id: "wang_stage4_heat_a",
        chapter: "第五章：风口与体面",
        title: "深夜自救帖意外上热门",
        text: "你深夜写的职场自救帖被搬运，评论区一半共情一半开嘲。",
        causeText: "由高热度或内容路线触发。",
        options: [
          { id: "wang_s4_heat_follow", label: "顺势连更", tag: "content", effects: { heat: 2, money: 1, reputation: -1 }, setFlags: ["viral_path"] },
          { id: "wang_s4_heat_clarify", label: "补充完整情况", tag: "control", effects: { reputation: 1, heat: -1, mood: -1 }, setFlags: ["stabilized"] },
          { id: "wang_s4_heat_offline", label: "离线一天", tag: "rest", effects: { mood: 2, heat: -1, money: -1 }, setFlags: ["offline_day"] },
        ],
      },
      {
        id: "wang_stage4_heat_b",
        chapter: "第五章：风口与体面",
        title: "老同事在评论区认出你",
        text: "本来匿名吐槽的内容被熟人认出，私聊窗口瞬间爆满。",
        causeText: "由热度外溢与关系链交叉触发。",
        options: [
          { id: "wang_s4_dm_explain", label: "逐个私聊解释", tag: "network", effects: { reputation: 1, mood: -1, energy: -1 }, setFlags: ["network_mode"] },
          { id: "wang_s4_public_reply", label: "公开回应一次", tag: "social", effects: { heat: 1, reputation: 0, mood: -1 }, setFlags: ["public_fight"] },
          { id: "wang_s4_keep_silent", label: "暂不回应", tag: "control", effects: { mood: 1, heat: -1, reputation: -1 }, setFlags: ["silent_line"] },
        ],
      },
    ],
    cash: [
      {
        id: "wang_stage4_cash_a",
        chapter: "第五章：现金保卫",
        title: "车险与年费双重扣款",
        text: "两笔自动扣款同天发生，王骚猪的余额瞬间掉到底线。",
        causeText: "由现金压力线触发。",
        options: [
          { id: "wang_s4_cash_cut", label: "砍掉非必要开销", tag: "control", effects: { money: 1, mood: -1, heat: -1 }, setFlags: ["budget_mode"] },
          { id: "wang_s4_cash_sidejob", label: "周末加一份零工", tag: "work", effects: { money: 2, energy: -2, mood: -1 }, setFlags: ["grind_path"] },
          { id: "wang_s4_cash_rotate", label: "继续周转", tag: "risk", effects: { money: 2, reputation: -2, heat: 1 }, setFlags: ["debt_spiral"] },
        ],
      },
      {
        id: "wang_stage4_cash_b",
        chapter: "第五章：现金保卫",
        title: "单人生活成本重算",
        text: "你开始重算每月固定支出，发现以前两人摊掉的成本如今都压在自己身上。",
        causeText: "由独居成本与现金压力叠加触发。",
        options: [
          { id: "wang_s4_course_pay", label: "维持原生活标准", tag: "money", effects: { money: -2, reputation: 1, mood: -1 }, setFlags: ["survival_focus"] },
          { id: "wang_s4_course_pause", label: "立刻降本瘦身", tag: "control", effects: { money: 1, mood: -1, reputation: -1 }, setFlags: ["budget_mode"] },
          { id: "wang_s4_course_alt", label: "找朋友共享资源", tag: "network", effects: { money: 0, reputation: 1, mood: 1 }, setFlags: ["resource_swap"] },
        ],
      },
    ],
  },
  5: {
    debt: [
      {
        id: "wang_stage5_debt_a",
        chapter: "第六章：摊牌时刻",
        title: "状态账本与现金账本",
        text: "你把这段时间的收入、支出和状态波动都列出来，终于看清自己在透支什么。",
        causeText: "由债务和低现金路径触发。",
        options: [
          { id: "wang_s5_debt_rebuild", label: "重排预算先活下去", tag: "control", effects: { money: 1, reputation: 1, mood: -1 }, setFlags: ["budget_rebuild"] },
          { id: "wang_s5_debt_hide", label: "先瞒一部分", tag: "risk", effects: { money: 1, reputation: -2, mood: -1, heat: 1 }, setFlags: ["trust_break"] },
          { id: "wang_s5_debt_assets", label: "卖闲置止血", tag: "money", effects: { money: 2, mood: -1 }, setFlags: ["asset_liquidation"] },
        ],
      },
      {
        id: "wang_stage5_debt_b",
        chapter: "第六章：摊牌时刻",
        title: "催款电话打到单位",
        text: "催收电话开始打到工位附近，王骚猪的体面被现实硬拽出来。",
        causeText: "由债务螺旋和声誉压力触发。",
        options: [
          { id: "wang_s5_debt_plan", label: "给出明确还款计划", tag: "control", effects: { reputation: 1, money: 1, mood: -1 }, setFlags: ["budget_rebuild"] },
          { id: "wang_s5_debt_family", label: "向家里求援", tag: "network", effects: { money: 2, reputation: -1, mood: 1 }, setFlags: ["family_help"] },
          { id: "wang_s5_debt_escape", label: "先躲几天", tag: "risk", effects: { mood: -1, reputation: -2, heat: 1 }, setFlags: ["trust_break"] },
        ],
      },
    ],
    pivot: [
      {
        id: "wang_stage5_pivot_a",
        chapter: "第六章：再就业分岔",
        title: "外包转岗窗口出现",
        text: "你拿到一次转岗外包管理的机会，薪资更稳但成长更慢。",
        causeText: "由稳定求生路径触发。",
        options: [
          { id: "wang_s5_pivot_take", label: "先保稳定收入", tag: "control", effects: { money: 1, mood: 1, heat: -1 }, setFlags: ["survival_route"] },
          { id: "wang_s5_pivot_upgrade", label: "继续冲技能升级", tag: "work", effects: { reputation: 2, energy: -1, money: -1 }, setFlags: ["upgrade_route"] },
          { id: "wang_s5_pivot_partner", label: "找老友合伙试项目", tag: "network", effects: { reputation: 1, money: 1, mood: 1 }, setFlags: ["network_route"] },
        ],
      },
      {
        id: "wang_stage5_pivot_b",
        chapter: "第六章：再就业分岔",
        title: "30+转型训练营",
        text: "一个“30+再加速”训练营给你发来录取通知，学费和时间都很吃紧。",
        causeText: "由长线生存后期触发的转型机会。",
        options: [
          { id: "wang_s5_camp_join", label: "报名冲一把", tag: "work", effects: { reputation: 2, money: -2, energy: -1 }, setFlags: ["upgrade_route"] },
          { id: "wang_s5_camp_wait", label: "先观望一季", tag: "control", effects: { mood: 1, money: 1 }, setFlags: ["survival_route"] },
          { id: "wang_s5_camp_smallbiz", label: "边打工边试小买卖", tag: "risk", effects: { money: 1, heat: 1, mood: -1 }, setFlags: ["grind_path"] },
        ],
      },
    ],
  },
};

const EVENT_RETIRE_RULES = {
  stable_branch_a: { milestonesAny: ["debt_veteran", "public_figure"] },
  work_followup_a: { milestonesAny: ["burnout_veteran"] },
  cash_branch_a: { milestonesAny: ["stability_reached"] },
};

const GROWTH_EVENT_POOL = [
  {
    id: "growth_debt_restructure",
    chapter: "成长节点：债务生存术",
    title: "你终于学会重排账单",
    text: "连续吃过几次债务亏后，你开始用更系统的方法管理现金流。",
    causeText: "由债务压力经历触发的新成长事件。",
    noRepeat: true,
    unlockWhen: { milestonesAny: ["debt_veteran"], minDay: 4 },
    options: [
      { id: "growth_debt_sheet", label: "做强制预算表", tag: "control", effects: { money: 1, mood: 1, heat: -1 }, setFlags: ["budget_rebuild"] },
      { id: "growth_debt_hustle", label: "现金流优先策略", tag: "work", effects: { money: 2, energy: -1, mood: -1 }, setFlags: ["grind_path"] },
      { id: "growth_debt_social", label: "人情债先清", tag: "network", effects: { reputation: 2, money: -1, mood: 1 }, setFlags: ["reputation_stable"] },
    ],
  },
  {
    id: "growth_burnout_boundary",
    chapter: "成长节点：边界感觉醒",
    title: "你不再什么都硬扛",
    text: "透支过几轮后，你开始主动切工作边界，不再把自己当消耗品。",
    causeText: "由过劳危机经历触发的新成长事件。",
    noRepeat: true,
    unlockWhen: { milestonesAny: ["burnout_veteran"], minDay: 5 },
    options: [
      { id: "growth_burnout_delegate", label: "任务拆解+委派", tag: "control", effects: { energy: 2, reputation: 1, money: -1 }, setFlags: ["delegation_path"] },
      { id: "growth_burnout_rest", label: "固定恢复窗口", tag: "rest", effects: { energy: 2, mood: 1, heat: -1 }, setFlags: ["rest_recovery"] },
      { id: "growth_burnout_push", label: "继续冲但更谨慎", tag: "work", effects: { money: 1, reputation: 1, energy: -1 }, setFlags: ["scope_control"] },
    ],
  },
  {
    id: "growth_public_strategy",
    chapter: "成长节点：舆论打法升级",
    title: "你学会和流量共处",
    text: "几轮热搜翻车后，你开始按节奏发声，不再一上头就全盘梭哈。",
    causeText: "由高热度舆论周期触发的新成长事件。",
    noRepeat: true,
    unlockWhen: { milestonesAny: ["public_figure"], minDay: 6 },
    options: [
      { id: "growth_public_schedule", label: "制定发声节奏", tag: "control", effects: { heat: -1, reputation: 2, mood: 1 }, setFlags: ["stabilized"] },
      { id: "growth_public_team", label: "找朋友共管账号", tag: "network", effects: { reputation: 1, mood: 1, money: -1 }, setFlags: ["network_mode"] },
      { id: "growth_public_meme", label: "继续玩梗但控频", tag: "content", effects: { heat: 1, money: 1, reputation: -1 }, setFlags: ["content_line"] },
    ],
  },
  {
    id: "growth_stability_upgrade",
    chapter: "成长节点：稳定后升级",
    title: "你从求生转向经营",
    text: "撑过最难阶段后，你不再只想着活下去，开始布局更长线的选择。",
    causeText: "由长期稳定生存触发的新成长事件。",
    noRepeat: true,
    unlockWhen: { milestonesAny: ["stability_reached"], minDay: 10 },
    options: [
      { id: "growth_upgrade_skill", label: "投入核心技能", tag: "work", effects: { reputation: 2, money: -1, energy: -1 }, setFlags: ["upgrade_route"] },
      { id: "growth_upgrade_network", label: "经营关键关系", tag: "network", effects: { reputation: 2, heat: 1, mood: 1 }, setFlags: ["network_route"] },
      { id: "growth_upgrade_balance", label: "稳步慢增", tag: "control", effects: { money: 1, mood: 1, heat: -1 }, setFlags: ["survival_route"] },
    ],
  },
];

const MILESTONE_EVENTS = {
  25: {
    id: "milestone_25",
    chapter: "里程碑：第25天账单",
    title: "第一轮生存账单",
    text: "你已经扛到第 25 天，过去的选择开始集中结算。",
    causeText: "由里程碑触发，必须完成一次阶段结算。",
    options: [
      { id: "milestone_25_cash", label: "现金优先止血", tag: "money", effects: { money: 2, mood: -1, reputation: -1 }, setFlags: ["survival_focus"] },
      { id: "milestone_25_energy", label: "体力优先恢复", tag: "rest", effects: { energy: 2, money: -1, heat: -1 }, setFlags: ["rest_recovery"] },
      { id: "milestone_25_rep", label: "口碑优先修复", tag: "network", effects: { reputation: 2, money: -1, mood: -1 }, setFlags: ["reputation_stable"] },
    ],
  },
  50: {
    id: "milestone_50",
    chapter: "里程碑：第50天拐点",
    title: "半程压测",
    text: "50 天到了，接下来不能再靠同一套惯性硬撑。",
    causeText: "由中盘里程碑触发，要求明确下一阶段策略。",
    options: [
      { id: "milestone_50_grind", label: "继续硬扛冲产出", tag: "work", effects: { money: 2, energy: -2, mood: -1 }, setFlags: ["grind_path"] },
      { id: "milestone_50_control", label: "收缩战线保稳定", tag: "control", effects: { mood: 1, energy: 1, heat: -1 }, setFlags: ["scope_control"] },
      { id: "milestone_50_social", label: "走关系换资源", tag: "network", effects: { reputation: 2, money: 1, mood: -1 }, setFlags: ["network_route"] },
    ],
  },
  75: {
    id: "milestone_75",
    chapter: "里程碑：第75天冲刺",
    title: "后程冲刺窗口",
    text: "你来到第 75 天，后 25 天每一步都可能是放大器。",
    causeText: "由后程里程碑触发，选择将放大最终结局走势。",
    options: [
      { id: "milestone_75_heat", label: "押注热度放大", tag: "content", effects: { heat: 2, money: 1, reputation: -2 }, setFlags: ["viral_path"] },
      { id: "milestone_75_stable", label: "稳态优先", tag: "control", effects: { mood: 1, reputation: 1, heat: -1 }, setFlags: ["stabilized"] },
      { id: "milestone_75_upgrade", label: "技能升级冲线", tag: "work", effects: { reputation: 2, energy: -1, money: -1 }, setFlags: ["upgrade_route"] },
    ],
  },
  100: {
    id: "milestone_100",
    chapter: "里程碑：第100天",
    title: "100天节点",
    text: "你扛到第 100 天，城市给你递上了新的账本。",
    causeText: "由目标里程碑触发，决定是继续扩张还是稳住人生盘。",
    options: [
      { id: "milestone_100_expand", label: "扩大投入继续冲", tag: "risk", effects: { money: 1, reputation: 1, energy: -2, heat: 1 }, setFlags: ["grind_path"] },
      { id: "milestone_100_balance", label: "维持平衡慢走", tag: "control", effects: { mood: 2, energy: 1, heat: -1 }, setFlags: ["survival_route"] },
      { id: "milestone_100_cashout", label: "落袋为安", tag: "money", effects: { money: 2, mood: 1, reputation: -1 }, setFlags: ["budget_rebuild"] },
    ],
  },
};

function seededRandom(seed = 1) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

function randomPick(list, random) {
  return list[Math.floor(random() * list.length)];
}

function hashString(input = "") {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickStableVariant(pool = [], key = "") {
  if (!Array.isArray(pool) || !pool.length) return "";
  const idx = hashString(key) % pool.length;
  return pool[idx];
}

function addPressure(session, key, delta) {
  session.pressure[key] = clamp((session.pressure[key] || 0) + delta, 0, 8);
}

function updatePressureFromAction(session, option, appliedEffects = option.effects || {}) {
  const effects = appliedEffects || {};
  if (option.tag === "risk") {
    addPressure(session, "debt", 2);
    addPressure(session, "scrutiny", 1);
  }
  if (option.tag === "work") addPressure(session, "burnout", 2);
  if (option.tag === "content" || option.tag === "social") addPressure(session, "scrutiny", 2);
  if ((effects.money || 0) <= -2) addPressure(session, "debt", 1);
  if ((effects.energy || 0) <= -2) addPressure(session, "burnout", 1);
  if ((effects.heat || 0) >= 2) addPressure(session, "scrutiny", 1);
  if (session.sameTagCount >= 3) {
    addPressure(session, "burnout", 1);
    addPressure(session, "scrutiny", 1);
  }
}

function scheduleDelayedConsequence(session, event, option) {
  const currentDay = session.dayIndex + 1;
  const byTag = {
    risk: [
      { delay: 1, effects: { money: -1, reputation: -1 }, text: "前面的激进操作开始回吐，账上和口碑都被反咬。" },
      { delay: 2, effects: { mood: -1, heat: 1 }, text: "旧选择被翻出来讨论，情绪下滑，围观反而上来了。" },
    ],
    work: [
      { delay: 1, effects: { energy: -1, mood: -1 }, text: "连续硬扛的后劲上来，精力和情绪一起掉线。" },
      { delay: 2, effects: { reputation: 1, energy: -1 }, text: "活干出来了但人快散架，体面和消耗同时结算。" },
    ],
    social: [
      { delay: 1, effects: { reputation: -1, mood: -1 }, text: "社交场的后坐力来了，关系账开始反噬。" },
      { delay: 2, effects: { heat: 1, reputation: -1 }, text: "讨论没停，风评却开始偏航。" },
    ],
    network: [
      { delay: 1, effects: { reputation: -1, money: 1 }, text: "人情账兑现：资源到手，但口碑要还一点。" },
      { delay: 2, effects: { mood: -1, reputation: -1 }, text: "关系维护成本补票，心情和体面同时缩水。" },
    ],
    content: [
      { delay: 1, effects: { heat: 1, reputation: -1 }, text: "热度继续涨，但评论区开始反噬口碑。" },
      { delay: 2, effects: { mood: -1, money: -1 }, text: "流量红利退潮，情绪和收益都回撤。" },
    ],
  };
  const templates = byTag[option.tag] || [];
  if (!templates.length) return;
  const chance = option.tag === "risk" ? 0.75 : 0.45;
  if (session.random() > chance) return;
  const picked = randomPick(templates, session.random);
  session.pendingConsequences.push({
    dueDay: currentDay + picked.delay,
    effects: picked.effects,
    text: picked.text,
    source: `Day ${currentDay} ${event.title}`,
  });
}

function collectDueConsequences(session, currentDay) {
  const due = [];
  const rest = [];
  session.pendingConsequences.forEach((item) => {
    if (item.dueDay <= currentDay) due.push(item);
    else rest.push(item);
  });
  session.pendingConsequences = rest;
  return due;
}

function applyPressurePenalty(session) {
  const effects = { money: 0, energy: 0, mood: 0, reputation: 0, heat: 0 };
  const notes = [];
  if (session.pressure.debt >= 4) {
    effects.money -= 1;
    effects.mood -= 1;
    session.pressure.debt = clamp(session.pressure.debt - 2, 0, 8);
    session.flags.debt_overhang = true;
    notes.push("债务压力溢出");
  }
  if (session.pressure.burnout >= 4) {
    effects.energy -= 1;
    effects.mood -= 1;
    session.pressure.burnout = clamp(session.pressure.burnout - 2, 0, 8);
    session.flags.burnout_risk = true;
    notes.push("过劳压力溢出");
  }
  if (session.pressure.scrutiny >= 4) {
    effects.reputation -= 1;
    effects.heat += 1;
    session.pressure.scrutiny = clamp(session.pressure.scrutiny - 2, 0, 8);
    session.flags.trust_break = true;
    notes.push("舆论压力溢出");
  }

  addPressure(session, "debt", -1);
  addPressure(session, "burnout", -1);
  addPressure(session, "scrutiny", -1);

  return {
    effects,
    text: notes.length ? `${notes.join("、")}，系统性损耗生效。` : "",
  };
}

function applyEndOfDayConsequences(session) {
  const day = session.dayIndex + 1;
  const applied = [];
  const due = collectDueConsequences(session, day);
  due.forEach((item) => {
    const before = cloneStats(session.stats);
    applyEffects(session.stats, item.effects);
    const delta = statsDelta(before, session.stats);
    if (effectToText(delta)) {
      applied.push({
        day,
        optionLabel: `延迟后果：${item.text}`,
        impactText: effectToText(delta),
        delta,
      });
    }
  });

  const pressurePenalty = applyPressurePenalty(session);
  if (effectToText(pressurePenalty.effects)) {
    const before = cloneStats(session.stats);
    applyEffects(session.stats, pressurePenalty.effects);
    const delta = statsDelta(before, session.stats);
    if (effectToText(delta)) {
      applied.push({
        day,
        optionLabel: pressurePenalty.text || "隐性压力触发连锁损耗。",
        impactText: effectToText(delta),
        delta,
      });
    }
  }
  const segmentPenalty = applySegmentRuleEffects(session, day);
  if (effectToText(segmentPenalty.effects)) {
    const before = cloneStats(session.stats);
    applyEffects(session.stats, segmentPenalty.effects);
    const delta = statsDelta(before, session.stats);
    if (effectToText(delta)) {
      applied.push({
        day,
        optionLabel: segmentPenalty.text || "阶段规则生效。",
        impactText: effectToText(delta),
        delta,
      });
    }
  }
  return applied;
}

function applySegmentRuleEffects(session, day) {
  const stage = resolveLonglineStage(session, Math.max(0, day - 1));
  const effects = { money: 0, energy: 0, mood: 0, reputation: 0, heat: 0 };
  let text = "";

  if (stage === 1) {
    if (session.stats.money <= 3) effects.money -= 1;
    if (session.stats.energy <= 4) effects.mood -= 1;
    text = "阶段规则：扩散期生活成本上浮，低现金/低体力额外吃损。";
  } else if (stage === 2) {
    if (session.stats.heat >= 6) {
      effects.reputation -= 1;
      effects.mood -= 1;
    }
    text = "阶段规则：舆论惯性生效，高热度会持续啃口碑和心态。";
  } else if (stage === 3) {
    if (session.stats.energy <= 4) {
      effects.energy -= 1;
      effects.mood -= 1;
    }
    text = "阶段规则：身体债务期，低体力会追加透支。";
  } else if (stage === 4) {
    if (session.stats.heat >= 7) {
      effects.reputation -= 1;
      effects.money += 1;
    }
    text = "阶段规则：热度现金共振，高曝光会带来收益也会磨损口碑。";
  } else if (stage === 5) {
    const load = session.pressure.debt + session.pressure.burnout + session.pressure.scrutiny;
    if (load >= 8) {
      const [weakStat] = weakestStat(session.stats);
      effects[weakStat] -= 1;
    }
    text = "阶段规则：摊牌期放大短板，综合压力过高将直接打击最弱属性。";
  }

  return { effects, text };
}

function resolveOptionOutcome(session, option) {
  const base = { ...(option.effects || {}) };
  const tag = option.tag || "other";
  const usage = session.tagUsage[tag] || 0;
  const pressure = session.pressure;
  const pressureLoad = pressure.debt + pressure.burnout + pressure.scrutiny;

  let failChance = 0.06;
  if (tag === "risk") failChance += 0.14;
  if (tag === "work") failChance += 0.08;
  if (tag === "social" || tag === "content") failChance += 0.1;
  failChance += usage * 0.03;
  failChance += Math.max(0, session.sameTagCount - 1) * 0.04;
  failChance += Math.min(0.12, pressureLoad * 0.01);
  failChance = Math.min(0.62, failChance);

  const jackpotChance = Math.max(0.03, 0.14 - usage * 0.015);
  const roll = session.random();

  const outcome = {
    effects: base,
    note: "",
  };

  if (roll < failChance) {
    const adjusted = { ...base };
    Object.keys(adjusted).forEach((key) => {
      if ((adjusted[key] || 0) > 0) adjusted[key] -= 1;
    });
    if (tag === "risk") {
      adjusted.money = (adjusted.money || 0) - 1;
      adjusted.reputation = (adjusted.reputation || 0) - 1;
    }
    if (tag === "work") {
      adjusted.energy = (adjusted.energy || 0) - 1;
      adjusted.mood = (adjusted.mood || 0) - 1;
    }
    if (tag === "social" || tag === "content") {
      adjusted.reputation = (adjusted.reputation || 0) - 1;
      adjusted.heat = (adjusted.heat || 0) + 1;
    }
    outcome.effects = adjusted;
    outcome.note = "（翻车）";
  } else if (roll > 1 - jackpotChance) {
    const adjusted = { ...base };
    if (tag === "risk" || tag === "work") adjusted.money = (adjusted.money || 0) + 1;
    if (tag === "social" || tag === "content") adjusted.reputation = (adjusted.reputation || 0) + 1;
    adjusted.mood = (adjusted.mood || 0) + 1;
    outcome.effects = adjusted;
    outcome.note = "（超常发挥）";
  }

  session.tagUsage[tag] = usage + 1;
  return outcome;
}

function buildAvatarConfig(random, seed, archetypeId) {
  const avatarSeed = `${seed}-${Math.floor(random() * 100000)}`;
  const stagePool = PIXEL_AVATAR_STAGE_POOLS[archetypeId] || PIXEL_AVATAR_STAGE_POOLS.office_worker;
  const baseUrl = randomPick(stagePool.early || [], random) || PIXEL_AVATAR_STAGE_POOLS.office_worker.early[0];
  return {
    style: "pixel",
    seed: avatarSeed,
    baseUrl,
    url: baseUrl,
  };
}

const DOLL_BADGES = {
  moodLow: "./assets/pixel/doll/badge-rain.svg",
  moodHigh: "./assets/pixel/doll/badge-spark.svg",
  energyLow: "./assets/pixel/doll/badge-zzz.svg",
  moneyLow: "./assets/pixel/doll/badge-coin-crack.svg",
  heatHigh: "./assets/pixel/doll/badge-fire.svg",
  sick: "./assets/pixel/doll/badge-bandage.svg",
  growth: "./assets/pixel/doll/badge-crown.svg",
};

const AVATAR_PROFILE_LABEL = {
  early: "新手期",
  mid: "进阶期",
  late: "成熟期",
  crisis: "危机期",
};

const AVATAR_RISK_LABEL = {
  cash_crunch: "现金告急",
  energy_burnout: "体力透支",
  mood_crash: "心态告警",
  reputation_fall: "口碑震荡",
  heat_overload: "热度过载",
};

function resolveEndingRiskLevel(session) {
  const values = [
    session.stats.money,
    session.stats.energy,
    session.stats.mood,
    session.stats.reputation,
    session.stats.heat,
  ];
  const weakest = Math.min(...values);
  const criticalCount = values.filter((v) => v <= 2).length;
  const warningCount = values.filter((v) => v <= 3).length;
  const pressureLoad = session.pressure.debt + session.pressure.burnout + session.pressure.scrutiny;

  if (weakest <= 0) return "collapse";
  if (weakest <= 1 || criticalCount >= 2 || pressureLoad >= 9) return "critical";
  if (weakest <= 2 || warningCount >= 3 || pressureLoad >= 6) return "warning";
  return "stable";
}

function resolveEndingRiskType(session) {
  const stats = session.stats;
  if (stats.heat >= 8 || session.pressure.scrutiny >= 4) return "heat_overload";
  if (stats.mood <= 2 || session.flags.burnout_risk) return "mood_crash";
  if (stats.energy <= 2 || session.pressure.burnout >= 4) return "energy_burnout";
  if (stats.money <= 2 || session.flags.debt_overhang || session.pressure.debt >= 4) return "cash_crunch";
  if (stats.reputation <= 2 || session.flags.trust_break) return "reputation_fall";

  const candidates = [
    { id: "cash_crunch", score: stats.money },
    { id: "energy_burnout", score: stats.energy },
    { id: "mood_crash", score: stats.mood },
    { id: "reputation_fall", score: stats.reputation },
    { id: "heat_overload", score: 10 - stats.heat },
  ];
  candidates.sort((a, b) => a.score - b.score);
  return candidates[0]?.id || "mood_crash";
}

function resolveAvatarProfile(session) {
  const day = session.dayIndex + 1;
  const stats = session.stats;
  const pressure = session.pressure;
  const riskLevel = resolveEndingRiskLevel(session);

  if (riskLevel === "collapse" || riskLevel === "critical") return "crisis";
  if (riskLevel === "warning") return "late";

  if (
    session.activeForcedEventId ||
    stats.energy <= 2 ||
    stats.money <= 1 ||
    pressure.burnout >= 4 ||
    pressure.debt >= 4 ||
    pressure.scrutiny >= 4 ||
    session.flags.burnout_risk ||
    session.flags.debt_overhang ||
    session.flags.trust_break
  ) {
    return "crisis";
  }
  if (day >= 45 || session.milestones.stability_reached) return "late";
  if (day >= 16 || Object.values(session.milestones).some(Boolean)) return "mid";
  return "early";
}

function buildAvatarPaperDoll(session) {
  const archetypePools = PIXEL_AVATAR_STAGE_POOLS[session.archetypeId] || PIXEL_AVATAR_STAGE_POOLS.office_worker;
  const profile = resolveAvatarProfile(session);
  const riskLevel = resolveEndingRiskLevel(session);
  const riskType = resolveEndingRiskType(session);
  const basePool = archetypePools[profile] || archetypePools.early || PIXEL_AVATAR_STAGE_POOLS.office_worker.early;
  const riskPool = PIXEL_AVATAR_RISK_POOLS[riskType] || [];
  const useRiskAvatar = riskLevel === "warning" || riskLevel === "critical" || riskLevel === "collapse";
  const selectedPool = useRiskAvatar && riskPool.length ? riskPool : basePool;
  const baseUrl = pickStableVariant(selectedPool, `${session.seed}|avatar|${session.archetypeId}|${profile}|${riskType}`);
  const overlays = [];
  const slots = new Set();
  const put = (slot, key) => {
    if (slots.has(slot)) return;
    const url = DOLL_BADGES[key];
    if (!url) return;
    slots.add(slot);
    overlays.push({ slot, url, key });
  };

  if (session.stats.mood <= 3) put("tl", "moodLow");
  else if (session.stats.mood >= 8) put("tl", "moodHigh");
  if (session.stats.energy <= 3) put("tr", "energyLow");
  if (session.stats.money <= 2) put("bl", "moneyLow");
  if (session.stats.heat >= 7) put("br", "heatHigh");
  if (session.flags.burnout_risk || session.activeForcedEventId) put("tr", "sick");
  if (riskLevel === "critical" || riskLevel === "collapse") put("top", "sick");
  if (session.milestones.stability_reached || session.milestones.public_figure) put("top", "growth");

  const stateTag = [profile, useRiskAvatar ? riskType : "normal", overlays.map((item) => `${item.slot}:${item.key}`).join(",")].join("|");

  return {
    seed: `${session.avatar.seed}|${stateTag}`,
    baseUrl,
    profile,
    profileLabel: useRiskAvatar
      ? `${AVATAR_PROFILE_LABEL[profile] || "生存期"}·${AVATAR_RISK_LABEL[riskType] || "压力态"}`
      : (AVATAR_PROFILE_LABEL[profile] || "生存期"),
    overlays,
  };
}

function drawTempSkills(random, count = 2, sourcePool = TEMP_SKILL_POOL) {
  const pool = [...sourcePool];
  const picks = [];
  const drawCount = Math.min(count, pool.length);
  for (let i = 0; i < drawCount; i += 1) {
    const idx = Math.floor(random() * pool.length);
    picks.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picks;
}

function drawFoodOffers(random, count = 2, sourcePool = FOOD_OPTIONS) {
  return drawTempSkills(random, count, sourcePool);
}

function getTempSkillPool(archetypeId) {
  if (archetypeId === "wang_saozhu") return WANG_SAOZHU_SKILL_POOL;
  return TEMP_SKILL_POOL;
}

function drawTempSkillsWithCooldown(random, count = 2, cooldownIds = [], sourcePool = TEMP_SKILL_POOL) {
  const cooldown = new Set(cooldownIds || []);
  const preferred = sourcePool.filter((item) => !cooldown.has(item.id));
  if (preferred.length >= count) {
    return drawTempSkills(
      random,
      count,
      preferred,
    );
  }
  const mixed = [...preferred, ...sourcePool.filter((item) => cooldown.has(item.id))];
  return drawTempSkills(random, count, mixed);
}

function pushSkillCooldown(session, offers) {
  const ids = offers.map((item) => item.id);
  const next = [...session.skillCooldownIds, ...ids];
  session.skillCooldownIds = next.slice(-4);
}

function chooseOpening(archetype, random) {
  const openingId = randomPick(archetype.openingIds, random);
  return OPENING_EVENTS[openingId] || OPENING_EVENTS.opening_rent_kpi;
}

function isConditionMatched(session, condition = null) {
  if (!condition) return true;
  const day = session.dayIndex + 1;
  if (typeof condition.minDay === "number" && day < condition.minDay) return false;
  if (typeof condition.maxDay === "number" && day > condition.maxDay) return false;

  if (Array.isArray(condition.flagsAll) && condition.flagsAll.some((f) => !session.flags[f])) return false;
  if (Array.isArray(condition.flagsAny) && condition.flagsAny.length && !condition.flagsAny.some((f) => session.flags[f])) return false;
  if (Array.isArray(condition.milestonesAll) && condition.milestonesAll.some((m) => !session.milestones[m])) return false;
  if (Array.isArray(condition.milestonesAny) && condition.milestonesAny.length && !condition.milestonesAny.some((m) => session.milestones[m])) return false;

  return true;
}

function getEventRepeatLimit(event) {
  if (typeof event.maxRepeats === "number") return event.maxRepeats;
  if (event.id.startsWith("opening_")) return 1;
  if (event.id.startsWith("incident_")) return 1;
  if (event.id.startsWith("growth_")) return 1;
  return 4;
}

function isEventSoftEligible(session, event) {
  if (!event) return false;
  if (!isConditionMatched(session, event.unlockWhen)) return false;
  const retireRule = event.retireWhen || EVENT_RETIRE_RULES[event.id];
  if (retireRule && isConditionMatched(session, retireRule)) return false;
  if (event.noRepeat && (session.eventSeenCount[event.id] || 0) >= 1) return false;
  return true;
}

function isEventStrictEligible(session, event) {
  if (!isEventSoftEligible(session, event)) return false;
  const seen = session.eventSeenCount[event.id] || 0;
  return seen < getEventRepeatLimit(event);
}

function pickFromPool(session, pool, fallbackEvent) {
  const strict = pool.filter((event) => isEventStrictEligible(session, event));
  const soft = pool.filter((event) => isEventSoftEligible(session, event));
  const eligible = strict.length ? strict : soft;
  const unseen = eligible.filter((event) => !session.usedEventIds.has(event.id));
  const candidates = unseen.length ? unseen : eligible;
  if (candidates.length) return randomPick(candidates, session.random);
  return isEventSoftEligible(session, fallbackEvent) ? fallbackEvent : null;
}

function updateMilestones(session) {
  const s = session.stats;
  const p = session.pressure;
  const day = session.dayIndex + 1;

  if (session.flags.debt_overhang || p.debt >= 4 || session.flags.debt_spiral) session.milestones.debt_veteran = true;
  if (session.flags.burnout_risk || p.burnout >= 4 || s.energy <= 2) session.milestones.burnout_veteran = true;
  if (session.flags.public_fight || session.flags.viral_path || s.heat >= 7) session.milestones.public_figure = true;
  if (day >= 10 && s.money >= 5 && s.mood >= 5 && s.energy >= 5) session.milestones.stability_reached = true;
}

function resolveGrowthEvent(session, dayIndex) {
  if (dayIndex <= 2) return null;
  if (dayIndex - session.lastGrowthDay < 3) return null;
  const pool = GROWTH_EVENT_POOL.filter((event) => isEventStrictEligible(session, event));
  if (!pool.length) return null;

  let chance = 0.14 + pool.length * 0.05;
  if (session.pressure.debt >= 3 || session.pressure.burnout >= 3 || session.pressure.scrutiny >= 3) chance += 0.08;
  chance = Math.min(0.56, chance);
  if (session.random() > chance) return null;

  const picked = randomPick(pool, session.random);
  session.lastGrowthDay = dayIndex;
  return picked;
}

function resolveCausalStageEvent(session, stageIndex) {
  const flags = session.flags;
  const s = session.stats;
  const pressure = session.pressure;

  if (flags.wang_line) {
    const wangPools = WANG_CHAPTER_POOLS[stageIndex];
    if (wangPools) {
      if (stageIndex === 1) {
        if (flags.grind_path || pressure.debt >= 2 || s.money <= 4) {
          return pickFromPool(session, wangPools.side, wangPools.side[0]);
        }
        if (flags.network_mode || flags.resource_swap) {
          return pickFromPool(session, wangPools.network, wangPools.network[0]);
        }
        return pickFromPool(session, wangPools.job, wangPools.job[0]);
      }

      if (stageIndex === 2) {
        if (flags.quality_risk || flags.debt_spiral || s.heat >= 6 || pressure.scrutiny >= 3) {
          return pickFromPool(session, wangPools.backlash, wangPools.backlash[0]);
        }
        return pickFromPool(session, wangPools.pressure, wangPools.pressure[0]);
      }

      if (stageIndex === 3) {
        if (s.energy <= 3 || flags.overwork_line || flags.burnout_risk || pressure.burnout >= 3) {
          return pickFromPool(session, wangPools.health, wangPools.health[0]);
        }
        return pickFromPool(session, wangPools.relation, wangPools.relation[0]);
      }

      if (stageIndex === 4) {
        if (s.heat >= 7 || flags.content_line || flags.public_fight || flags.viral_path) {
          return pickFromPool(session, wangPools.heat, wangPools.heat[0]);
        }
        return pickFromPool(session, wangPools.cash, wangPools.cash[0]);
      }

      if (flags.debt_spiral || s.money <= 2 || flags.trust_break || pressure.debt >= 3) {
        return pickFromPool(session, wangPools.debt, wangPools.debt[0]);
      }
      return pickFromPool(session, wangPools.pivot, wangPools.pivot[0]);
    }
  }

  if (stageIndex === 1) {
    if (flags.debt_line || pressure.debt >= 3) {
      return pickFromPool(session, CHAPTER_POOLS[1].debt, CHAPTER_POOLS[1].debt[0]);
    }
    return pickFromPool(session, CHAPTER_POOLS[1].work, CHAPTER_POOLS[1].work[0]);
  }

  if (stageIndex === 2) {
    if (flags.quality_risk || flags.debt_overhang || s.heat >= 6 || pressure.scrutiny >= 3) {
      return pickFromPool(session, CHAPTER_POOLS[2].backlash, CHAPTER_POOLS[2].backlash[0]);
    }
    return pickFromPool(session, CHAPTER_POOLS[2].stable, CHAPTER_POOLS[2].stable[0]);
  }

  if (stageIndex === 3) {
    if (s.energy <= 3 || flags.overwork_line || flags.burnout_risk || pressure.burnout >= 3) {
      return pickFromPool(session, CHAPTER_POOLS[3].health, CHAPTER_POOLS[3].health[0]);
    }
    return pickFromPool(session, CHAPTER_POOLS[3].relation, CHAPTER_POOLS[3].relation[0]);
  }

  if (stageIndex === 4) {
    if (s.heat >= 7 || flags.content_line || flags.public_fight || flags.viral_path) {
      return pickFromPool(session, CHAPTER_POOLS[4].heat, CHAPTER_POOLS[4].heat[0]);
    }
    return pickFromPool(session, CHAPTER_POOLS[4].cash, CHAPTER_POOLS[4].cash[0]);
  }

  if (flags.debt_spiral || s.money <= 2 || flags.trust_break || pressure.debt >= 3) {
    return pickFromPool(session, CHAPTER_POOLS[5].debt, CHAPTER_POOLS[5].debt[0]);
  }
  return pickFromPool(session, CHAPTER_POOLS[5].pivot, CHAPTER_POOLS[5].pivot[0]);
}

function resolveLonglineStage(session, dayIndex) {
  const day = dayIndex + 1;

  if (day <= 1) return 0;
  if (day <= 15) return 1;
  if (day <= 32) return 2;
  if (day <= 52) return 3;
  if (day <= 76) return 4;
  if (day <= TARGET_DAY) return 5;

  const pressure = session.pressure;
  if (pressure.debt >= pressure.burnout && pressure.debt >= pressure.scrutiny) return 5;
  if (pressure.burnout >= pressure.scrutiny) return 3;
  if (session.stats.heat >= 6 || pressure.scrutiny >= 3) return 4;
  return randomPick([3, 4, 5], session.random);
}

function resolveStateIncidentEvent(session, dayIndex) {
  if (dayIndex <= 0) return null;
  if (dayIndex - session.lastIncidentDay < 2) return null;

  const s = session.stats;
  const pressure = session.pressure;
  const pool = [];
  let riskCount = 0;

  if (s.money <= 3) {
    pool.push(...STATE_INCIDENT_POOLS.moneyLow);
    riskCount += 1;
  }
  if (s.mood <= 3) {
    pool.push(...STATE_INCIDENT_POOLS.moodLow);
    riskCount += 1;
  }
  if (s.energy <= 3) {
    pool.push(...STATE_INCIDENT_POOLS.energyLow);
    riskCount += 1;
  }
  if (s.reputation <= 3) {
    pool.push(...STATE_INCIDENT_POOLS.reputationLow);
    riskCount += 1;
  }
  if (s.heat >= 7) {
    pool.push(...STATE_INCIDENT_POOLS.heatHigh);
    riskCount += 1;
  }

  if (!pool.length) return null;

  let chance = 0.12 + riskCount * 0.12;
  if (pressure.debt >= 3 || pressure.burnout >= 3 || pressure.scrutiny >= 3) chance += 0.08;
  chance = Math.min(0.58, chance);
  if (session.random() > chance) return null;

  const fallback = pool[0];
  const incident = pickFromPool(session, pool, fallback);
  if (!incident) return null;
  session.lastIncidentDay = dayIndex;
  return incident;
}

function enqueueForcedEvent(session, eventId) {
  if (!FORCED_EVENTS[eventId]) return;
  if (session.activeForcedEventId === eventId) return;
  if (session.forcedEventQueue.includes(eventId)) return;
  session.forcedEventQueue.push(eventId);
}

function resolveForcedEvent(session) {
  if (session.activeForcedEventId) {
    return FORCED_EVENTS[session.activeForcedEventId] || null;
  }
  const nextId = session.forcedEventQueue.shift();
  if (!nextId) return null;
  session.activeForcedEventId = nextId;
  return FORCED_EVENTS[nextId] || null;
}

function resolveEvent(session, dayIndex) {
  if (dayIndex === 0) return session.openingEvent;
  const forced = resolveForcedEvent(session);
  if (forced) return forced;
  const milestone = resolveMilestoneEvent(session, dayIndex);
  if (milestone) return milestone;
  updateMilestones(session);
  const growth = resolveGrowthEvent(session, dayIndex);
  if (growth) return growth;
  const incident = resolveStateIncidentEvent(session, dayIndex);
  if (incident) return incident;
  const longlineStage = resolveLonglineStage(session, dayIndex);
  return resolveCausalStageEvent(session, longlineStage);
}

function resolveMilestoneEvent(session, dayIndex) {
  const day = dayIndex + 1;
  const event = MILESTONE_EVENTS[day];
  if (!event) return null;
  if (session.milestoneDone[event.id]) return null;
  return event;
}

function getCurrentEvent(session) {
  if (session.cachedEvent && session.cachedEventDayIndex === session.dayIndex) {
    return session.cachedEvent;
  }
  const event = resolveEvent(session, session.dayIndex);
  session.cachedEvent = event;
  session.cachedEventDayIndex = session.dayIndex;
  return event;
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
    ["money", stats.money],
    ["energy", stats.energy],
    ["mood", stats.mood],
    ["reputation", stats.reputation],
  ];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0];
}

function colloquialStatName(key) {
  const map = {
    money: "兜里余额",
    energy: "精力槽",
    mood: "情绪值",
    reputation: "口碑面子",
    heat: "围观热度",
  };
  return map[key] || key;
}

function endingByScore(score, alive) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  if (!alive) {
    return {
      id: "collapse",
      title: pick(["都市掉线线", "生活脱轨线", "现实失速线", "断电停摆线"]),
      subtitle: pick([
        "现实给你来了个强制下线。",
        "你这把被生活打成了观战席。",
        "这回合你被现实直接请出战场。",
        "城市节奏没停，但你先被甩下车了。",
      ]),
    };
  }
  if (score >= 42) {
    return {
      id: "legend",
      title: pick(["群聊样本线", "都市硬核线", "人间抗压线"]),
      subtitle: pick(["你活成了群里被转发的那种狠人。", "这局你把高压日常玩成了教学局。", "别人还在崩溃，你已经开始复盘方法论。"]),
    };
  }
  if (score >= 32) {
    return {
      id: "steady",
      title: pick(["稳住基本盘线", "节奏可控线", "日常续命线"]),
      subtitle: pick(["你没起飞，但也没让日子把你掀翻。", "在高压里稳住了自己的步频。", "这局不是爽文，但你把局面控住了。"]),
    };
  }
  return {
    id: "drift",
    title: pick(["随波硬撑线", "边走边补线", "磕绊求生线"]),
    subtitle: pick(["你一路缝缝补补，先把今天活过去。", "风浪还在，但你没有直接散架。", "这局不体面，但很真实。"]),
  };
}

const SIGNAL_VECTOR = {
  risk_seek: { riskCalibration: 1.5, horizonFocus: -0.7, executionDrive: 0.8 },
  risk_averse: { riskCalibration: -1.4, horizonFocus: 0.9, executionDrive: -0.3 },
  social_leverage: { socialDrive: 1.3, executionDrive: 0.3 },
  solo_drive: { socialDrive: -1.1, executionDrive: 0.7 },
  recovery_focus: { stressRecovery: 1.4, horizonFocus: 0.3 },
  overdrive: { stressRecovery: -1.3, executionDrive: 1.1 },
  long_term_plan: { horizonFocus: 1.4, riskCalibration: -0.3 },
  short_term_relief: { horizonFocus: -1.2, riskCalibration: 0.6 },
  boundary_setting: { stressRecovery: 1.0, socialDrive: -0.2, horizonFocus: 0.6 },
  execution_push: { executionDrive: 1.4, stressRecovery: -0.3 },
  execution_hold: { executionDrive: -1.0, stressRecovery: 0.4 },
};

const EVENT_OPTION_SIGNAL_MAP = new Map();

function inferOptionSignals(option, event = null) {
  const label = `${option?.label || ""} ${option?.id || ""} ${event?.title || ""} ${event?.chapter || ""}`;
  const tag = option?.tag || "";
  const effects = option?.effects || {};
  const signals = new Set();

  if (tag === "risk") signals.add("risk_seek");
  if (tag === "control") signals.add("risk_averse");
  if (tag === "network" || tag === "social") signals.add("social_leverage");
  if (tag === "work" || tag === "money") signals.add("execution_push");
  if ((tag === "work" || tag === "money") && !/(找|朋友|同事|合伙|协作|资源|代管|调停|私聊|求助)/.test(label)) {
    signals.add("solo_drive");
  }
  if (tag === "content") {
    signals.add("execution_push");
    signals.add("social_leverage");
  }
  if (tag === "rest") {
    signals.add("recovery_focus");
    signals.add("execution_hold");
  }
  if ((effects.energy || 0) <= -2 || (effects.mood || 0) <= -2) signals.add("overdrive");
  if ((effects.energy || 0) >= 2 || (effects.mood || 0) >= 2) signals.add("recovery_focus");
  if ((effects.money || 0) >= 2 && (effects.reputation || 0) < 0) signals.add("short_term_relief");
  if ((effects.money || 0) < 0 && (effects.reputation || 0) > 0) signals.add("long_term_plan");
  if (/(延|稳|预算|复查|观察|降温|止损|砍范围|边界|保质量|重排|复盘|节奏)/.test(label)) {
    signals.add("long_term_plan");
    signals.add("boundary_setting");
  }
  if (/(梭哈|直接|硬顶|硬扛|冲|跟投|对线|连更|蹭|爆|立刻)/.test(label)) {
    signals.add("risk_seek");
    signals.add("execution_push");
  }
  if (/(先拖|拖一拖|躲|隐瞒|应付|模板|认栽|讨赏|乞讨|卖艺|借新还旧)/.test(label)) signals.add("short_term_relief");
  if (/(私聊|找朋友|合伙|协作|资源|人情|求助)/.test(label)) signals.add("social_leverage");
  if (/(离线|休整|早睡|断网|散步|补眠|看病|门诊|躺平|冷处理|控频|降温|缓和)/.test(label)) {
    signals.add("recovery_focus");
    signals.add("execution_hold");
  }
  if (/(拒绝|中立|低调|停更|暂停|观望|慢一点|先回去)/.test(label)) signals.add("execution_hold");
  if (/(自己|独自|硬做|亲自|单干|单刷|solo|闷头|硬上|自扛)/.test(label)) signals.add("solo_drive");
  if (/(发帖|发梗|开播|吐槽|梗图|深夜长文|回击|热搜|挂平台|同城|整活)/.test(label)) signals.add("execution_push");

  return [...signals];
}

function indexEventOptionSignals() {
  EVENT_OPTION_SIGNAL_MAP.clear();
  const registerFromEvent = (event) => {
    if (!event || !Array.isArray(event.options)) return;
    event.options.forEach((option) => {
      if (!option?.id) return;
      const inferred = inferOptionSignals(option, event);
      option.signals = Array.isArray(option.signals) && option.signals.length
        ? Array.from(new Set([...option.signals, ...inferred]))
        : inferred;
      EVENT_OPTION_SIGNAL_MAP.set(option.id, option.signals);
    });
  };

  Object.values(OPENING_EVENTS).forEach(registerFromEvent);
  Object.values(FORCED_EVENTS).forEach(registerFromEvent);
  Object.values(MILESTONE_EVENTS).forEach(registerFromEvent);
  GROWTH_EVENT_POOL.forEach(registerFromEvent);
  Object.values(STATE_INCIDENT_POOLS).forEach((arr) => arr.forEach(registerFromEvent));

  Object.values(CHAPTER_POOLS).forEach((stage) => {
    Object.values(stage).forEach((arr) => arr.forEach(registerFromEvent));
  });
  Object.values(WANG_CHAPTER_POOLS).forEach((stage) => {
    Object.values(stage).forEach((arr) => arr.forEach(registerFromEvent));
  });
}

indexEventOptionSignals();

const PERSONALITY_DIMENSIONS = [
  {
    id: "riskCalibration",
    name: "风险校准",
    lowLabel: "稳健控盘型",
    highLabel: "高波动冲锋型",
    insight: "你在“稳住当下”和“放大波动”之间的取向。",
  },
  {
    id: "socialDrive",
    name: "社交驱动",
    lowLabel: "独立推进型",
    highLabel: "关系协同型",
    insight: "你更依赖个人硬扛，还是借助关系与公共场域推进。",
  },
  {
    id: "stressRecovery",
    name: "压力恢复",
    lowLabel: "透支硬顶型",
    highLabel: "弹性恢复型",
    insight: "高压下你是继续透支，还是主动修复节奏。",
  },
  {
    id: "horizonFocus",
    name: "规划视角",
    lowLabel: "短线止血型",
    highLabel: "长线经营型",
    insight: "你更偏向即时收益，还是愿意为后续稳定布局。",
  },
  {
    id: "executionDrive",
    name: "执行推进",
    lowLabel: "观望蓄力型",
    highLabel: "快推落地型",
    insight: "面对压力时你是先观察，还是先推进动作拿结果。",
  },
];

const TAG_DIMENSION_WEIGHTS = {
  risk: { riskCalibration: 2.0, horizonFocus: -1.0, stressRecovery: -0.5, executionDrive: 0.9 },
  control: { riskCalibration: -1.8, horizonFocus: 1.6, stressRecovery: 0.6, executionDrive: -0.8 },
  rest: { riskCalibration: -0.8, stressRecovery: 1.7, horizonFocus: 0.5 },
  work: { stressRecovery: -0.6, horizonFocus: 0.8, socialDrive: -0.4, executionDrive: 1.6 },
  network: { socialDrive: 1.8, horizonFocus: 0.4, executionDrive: 0.6 },
  social: { socialDrive: 1.6, riskCalibration: 0.5, executionDrive: 0.7 },
  content: { socialDrive: 0.9, riskCalibration: 1.2, stressRecovery: -0.7, executionDrive: 1.1 },
  money: { horizonFocus: -0.8, riskCalibration: 0.7, executionDrive: 0.8 },
};

const EFFECT_DIMENSION_WEIGHTS = {
  riskCalibration: { heat: 0.36, mood: -0.2, money: 0.12 },
  socialDrive: { reputation: 0.5, heat: 0.2, mood: 0.1 },
  stressRecovery: { mood: 0.58, energy: 0.52, heat: -0.12 },
  horizonFocus: { money: 0.55, energy: 0.24, mood: 0.16, heat: -0.1 },
  executionDrive: { money: 0.24, reputation: 0.24, energy: -0.18, mood: -0.08, heat: 0.08 },
};

const FLAG_DIMENSION_WEIGHTS = {
  debt_spiral: { riskCalibration: 1.2, horizonFocus: -0.9 },
  budget_mode: { horizonFocus: 1.0, riskCalibration: -0.5 },
  scope_control: { horizonFocus: 0.8, riskCalibration: -0.6 },
  overwork_line: { stressRecovery: -1.2, horizonFocus: -0.2, executionDrive: 1.0 },
  rest_recovery: { stressRecovery: 1.1 },
  public_fight: { riskCalibration: 1.1, socialDrive: 0.6 },
  network_mode: { socialDrive: 1.0, executionDrive: 0.4 },
  boundary_mode: { stressRecovery: 0.8, horizonFocus: 0.6 },
  viral_path: { riskCalibration: 1.0, socialDrive: 0.5, stressRecovery: -0.4, executionDrive: 0.8 },
  survival_route: { horizonFocus: 0.6, riskCalibration: -0.3, executionDrive: -0.5 },
  grind_path: { stressRecovery: -0.8, horizonFocus: -0.5, executionDrive: 0.9 },
  upgrade_route: { horizonFocus: 1.0, stressRecovery: -0.2, executionDrive: 0.8 },
  trust_break: { riskCalibration: 0.7, socialDrive: -0.9 },
};

function normalizeTraitScore(raw) {
  const scaled = Math.tanh(raw / 18) * 100;
  return Math.round(Math.max(-100, Math.min(100, scaled)));
}

function behaviorFactorByTag(tag) {
  if (tag === "skill") return 0.72;
  if (tag === "food") return 0.48;
  if (tag === "chain") return 0;
  return 1;
}

function computeEntryTraitImpact(entry, traitId) {
  if (!entry) return 0;
  const factor = behaviorFactorByTag(entry.tag);
  if (factor <= 0) return 0;

  const tagWeights = TAG_DIMENSION_WEIGHTS[entry.tag] || {};
  const tagImpact = (tagWeights[traitId] || 0) * factor;
  const ew = EFFECT_DIMENSION_WEIGHTS[traitId] || {};
  const delta = entry.delta || {};
  const effectImpact = (
    (delta.money || 0) * (ew.money || 0) +
    (delta.energy || 0) * (ew.energy || 0) +
    (delta.mood || 0) * (ew.mood || 0) +
    (delta.reputation || 0) * (ew.reputation || 0) +
    (delta.heat || 0) * (ew.heat || 0)
  ) * 0.38 * factor;
  const signalImpact = (entry.signals || [])
    .map((signal) => (SIGNAL_VECTOR[signal] || {})[traitId] || 0)
    .reduce((sum, value) => sum + value, 0) * 0.55 * factor;
  return tagImpact + effectImpact + signalImpact;
}

function buildPersonalityProfile(session, calibration = null) {
  const rawScores = Object.fromEntries(PERSONALITY_DIMENSIONS.map((item) => [item.id, 0]));
  const evidenceCount = Object.fromEntries(PERSONALITY_DIMENSIONS.map((item) => [item.id, 0]));

  const entries = session.history.filter((entry) => behaviorFactorByTag(entry.tag) > 0);
  entries.forEach((entry) => {
    PERSONALITY_DIMENSIONS.forEach((trait) => {
      const impact = computeEntryTraitImpact(entry, trait.id);
      rawScores[trait.id] += impact;
      if (Math.abs(impact) >= 0.55) evidenceCount[trait.id] += 1;
    });
  });

  Object.entries(session.flags || {}).forEach(([flag, enabled]) => {
    if (!enabled) return;
    const fw = FLAG_DIMENSION_WEIGHTS[flag];
    if (!fw) return;
    Object.entries(fw).forEach(([traitId, value]) => {
      rawScores[traitId] += value;
      if (Math.abs(value) >= 0.5) evidenceCount[traitId] += 1;
    });
  });

  const traitProfiles = PERSONALITY_DIMENSIONS.map((trait) => {
    const calibratedRaw = rawScores[trait.id] - ((calibration?.biasByArchetype?.[session.archetypeId]?.[trait.id] || 0) * 0.55);
    const score = normalizeTraitScore(calibratedRaw);
    const label = score >= 0 ? trait.highLabel : trait.lowLabel;
    const coverage = Math.min(1, evidenceCount[trait.id] / 10);
    const intensity = Math.min(1, Math.abs(score) / 68);
    const confidence = Math.round((coverage * 0.58 + intensity * 0.42) * 100);
    return {
      id: trait.id,
      name: trait.name,
      score,
      label,
      confidence,
      insight: trait.insight,
      evidenceCount: evidenceCount[trait.id],
    };
  });

  const dominant = [...traitProfiles]
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 2);
  const profileTitle = dominant.length >= 2 ? `${dominant[0].label} · ${dominant[1].label}` : (dominant[0]?.label || "观察中");
  const avgConfidence = Math.round(traitProfiles.reduce((sum, item) => sum + item.confidence, 0) / Math.max(1, traitProfiles.length));
  const totalEvidence = traitProfiles.reduce((sum, item) => sum + item.evidenceCount, 0);
  const lowConfidence = avgConfidence < 58 || totalEvidence < 22 || entries.length < 18;

  const evidenceLines = [];
  const used = new Set();
  dominant.forEach((trait) => {
    const top = [...entries]
      .map((entry) => ({ entry, impact: computeEntryTraitImpact(entry, trait.id) }))
      .filter((item) => Math.abs(item.impact) >= 0.7)
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .find((item) => {
        const key = `${item.entry.day}-${item.entry.optionId}`;
        if (used.has(key)) return false;
        used.add(key);
        return true;
      });
    if (top) {
      const direction = top.impact >= 0 ? "推高" : "拉低";
      evidenceLines.push(`Day ${top.entry.day}「${top.entry.optionLabel}」${direction}了「${trait.name}」。`);
    }
  });

  const tips = [];
  const risk = traitProfiles.find((t) => t.id === "riskCalibration")?.score || 0;
  const stress = traitProfiles.find((t) => t.id === "stressRecovery")?.score || 0;
  const horizon = traitProfiles.find((t) => t.id === "horizonFocus")?.score || 0;
  const execution = traitProfiles.find((t) => t.id === "executionDrive")?.score || 0;
  if (risk >= 35 && stress <= -10) tips.push("你偏高波动但恢复偏弱，建议在连续两次高风险后强制插入恢复日。");
  if (horizon <= -20) tips.push("你更偏短线止血，建议在每个里程碑前至少做一次长线投入选择。");
  if (risk <= -25 && horizon >= 25) tips.push("你策略很稳，偶尔可在优势局试一次可控风险，提升上限。");
  if (execution >= 35 && stress <= 0) tips.push("你的推进欲强于恢复速度，建议每 3 天安排 1 天低负载回收。");
  if (execution <= -25 && horizon >= 10) tips.push("你规划很清晰但动作偏慢，可以设置“当日最小行动”避免机会滑走。");
  if (!tips.length) tips.push("你的策略较均衡，下局重点观察最弱属性触发前 3 天的决策节奏。");

  return {
    version: "persona-v1",
    framework: "behavioral-traits",
    title: profileTitle,
    confidence: avgConfidence,
    lowConfidence,
    sample: {
      behaviorEntries: entries.length,
      totalEvidence,
      totalHistory: session.history.length,
      calibrated: Boolean(calibration?.biasByArchetype),
      calibrationSamples: Number(calibration?.samplesPerArchetype) || 0,
    },
    note: lowConfidence
      ? "样本不足或波动过高，本次仅展示倾向观察，不建议做定型判断。"
      : "基于本局行为证据生成，不等同临床或正式心理测评。",
    traits: traitProfiles,
    evidence: evidenceLines.slice(0, 3),
    tips: tips.slice(0, 2),
  };
}

const PERSONA_CALIBRATION_VERSION = "persona-cal-v2";
const PERSONA_CALIBRATION_STORAGE_KEY = "persona-calibration-cache-v2";
let personaCalibrationCache = null;

function pickOptionForCalibration(session, options) {
  const sorted = [...options].sort((a, b) => {
    const effectA = (a.effects?.money || 0) + (a.effects?.energy || 0) + (a.effects?.mood || 0) + (a.effects?.reputation || 0);
    const effectB = (b.effects?.money || 0) + (b.effects?.energy || 0) + (b.effects?.mood || 0) + (b.effects?.reputation || 0);
    return effectB - effectA;
  });
  if (session.random() < 0.55) return sorted[0];
  return sorted[Math.floor(session.random() * sorted.length)];
}

function simulateChoiceOnSession(session, option) {
  const event = getCurrentEvent(session);
  if (!event || !option) return false;
  const resolved = resolveOptionOutcome(session, option);
  const finalEffects = resolved.effects;
  const before = cloneStats(session.stats);
  applyEffects(session.stats, finalEffects);
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
    optionLabel: `${option.label}${resolved.note}`,
    tag: option.tag,
    signals: option.signals || EVENT_OPTION_SIGNAL_MAP.get(option.id) || [],
    impactText: effectToText(statsDelta(before, after)),
    delta: statsDelta(before, after),
  });
  session.usedEventIds.add(event.id);
  session.eventSeenCount[event.id] = (session.eventSeenCount[event.id] || 0) + 1;
  if (event.id.startsWith("milestone_")) session.milestoneDone[event.id] = true;
  updatePressureFromAction(session, option, finalEffects);
  scheduleDelayedConsequence(session, event, option);
  if (event.id.startsWith("forced_")) session.activeForcedEventId = "";
  const chainEntries = applyEndOfDayConsequences(session);
  chainEntries.forEach((item) => {
    session.history.push({
      day: item.day,
      eventId: "chain_effect",
      eventTitle: "因果链回收",
      optionId: "chain_auto",
      optionLabel: item.optionLabel,
      tag: "chain",
      signals: [],
      impactText: item.impactText,
      delta: item.delta,
    });
  });
  const upkeepEntries = applyDailyUpkeep(session);
  upkeepEntries.forEach((item) => {
    session.history.push({
      day: item.day,
      eventId: "daily_upkeep",
      eventTitle: "日常消耗",
      optionId: "daily_upkeep",
      optionLabel: item.optionLabel,
      tag: "chain",
      signals: [],
      impactText: item.impactText,
      delta: item.delta,
    });
  });
  const dead = [session.stats.money, session.stats.energy, session.stats.mood, session.stats.reputation].some((v) => v <= 0);
  if (!dead) {
    session.dayIndex += 1;
    session.cachedEvent = null;
    session.cachedEventDayIndex = -1;
  }
  return !dead;
}

function runPersonaCalibration() {
  const archetypes = STARTER_ARCHETYPES.map((item) => item.id);
  const traitIds = PERSONALITY_DIMENSIONS.map((item) => item.id);
  const sums = Object.fromEntries(archetypes.map((id) => [id, Object.fromEntries(traitIds.map((tid) => [tid, 0]))]));
  const counts = Object.fromEntries(archetypes.map((id) => [id, 0]));
  const samplesPerArchetype = 18;
  const maxCalibrationDays = 55;

  archetypes.forEach((archetypeId, i) => {
    for (let k = 0; k < samplesPerArchetype; k += 1) {
      const seed = 700000 + i * 1000 + k;
      const session = createSession(seed, { forceArchetypeId: archetypeId });
      session.mode = "playing";
      let safety = 0;
      while (safety < maxCalibrationDays) {
        safety += 1;
        const event = getCurrentEvent(session);
        if (!event?.options?.length) break;
        const option = pickOptionForCalibration(session, event.options);
        const alive = simulateChoiceOnSession(session, option);
        if (!alive) break;
      }
      const profile = buildPersonalityProfile(session, null);
      profile.traits.forEach((trait) => {
        sums[archetypeId][trait.id] += trait.score;
      });
      counts[archetypeId] += 1;
    }
  });

  const avgByArchetype = {};
  const globalAvg = Object.fromEntries(traitIds.map((tid) => [tid, 0]));
  let archetypeN = 0;
  archetypes.forEach((id) => {
    const c = Math.max(1, counts[id]);
    avgByArchetype[id] = {};
    traitIds.forEach((tid) => {
      avgByArchetype[id][tid] = sums[id][tid] / c;
      globalAvg[tid] += avgByArchetype[id][tid];
    });
    archetypeN += 1;
  });
  traitIds.forEach((tid) => {
    globalAvg[tid] /= Math.max(1, archetypeN);
  });

  const biasByArchetype = {};
  archetypes.forEach((id) => {
    biasByArchetype[id] = {};
    traitIds.forEach((tid) => {
      biasByArchetype[id][tid] = avgByArchetype[id][tid] - globalAvg[tid];
    });
  });

  return {
    version: PERSONA_CALIBRATION_VERSION,
    samplesPerArchetype,
    maxCalibrationDays,
    generatedAt: new Date().toISOString(),
    biasByArchetype,
  };
}

function getPersonaCalibration() {
  if (personaCalibrationCache) return personaCalibrationCache;
  try {
    const saved = localStorage.getItem(PERSONA_CALIBRATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.version === PERSONA_CALIBRATION_VERSION && parsed?.biasByArchetype) {
        personaCalibrationCache = parsed;
        return personaCalibrationCache;
      }
    }
  } catch {}

  personaCalibrationCache = runPersonaCalibration();
  try {
    localStorage.setItem(PERSONA_CALIBRATION_STORAGE_KEY, JSON.stringify(personaCalibrationCache));
  } catch {}
  return personaCalibrationCache;
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

  const [weakStatKey, weakValue] = weakestStat(session.stats);
  const weakName = colloquialStatName(weakStatKey);
  const riskChoices = session.history.filter((entry) => entry.tag === "risk").length;
  const chainHits = session.history.filter((entry) => entry.tag === "chain").length;
  const failCount = session.history.filter((entry) => (entry.optionLabel || "").includes("翻车")).length;
  const bullets = [];

  if (!alive) {
    bullets.push(`触发失败条件：${weakName}跌到 ${weakValue}。`);
  } else {
    bullets.push(`最终短板：${weakName}仅 ${weakValue}，是你最危险的维度。`);
  }

  const losses = [
    ["money", totals.money],
    ["energy", totals.energy],
    ["mood", totals.mood],
    ["reputation", totals.reputation],
  ]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map((item) => `${colloquialStatName(item[0])}${item[1] > 0 ? "+" : ""}${item[1]}`)
    .join("、");
  bullets.push(`整局主要损耗：${losses}。`);

  if (riskChoices >= 2) bullets.push(`你本局做了 ${riskChoices} 次高风险选择，波动明显变大。`);
  if (failCount >= 2) bullets.push(`有 ${failCount} 次选择临场翻车，原本收益被现实打折。`);
  if (chainHits >= 3) bullets.push(`累计触发 ${chainHits} 次延迟连锁后果，节奏被不断反噬。`);
  if (worstDay) bullets.push(`关键转折：Day ${worstDay.day}「${worstDay.eventTitle}」选择「${worstDay.optionLabel}」。`);
  if (session.sameTagCount >= 3) bullets.push("连续同风格决策触发疲劳惩罚（情绪值/口碑面子下降）。");

  const impactAbs = (entry) => {
    const d = entry.delta || {};
    return Math.abs(d.money || 0) + Math.abs(d.energy || 0) + Math.abs(d.mood || 0) + Math.abs(d.reputation || 0) + Math.abs(d.heat || 0);
  };
  const negativeImpact = (entry) => {
    const d = entry.delta || {};
    return Math.abs(Math.min(0, d.money || 0)) + Math.abs(Math.min(0, d.energy || 0)) + Math.abs(Math.min(0, d.mood || 0)) + Math.abs(Math.min(0, d.reputation || 0));
  };
  const positiveImpact = (entry) => {
    const d = entry.delta || {};
    return Math.max(0, d.money || 0) + Math.max(0, d.energy || 0) + Math.max(0, d.mood || 0) + Math.max(0, d.reputation || 0);
  };
  const asReviewLine = (entry) => `Day ${entry.day}「${entry.eventTitle}」->「${entry.optionLabel}」(${entry.impactText || "无变化"})`;

  const topNodes = [...session.history]
    .filter((entry) => impactAbs(entry) > 0)
    .sort((a, b) => impactAbs(b) - impactAbs(a))
    .slice(0, 3)
    .map(asReviewLine);

  const scoredDecisions = [...session.history]
    .filter((entry) => entry.tag !== "chain" && entry.tag !== "skill")
    .map((entry) => ({
      entry,
      score: alive ? positiveImpact(entry) : negativeImpact(entry),
    }))
    .filter((item) => item.score > 0);
  const topDecisions = (scoredDecisions.length ? scoredDecisions : [...session.history].map((entry) => ({ entry, score: impactAbs(entry) })))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => asReviewLine(item.entry));

  const first = session.history[0];
  const pivot = worstDay || session.history[Math.floor(session.history.length / 2)];
  const last = session.history[session.history.length - 1];
  const chainSummary = first && pivot && last
    ? `Day ${first.day}「${first.eventTitle}」 -> Day ${pivot.day}「${pivot.eventTitle}」 -> Day ${last.day} 结算。`
    : "本局关键链路不足，无法提炼摘要。";

  return {
    weakest: { name: weakName, value: weakValue },
    keyDay: worstDay ? worstDay.day : null,
    bullets,
    nextRunTips: buildNextRunTips(session, weakStatKey),
    review: {
      topNodes,
      topDecisions,
      chainSummary,
    },
  };
}

function buildNextRunTips(session, weakStatKey) {
  const tips = [];
  const riskChoices = session.history.filter((entry) => entry.tag === "risk").length;
  const chainHits = session.history.filter((entry) => entry.tag === "chain").length;
  const moneyLoss = session.history.reduce((sum, entry) => sum + Math.min(0, entry.delta?.money || 0), 0);
  const energyLoss = session.history.reduce((sum, entry) => sum + Math.min(0, entry.delta?.energy || 0), 0);

  if (weakStatKey === "money" || moneyLoss <= -8) {
    tips.push("前 20 天优先保现金流，少选“短期爽快但后续补票”的路线。");
  }
  if (weakStatKey === "energy" || energyLoss <= -8) {
    tips.push("体力低于 4 时优先恢复，不要连续两天硬扛输出。");
  }
  if (weakStatKey === "mood") {
    tips.push("心态线掉到 4 以下就插入稳态选项，别让舆论线连环触发。");
  }
  if (weakStatKey === "reputation") {
    tips.push("人设低时少做高热度对线，优先用控场流和关系流修复口碑。");
  }
  if (riskChoices >= 3) {
    tips.push("高风险决策每两天最多一次，给延迟后果留缓冲窗口。");
  }
  if (chainHits >= 4) {
    tips.push("当延迟后果频繁出现时，立刻切到保守节奏至少 2 天。");
  }

  tips.push("25/50/75 天里程碑优先补短板，不要继续放大当前最弱属性。");

  return tips.slice(0, 3);
}

function buildShareLink() {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.search = "";
  return url.toString();
}

function sanitizeShareLine(text = "", maxLen = 64) {
  const cleaned = String(text)
    .replace(/[*_`~#>\[\]\(\)]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen - 1)}…` : cleaned;
}

function extractPoemLine(story = "") {
  const lines = String(story)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const hit = lines.find((line) => /正所谓[:：]/.test(line));
  return hit ? sanitizeShareLine(hit, 90) : "";
}

function buildSharePayload() {
  const result = state.session.result;
  if (!result) return null;
  const avatarPaperDoll = buildAvatarPaperDoll(state.session);
  const reason = sanitizeShareLine(result.reason?.bullets?.[0] || "", 80);
  const nextTip = sanitizeShareLine((result.reason?.nextRunTips || [])[0] || "", 80);
  const poem = extractPoemLine(result.storyNarrative || "");
  const topDecision = sanitizeShareLine((result.reason?.review?.topDecisions || [])[0] || "", 72);
  return {
    v: 2,
    title: result.ending?.title || "本局结局",
    subtitle: result.ending?.subtitle || "",
    score: result.score || 0,
    days: result.daysSurvived || 0,
    avatarUrl: avatarPaperDoll.baseUrl || state.session.avatar?.baseUrl || state.session.avatar?.url || "",
    role: state.session.archetypeName || "都市求生者",
    reason,
    nextTip,
    topDecision,
    poem,
  };
}

function buildSharePreviewLink() {
  if (typeof window === "undefined") return "";
  const payload = buildSharePayload();
  if (!payload) return buildShareLink();
  const url = new URL(window.location.href);
  url.pathname = "/api/share";
  url.searchParams.set("d", encodeURIComponent(JSON.stringify(payload)));
  return url.toString();
}

function applyDailyUpkeep(session) {
  const effects = { money: -1, energy: -1, mood: 0, reputation: 0, heat: 0 };
  if (session.stats.money <= 2) effects.mood -= 1;
  if (session.stats.heat >= 8) effects.mood -= 1;

  const before = cloneStats(session.stats);
  applyEffects(session.stats, effects);
  const delta = statsDelta(before, session.stats);
  const logs = [];
  if (effectToText(delta)) {
    logs.push({
      day: session.dayIndex + 1,
      optionLabel: "日常消耗：房租、通勤、吃喝和精神负担自动结算。",
      impactText: effectToText(delta),
      delta,
    });
  }

  if (session.stats.energy <= 2) {
    let sickChance = session.stats.energy <= 1 ? 0.65 : 0.35;
    if (session.flags.burnout_risk || session.pressure.burnout >= 3) sickChance += 0.1;
    if (session.random() < Math.min(0.85, sickChance)) {
      const heavy = session.stats.energy <= 1 || session.pressure.burnout >= 4;
      enqueueForcedEvent(session, heavy ? "forced_sick_heavy" : "forced_sick_mild");
      logs.push({
        day: session.dayIndex + 1,
        optionLabel: "后果预告：体力过低，明天可能进入看病强制事件。",
        impactText: "已写入因果链",
        delta: { money: 0, energy: 0, mood: 0, reputation: 0, heat: 0 },
      });
    }
  }

  if (session.stats.money <= 1) {
    const cashChance = session.stats.money === 0 ? 0.45 : 0.25;
    if (session.random() < cashChance) {
      enqueueForcedEvent(session, "forced_cash_crunch");
    }
  }
  return logs;
}

function createSession(seed = Date.now(), options = {}) {
  const random = seededRandom(seed);
  const forcedArchetype = STARTER_ARCHETYPES.find((item) => item.id === options.forceArchetypeId);
  const archetype = forcedArchetype || randomPick(STARTER_ARCHETYPES, random);
  const openingEvent = chooseOpening(archetype, random);
  const avatar = buildAvatarConfig(random, seed, archetype.id);
  const skillPool = getTempSkillPool(archetype.id);
  const base = archetype.baseStats;

  const jitter = () => (random() < 0.5 ? -1 : 1);
  const skillOffers = drawTempSkillsWithCooldown(random, 2, [], skillPool);
  const foodOffers = drawFoodOffers(random, 2, FOOD_OPTIONS);
  return {
    seed,
    random,
    avatar,
    archetypeId: archetype.id,
    archetypeName: archetype.name,
    openingEvent,
    dayIndex: 0,
    mode: "intro",
    stats: {
      money: clamp(base.money + jitter(), 2, 10),
      energy: clamp(base.energy + jitter(), 2, 10),
      mood: clamp(base.mood + jitter(), 2, 10),
      reputation: clamp(base.reputation + jitter(), 2, 10),
      heat: clamp(base.heat + (random() < 0.5 ? 0 : 1), 0, 10),
    },
    flags: {},
    pressure: { debt: 0, burnout: 0, scrutiny: 0 },
    milestones: {},
    milestoneDone: {},
    eventSeenCount: {},
    tagUsage: {},
    pendingConsequences: [],
    forcedEventQueue: [],
    activeForcedEventId: "",
    usedEventIds: new Set([openingEvent.id]),
    skillOffers,
    foodOffers,
    skillCooldownIds: skillOffers.map((item) => item.id),
    skillUsedDay: false,
    foodUsedDay: false,
    cachedEvent: null,
    cachedEventDayIndex: -1,
    history: [],
    sameTagCount: 0,
    lastIncidentDay: -10,
    lastGrowthDay: -10,
    lastTag: null,
    result: null,
  };
}

const state = {
  session: createSession(20260227),
  bestScore: Number(localStorage.getItem(STORAGE_KEY) || 0),
  notice: "",
  endingUi: {
    restartLockUntil: 0,
    restartConfirmUntil: 0,
  },
};
let noticeTimer = null;

const root = document.querySelector("#app");

async function generateStoryNarrative() {
  const result = state.session.result;
  if (!result) return;

  const payload = {
    history: state.session.history,
    stats: state.session.stats,
    ending: result.ending,
    daysSurvived: result.daysSurvived,
    targetDay: TARGET_DAY,
    reasonBullets: result.reason?.bullets || [],
    review: result.reason?.review || {},
    personality: {
      title: result.personality?.title || "",
      confidence: result.personality?.confidence || 0,
      lowConfidence: Boolean(result.personality?.lowConfidence),
      note: result.personality?.note || "",
      sample: result.personality?.sample || {},
      traits: (result.personality?.traits || []).map((item) => ({
        id: item.id,
        name: item.name,
        score: item.score,
        label: item.label,
        confidence: item.confidence,
      })),
      evidence: result.personality?.evidence || [],
      tips: result.personality?.tips || [],
    },
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
      if (okData.persona && typeof okData.persona === "object") {
        result.personality = {
          ...result.personality,
          llm: {
            title: String(okData.persona.title || ""),
            summary: String(okData.persona.summary || ""),
            lowConfidenceNote: String(okData.persona.lowConfidenceNote || ""),
            traitComments: Array.isArray(okData.persona.traitComments) ? okData.persona.traitComments : [],
            tips: Array.isArray(okData.persona.tips) ? okData.persona.tips : [],
          },
        };
      }
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
  const personality = buildPersonalityProfile(state.session, getPersonaCalibration());
  const daysSurvived = state.session.dayIndex + 1;

  state.session.mode = "ended";
  state.session.result = {
    alive,
    daysSurvived,
    score,
    ending,
    reason,
    personality,
    storyNarrative: "",
    storyLoading: true,
    storyError: "",
  };

  state.bestScore = Math.max(state.bestScore, score);
  localStorage.setItem(STORAGE_KEY, String(state.bestScore));
  state.endingUi.restartLockUntil = Date.now() + 1200;
  state.endingUi.restartConfirmUntil = 0;
  setNotice("本局已结算，确认后可开启新一局");

  generateStoryNarrative();
}

function applyOptionMeta(session, option) {
  (option.setFlags || []).forEach((flag) => {
    session.flags[flag] = true;
  });
  (option.clearFlags || []).forEach((flag) => {
    delete session.flags[flag];
  });
}

function applyChoice(optionId) {
  const session = state.session;
  if (session.mode !== "playing") return;

  const event = getCurrentEvent(session);
  const option = event.options.find((item) => item.id === optionId);
  if (!option) return;
  const resolved = resolveOptionOutcome(session, option);
  const finalEffects = resolved.effects;

  const before = cloneStats(session.stats);
  applyEffects(session.stats, finalEffects);
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
    optionLabel: `${option.label}${resolved.note}`,
    tag: option.tag,
    signals: option.signals || EVENT_OPTION_SIGNAL_MAP.get(option.id) || [],
    impactText: effectToText(statsDelta(before, after)),
    delta: statsDelta(before, after),
  });
  session.usedEventIds.add(event.id);
  session.eventSeenCount[event.id] = (session.eventSeenCount[event.id] || 0) + 1;
  if (event.id.startsWith("milestone_")) {
    session.milestoneDone[event.id] = true;
    setNotice("里程碑已结算：后续阶段节奏已更新");
  }
  updatePressureFromAction(session, option, finalEffects);
  scheduleDelayedConsequence(session, event, option);
  if (event.id.startsWith("forced_")) {
    session.activeForcedEventId = "";
  }
  const chainEntries = applyEndOfDayConsequences(session);
  chainEntries.forEach((item) => {
    session.history.push({
      day: item.day,
      eventId: "chain_effect",
      eventTitle: "因果链回收",
      optionId: "chain_auto",
      optionLabel: item.optionLabel,
      tag: "chain",
      impactText: item.impactText,
      delta: item.delta,
    });
  });
  const upkeepEntries = applyDailyUpkeep(session);
  upkeepEntries.forEach((item) => {
    session.history.push({
      day: item.day,
      eventId: "daily_upkeep",
      eventTitle: "日常消耗",
      optionId: "daily_upkeep",
      optionLabel: item.optionLabel,
      tag: "chain",
      impactText: item.impactText,
      delta: item.delta,
    });
  });

  const dead = [session.stats.money, session.stats.energy, session.stats.mood, session.stats.reputation].some((v) => v <= 0);
  if (dead) {
    finishSession(false);
    return;
  }

  session.dayIndex += 1;
  session.cachedEvent = null;
  session.cachedEventDayIndex = -1;
  const skillPool = getTempSkillPool(session.archetypeId);
  session.skillOffers = drawTempSkillsWithCooldown(session.random, 2, session.skillCooldownIds, skillPool);
  session.foodOffers = drawFoodOffers(session.random, 2, FOOD_OPTIONS);
  pushSkillCooldown(session, session.skillOffers);
  session.skillUsedDay = false;
  session.foodUsedDay = false;
}

function useSkill(skillId) {
  const session = state.session;
  if (session.mode !== "playing") return;
  if (session.skillUsedDay) return;
  const skill = session.skillOffers.find((item) => item.id === skillId);
  if (!skill) return;

  const before = cloneStats(session.stats);
  applyEffects(session.stats, skill.effects);
  session.skillUsedDay = true;
  const after = cloneStats(session.stats);

  session.history.push({
    day: session.dayIndex + 1,
    eventId: "skill_use",
    eventTitle: `临时技能：${skill.name}`,
    optionId: skill.id,
    optionLabel: skill.name,
    tag: "skill",
    signals: inferOptionSignals({ id: skill.id, label: skill.name, tag: "work", effects: skill.effects }, { title: "技能使用", chapter: "技能" }),
    impactText: effectToText(statsDelta(before, after)),
    delta: statsDelta(before, after),
  });

  const dead = [session.stats.money, session.stats.energy, session.stats.mood, session.stats.reputation].some((v) => v <= 0);
  if (dead) finishSession(false);
}

function buyFood(foodId) {
  const session = state.session;
  if (session.mode !== "playing") return;
  if (session.foodUsedDay) {
    setNotice("今天已经吃过了");
    return;
  }
  const food = (session.foodOffers || []).find((item) => item.id === foodId);
  if (!food) return;
  const cost = Math.abs(food.effects.money || 0);
  if (session.stats.money < cost) {
    setNotice("现金不够，买不起这个");
    return;
  }

  const before = cloneStats(session.stats);
  applyEffects(session.stats, food.effects);
  const after = cloneStats(session.stats);
  session.foodUsedDay = true;

  session.history.push({
    day: session.dayIndex + 1,
    eventId: "food_use",
    eventTitle: `补给：${food.name}`,
    optionId: food.id,
    optionLabel: food.name,
    tag: "food",
    signals: inferOptionSignals({ id: food.id, label: food.name, tag: "rest", effects: food.effects }, { title: "补给购买", chapter: "补给" }),
    impactText: effectToText(statsDelta(before, after)),
    delta: statsDelta(before, after),
  });
  setNotice(`已补给：${food.name}`);
}

function startNew(seed = Date.now()) {
  state.session = createSession(seed);
  state.session.mode = "playing";
  state.endingUi.restartLockUntil = 0;
  state.endingUi.restartConfirmUntil = 0;
}

function shareText() {
  const result = state.session.result;
  if (!result) return "";
  const shareLink = buildSharePreviewLink();
  const reason = sanitizeShareLine(result.reason?.bullets?.[0] || "这一局主要是被连续连锁后果反噬。", 90);
  const nextTip = sanitizeShareLine((result.reason?.nextRunTips || [])[0] || "下局先稳住现金和体力，再考虑热度。", 90);
  const keyDecision = sanitizeShareLine((result.reason?.review?.topDecisions || [])[0] || "", 90);
  const personaTitle = sanitizeShareLine(result.personality?.llm?.title || result.personality?.title || "", 70);
  const poem = extractPoemLine(result.storyNarrative || "");
  return [
    `我在《是男人就坚持100天》硬扛了 ${result.daysSurvived} 天，结局：${result.ending.title}`,
    `本局画像：${state.session.archetypeName}｜当前分 ${result.score}`,
    personaTitle ? `行为画像：${personaTitle}` : "行为画像：样本不足，继续再跑一局。",
    `翻车主因：${reason}`,
    `下局建议：${nextTip}`,
    keyDecision ? `关键一手：${keyDecision}` : "关键一手：这局每一步都在给后续埋雷。",
    poem || "正所谓：山重水复疑无路，柳暗花明又一村。",
    shareLink ? `分享链接：${shareLink}` : "分享链接生成失败",
    "#是男人就坚持100天 #都市生存挑战",
  ].join("\n");
}

function buildView() {
  const session = state.session;
  const event = session.mode === "playing" ? getCurrentEvent(session) : null;
  const score = computeScore(session);
  const avatar = buildAvatarPaperDoll(session);

  return {
    mode: session.mode,
    day: session.dayIndex + 1,
    dayTarget: TARGET_DAY,
    reachedTarget: session.dayIndex + 1 >= TARGET_DAY,
    profileName: session.archetypeName,
    avatar,
    bestScore: state.bestScore,
    score,
    stats: { ...session.stats },
    event:
      session.mode === "playing"
        ? {
            id: event.id,
            isMilestone: event.id.startsWith("milestone_"),
            chapter: event.chapter,
            title: event.title,
            text: event.text,
            causeText: event.causeText,
            options: event.options.map((option) => ({ ...option, impactText: effectToText(option.effects) })),
          }
        : null,
    skills: {
      usedToday: session.skillUsedDay,
      offers: session.skillOffers.map((item) => ({
        id: item.id,
        name: item.name,
        icon: pickStableVariant(
          SKILL_ICON_VARIANTS[item.id] || SKILL_ICON_VARIANTS.default,
          `${session.seed}|skill|${item.id}|day-${session.dayIndex + 1}`
        ),
        text: item.text,
        impactText: effectToText(item.effects),
      })),
    },
    foodShop: {
      usedToday: session.foodUsedDay,
      options: (session.foodOffers || []).map((item) => ({
        id: item.id,
        name: item.name,
        icon: pickStableVariant(
          FOOD_ICON_VARIANTS[item.id] || FOOD_ICON_VARIANTS.default,
          `${session.seed}|food|${item.id}|day-${session.dayIndex + 1}`
        ),
        text: item.text,
        impactText: effectToText(item.effects),
        affordable: session.stats.money >= Math.abs(item.effects.money || 0),
      })),
    },
    history: session.history.slice(-6),
    result: session.result,
    shareText: shareText(),
    notice: state.notice,
    runtimeMode: "frontend_event_mainline",
    endingUi: {
      restartLocked: Date.now() < state.endingUi.restartLockUntil,
      restartConfirm: Date.now() < state.endingUi.restartConfirmUntil,
    },
  };
}

function refresh() {
  ui.render(buildView());
}

function copyShare() {
  const text = shareText();
  if (!text) return;
  const writePromise = navigator.clipboard?.writeText?.(text);
  if (!writePromise) {
    window.prompt("复制这段分享文案", text);
    setNotice("已打开复制窗口");
    return;
  }
  writePromise
    .then(() => setNotice("分享文案已复制"))
    .catch(() => {
      window.prompt("复制这段分享文案", text);
      setNotice("已打开复制窗口");
    });
}

async function wechatShare() {
  const result = state.session.result;
  if (!result) return;
  const url = buildSharePreviewLink();
  const title = `我在《是男人就坚持100天》扛了 ${result.daysSurvived} 天`;
  const text = `结局：${result.ending.title}｜分数 ${result.score}｜${sanitizeShareLine(result.reason?.bullets?.[0] || "这局后劲很大。", 28)}`;
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      setNotice("已唤起系统分享面板");
      return;
    }
  } catch {
    // ignore and fallback
  }
  const writePromise = navigator.clipboard?.writeText?.(url);
  if (!writePromise) {
    window.prompt("复制这个分享链接", url);
    setNotice("微信内请右上角分享，或手动复制链接");
    return;
  }
  writePromise
    .then(() => setNotice("已复制分享链接，可粘贴到微信"))
    .catch(() => {
      window.prompt("复制这个分享链接", url);
      setNotice("微信内请右上角分享，或手动复制链接");
    });
}

function setNotice(text) {
  state.notice = text;
  refresh();
  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    state.notice = "";
    refresh();
  }, 1400);
}

const ui = createGameUI(root, {
  onStart: () => {
    if (state.session.mode === "ended") {
      if (Date.now() < state.endingUi.restartLockUntil) {
        setNotice("结局刚生成，稍等片刻再确认重开");
        return;
      }
      if (Date.now() >= state.endingUi.restartConfirmUntil) {
        state.endingUi.restartConfirmUntil = Date.now() + 2500;
        setNotice("再点一次“再来一局”确认重开");
        refresh();
        return;
      }
    }
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
  onBuyFood: (foodId) => {
    buyFood(foodId);
    refresh();
  },
  onRestart: () => {
    startNew(Date.now());
    refresh();
  },
  onCopyShare: () => copyShare(),
  onWeChatShare: () => wechatShare(),
});

window.render_game_to_text = () => {
  const v = buildView();
  return JSON.stringify({
    coordinateSystem: "UI only; one-column mobile card layout.",
    mode: v.mode,
    day: `${v.day}/${v.dayTarget}`,
    reachedTarget: v.reachedTarget,
    profileName: v.profileName,
    avatar: v.avatar,
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
    currentSkills: v.skills,
    foodShop: v.foodShop,
    history: v.history,
    result: v.result,
    runtimeMode: v.runtimeMode,
  });
};

window.advanceTime = () => refresh();

refresh();
