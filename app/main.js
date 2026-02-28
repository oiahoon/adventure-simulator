import { createGameUI } from "../ui/game-ui.js?v=20260228_14";

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
];

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
  return applied;
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

function buildAvatarConfig(random, seed) {
  const styles = ["adventurer", "adventurer-neutral", "avataaars"];
  const style = randomPick(styles, random);
  const avatarSeed = `${seed}-${Math.floor(random() * 100000)}`;
  return {
    style,
    seed: avatarSeed,
    url: `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundType=gradientLinear`,
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

function drawTempSkillsWithCooldown(random, count = 2, cooldownIds = []) {
  const cooldown = new Set(cooldownIds || []);
  const preferred = TEMP_SKILL_POOL.filter((item) => !cooldown.has(item.id));
  if (preferred.length >= count) {
    return drawTempSkills(
      random,
      count,
      preferred,
    );
  }
  const mixed = [...preferred, ...TEMP_SKILL_POOL.filter((item) => cooldown.has(item.id))];
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
  updateMilestones(session);
  const growth = resolveGrowthEvent(session, dayIndex);
  if (growth) return growth;
  const incident = resolveStateIncidentEvent(session, dayIndex);
  if (incident) return incident;
  const loopStage = ((dayIndex - 1) % 5) + 1;
  return resolveCausalStageEvent(session, loopStage);
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
    review: {
      topNodes,
      topDecisions,
      chainSummary,
    },
  };
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
  const reason = sanitizeShareLine(result.reason?.bullets?.[0] || "", 80);
  const poem = extractPoemLine(result.storyNarrative || "");
  const topDecision = sanitizeShareLine((result.reason?.review?.topDecisions || [])[0] || "", 72);
  return {
    v: 2,
    title: result.ending?.title || "本局结局",
    subtitle: result.ending?.subtitle || "",
    score: result.score || 0,
    days: result.daysSurvived || 0,
    avatarUrl: state.session.avatar?.url || "",
    role: state.session.archetypeName || "都市求生者",
    reason,
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

function createSession(seed = Date.now()) {
  const random = seededRandom(seed);
  const archetype = randomPick(STARTER_ARCHETYPES, random);
  const openingEvent = chooseOpening(archetype, random);
  const avatar = buildAvatarConfig(random, seed);
  const base = archetype.baseStats;

  const jitter = () => (random() < 0.5 ? -1 : 1);
  const skillOffers = drawTempSkills(random, 2);
  return {
    seed,
    random,
    avatar,
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
    eventSeenCount: {},
    tagUsage: {},
    pendingConsequences: [],
    forcedEventQueue: [],
    activeForcedEventId: "",
    usedEventIds: new Set([openingEvent.id]),
    skillOffers,
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
  const daysSurvived = state.session.dayIndex + 1;

  state.session.mode = "ended";
  state.session.result = {
    alive,
    daysSurvived,
    score,
    ending,
    reason,
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
    impactText: effectToText(statsDelta(before, after)),
    delta: statsDelta(before, after),
  });
  session.usedEventIds.add(event.id);
  session.eventSeenCount[event.id] = (session.eventSeenCount[event.id] || 0) + 1;
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
  session.skillOffers = drawTempSkillsWithCooldown(session.random, 2, session.skillCooldownIds);
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
  const food = FOOD_OPTIONS.find((item) => item.id === foodId);
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
  const keyDecision = sanitizeShareLine((result.reason?.review?.topDecisions || [])[0] || "", 90);
  const poem = extractPoemLine(result.storyNarrative || "");
  return [
    `我在《是男人就坚持100天》硬扛了 ${result.daysSurvived} 天，结局：${result.ending.title}`,
    `本局画像：${state.session.archetypeName}｜当前分 ${result.score}`,
    `翻车主因：${reason}`,
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

  return {
    mode: session.mode,
    day: session.dayIndex + 1,
    dayTarget: TARGET_DAY,
    reachedTarget: session.dayIndex + 1 >= TARGET_DAY,
    profileName: session.archetypeName,
    avatar: session.avatar,
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
            options: event.options.map((option) => ({ ...option, impactText: effectToText(option.effects) })),
          }
        : null,
    skills: {
      usedToday: session.skillUsedDay,
      offers: session.skillOffers.map((item) => ({
        id: item.id,
        name: item.name,
        text: item.text,
        impactText: effectToText(item.effects),
      })),
    },
    foodShop: {
      usedToday: session.foodUsedDay,
      options: FOOD_OPTIONS.map((item) => ({
        id: item.id,
        name: item.name,
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
