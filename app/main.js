import { createGameUI } from "../ui/game-ui.js";

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
];

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

function drawTempSkills(random, count = 2) {
  const pool = [...TEMP_SKILL_POOL];
  const picks = [];
  const drawCount = Math.min(count, pool.length);
  for (let i = 0; i < drawCount; i += 1) {
    const idx = Math.floor(random() * pool.length);
    picks.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picks;
}

function chooseOpening(archetype, random) {
  const openingId = randomPick(archetype.openingIds, random);
  return OPENING_EVENTS[openingId] || OPENING_EVENTS.opening_rent_kpi;
}

function pickFromPool(session, pool, fallbackEvent) {
  const unseen = pool.filter((event) => !session.usedEventIds.has(event.id));
  const candidates = unseen.length ? unseen : pool;
  return candidates.length ? randomPick(candidates, session.random) : fallbackEvent;
}

function resolveCausalStageEvent(session, stageIndex) {
  const flags = session.flags;
  const s = session.stats;

  if (stageIndex === 1) {
    if (flags.debt_line) {
      return pickFromPool(session, CHAPTER_POOLS[1].debt, CHAPTER_POOLS[1].debt[0]);
    }
    return pickFromPool(session, CHAPTER_POOLS[1].work, CHAPTER_POOLS[1].work[0]);
  }

  if (stageIndex === 2) {
    if (flags.quality_risk || flags.debt_overhang || s.heat >= 6) {
      return pickFromPool(session, CHAPTER_POOLS[2].backlash, CHAPTER_POOLS[2].backlash[0]);
    }
    return pickFromPool(session, CHAPTER_POOLS[2].stable, CHAPTER_POOLS[2].stable[0]);
  }

  if (stageIndex === 3) {
    if (s.energy <= 3 || flags.overwork_line || flags.burnout_risk) {
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

  if (flags.debt_spiral || s.money <= 2 || flags.trust_break) {
    return pickFromPool(session, CHAPTER_POOLS[5].debt, CHAPTER_POOLS[5].debt[0]);
  }
  return pickFromPool(session, CHAPTER_POOLS[5].pivot, CHAPTER_POOLS[5].pivot[0]);
}

function resolveEvent(session, dayIndex) {
  if (dayIndex === 0) return session.openingEvent;
  const loopStage = ((dayIndex - 1) % 5) + 1;
  return resolveCausalStageEvent(session, loopStage);
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

  return { weakest: { name: weakName, value: weakValue }, keyDay: worstDay ? worstDay.day : null, bullets };
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
  const random = seededRandom(seed);
  const archetype = randomPick(STARTER_ARCHETYPES, random);
  const openingEvent = chooseOpening(archetype, random);
  const base = archetype.baseStats;

  const jitter = () => (random() < 0.5 ? -1 : 1);
  return {
    seed,
    random,
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
    usedEventIds: new Set([openingEvent.id]),
    skillOffers: drawTempSkills(random, 2),
    skillUsedDay: false,
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
  const daysSurvived = state.session.dayIndex + 1;
  const challengeCode = encodeChallenge({
    seed: state.session.seed,
    daysSurvived,
    score,
    ending: ending.id,
    days: state.session.history.map((item) => `${item.eventId}.${item.optionId}`).slice(0, 10),
  });

  state.session.mode = "ended";
  state.session.result = {
    alive,
    daysSurvived,
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

  const event = resolveEvent(session, session.dayIndex);
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
  session.usedEventIds.add(event.id);

  const dead = [session.stats.money, session.stats.energy, session.stats.mood, session.stats.reputation].some((v) => v <= 0);
  if (dead) {
    finishSession(false);
    return;
  }

  session.dayIndex += 1;
  session.skillOffers = drawTempSkills(session.random, 2);
  session.skillUsedDay = false;
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

function startNew(seed = Date.now()) {
  state.session = createSession(seed);
  state.session.mode = "playing";
}

function shareText() {
  const result = state.session.result;
  if (!result) return "";
  return [
    `我在《是男人就坚持100天》坚持了 ${result.daysSurvived} 天，分数 ${result.score}，结局：${result.ending.title}`,
    `结局成因：${result.reason?.bullets?.[0] || "稳住了主要属性"}`,
    `挑战码：${result.challengeCode}`,
    "打开同链接输入挑战码就能复刻我的局。",
  ].join("\n");
}

function buildView() {
  const session = state.session;
  const event = resolveEvent(session, session.dayIndex);
  const score = computeScore(session);

  return {
    mode: session.mode,
    day: session.dayIndex + 1,
    dayTarget: TARGET_DAY,
    reachedTarget: session.dayIndex + 1 >= TARGET_DAY,
    profileName: session.archetypeName,
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
    history: session.history.slice(-6),
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
    day: `${v.day}/${v.dayTarget}`,
    reachedTarget: v.reachedTarget,
    profileName: v.profileName,
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
    history: v.history,
    result: v.result,
  });
};

window.advanceTime = () => refresh();

refresh();
