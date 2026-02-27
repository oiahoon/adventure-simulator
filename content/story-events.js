export const STORY_EVENTS = {
  layoff_rumor: {
    id: "layoff_rumor",
    title: "裁员风声",
    text: "部门群开始传闻要优化编制，你意识到这周不能再随便花钱。",
    nodeType: "battle",
    enemyPool: ["enforcer", "scavenger"],
    preEffects: {
      enqueue: ["hr_meeting"],
      setFlags: ["job_unstable"],
      bias: [{ tag: "debt", delta: 1 }],
    },
    runtimeEffects: { playerHpDelta: -1 },
    tags: ["career", "pressure"],
  },
  hr_meeting: {
    id: "hr_meeting",
    title: "HR 约谈",
    text: "会议室里话很客气，但你知道选择窗口只剩下几天。",
    nodeType: "battle",
    enemyPool: ["enforcer"],
    preEffects: {
      setFlags: ["needs_transition"],
      bias: [{ tag: "survival", delta: 1 }],
    },
    runtimeEffects: { playerHpDelta: -2 },
    tags: ["career", "risk"],
  },
  rent_hike_notice: {
    id: "rent_hike_notice",
    title: "房东涨租通知",
    text: "你刚到家就看到涨租消息，合约还没到期但生活预算已经失衡。",
    nodeType: "battle",
    enemyPool: ["scavenger", "sniper"],
    preEffects: {
      enqueue: ["payday_loan_ad"],
      setFlags: ["rent_pressure"],
      bias: [{ tag: "debt", delta: 2 }],
    },
    runtimeEffects: { playerHpDelta: -2 },
    tags: ["rent", "debt"],
  },
  payday_loan_ad: {
    id: "payday_loan_ad",
    title: "极速放款广告",
    text: "短视频平台推来“当天到账”的贷款广告，条款看起来像陷阱。",
    nodeType: "battle",
    enemyPool: ["sniper", "scavenger"],
    preEffects: {
      enqueue: ["debt_collection"],
      setFlags: ["debt_risk"],
      bias: [{ tag: "risk", delta: 2 }],
    },
    runtimeEffects: { playerHpDelta: -1 },
    tags: ["debt", "risk"],
  },
  debt_collection: {
    id: "debt_collection",
    title: "债务催收",
    text: "电话开始连环响起，你必须立刻做决定，不然后续压力会更高。",
    nodeType: "elite",
    enemyPool: ["enforcer"],
    preEffects: {
      setFlags: ["debt_crisis"],
      bias: [{ tag: "survival", delta: 2 }],
    },
    runtimeEffects: { playerHpDelta: -3 },
    tags: ["debt", "climax"],
  },
  burnout_warning: {
    id: "burnout_warning",
    title: "身体警告",
    text: "连续透支后你出现明显的疲惫信号，再硬扛会有更大代价。",
    nodeType: "battle",
    enemyPool: ["sniper"],
    preEffects: {
      bias: [{ tag: "survival", delta: 2 }],
    },
    runtimeEffects: { playerHpDelta: -2 },
    tags: ["health", "survival"],
  },
  absurd_side_hustle: {
    id: "absurd_side_hustle",
    title: "离谱副业提案",
    text: "朋友发来一个听起来很离谱的副业，说稳赚不赔但细节全靠脑补。",
    nodeType: "battle",
    enemyPool: ["scavenger", "sniper"],
    preEffects: {
      bias: [{ tag: "risk", delta: 1 }],
    },
    runtimeEffects: { playerHpDelta: 0 },
    tags: ["tieba", "absurd"],
  },
  social_misfire: {
    id: "social_misfire",
    title: "社交翻车",
    text: "你的一句玩笑被误读，关系和口碑同时承压。",
    nodeType: "battle",
    enemyPool: ["sniper", "enforcer"],
    preEffects: {
      bias: [{ tag: "survival", delta: 1 }],
    },
    runtimeEffects: { playerHpDelta: -1 },
    tags: ["tieba", "social"],
  },
};

export const STORY_ARC_ORDER = ["layoff_rumor", "rent_hike_notice", "burnout_warning"];
export const STORY_DECK = ["absurd_side_hustle", "social_misfire"];
