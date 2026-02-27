import { EXTRA_STORY_DECK, EXTRA_STORY_EVENTS } from "./story-pack-zh.js";

const BASE_STORY_EVENTS = {
  layoff_rumor: {
    id: "layoff_rumor",
    title: "裁员风声",
    text: "部门群开始传闻要优化编制，你意识到这周不能再随便花钱。",
    nodeType: "battle",
    enemyPool: ["enforcer", "scavenger"],
    preEffects: {
      setFlags: ["job_unstable"],
      bias: [{ tag: "debt", delta: 1 }],
    },
    runtimeEffects: { playerHpDelta: -1 },
    branches: [
      {
        id: "layoff_save_mode",
        label: "立刻进入省钱模式",
        text: "你决定砍掉非必要开支，短期稳住现金流。",
        effects: {
          enqueueBranch: ["hr_meeting"],
          setFlags: ["save_mode"],
          bias: [{ tag: "survival", delta: 2 }],
          playerHpDelta: 1,
        },
      },
      {
        id: "layoff_keep_face",
        label: "先维持体面生活",
        text: "你选择暂时不改变消费习惯，压力被延后了。",
        effects: {
          enqueueBranch: ["hr_meeting"],
          setFlags: ["face_spending"],
          bias: [{ tag: "debt", delta: 2 }],
          playerHpDelta: -1,
        },
      },
    ],
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
    branches: [
      {
        id: "hr_fight_package",
        label: "争取补偿方案",
        text: "你选择硬谈条件，精神压力变高但后手更稳。",
        effects: {
          enqueueBranch: ["rent_hike_notice", "compensation_stall"],
          setFlags: ["negotiation_path"],
          bias: [{ tag: "risk", delta: 1 }],
          playerHpDelta: -1,
        },
      },
      {
        id: "hr_quick_exit",
        label: "尽快离场找下一份",
        text: "你决定快速止损，把精力转到找机会。",
        effects: {
          enqueueBranch: ["absurd_side_hustle", "job_hunt_sprint"],
          setFlags: ["quick_exit_path"],
          bias: [{ tag: "career", delta: 2 }],
          playerHpDelta: 0,
        },
      },
    ],
    tags: ["career", "risk"],
  },
  rent_hike_notice: {
    id: "rent_hike_notice",
    title: "房东涨租通知",
    text: "你刚到家就看到涨租消息，合约还没到期但生活预算已经失衡。",
    nodeType: "battle",
    enemyPool: ["scavenger", "sniper"],
    preEffects: {
      setFlags: ["rent_pressure"],
      bias: [{ tag: "debt", delta: 2 }],
    },
    runtimeEffects: { playerHpDelta: -2 },
    branches: [
      {
        id: "rent_move_out",
        label: "换房降成本",
        text: "你准备搬家，短期折腾但能降低后续支出。",
        effects: {
          enqueueBranch: ["social_misfire", "roommate_conflict"],
          setFlags: ["moving_out"],
          bias: [{ tag: "survival", delta: 1 }],
          playerHpDelta: -1,
        },
      },
      {
        id: "rent_borrow_hold",
        label: "借钱先扛住",
        text: "你决定先借钱续租，眼前稳定但债务风险抬头。",
        effects: {
          enqueueBranch: ["payday_loan_ad", "credit_card_trap"],
          setFlags: ["borrow_to_hold"],
          bias: [{ tag: "debt", delta: 2 }],
          playerHpDelta: -1,
        },
      },
    ],
    tags: ["rent", "debt"],
  },
  payday_loan_ad: {
    id: "payday_loan_ad",
    title: "极速放款广告",
    text: "短视频平台推来“当天到账”的贷款广告，条款看起来像陷阱。",
    nodeType: "battle",
    enemyPool: ["sniper", "scavenger"],
    preEffects: {
      setFlags: ["debt_risk"],
      bias: [{ tag: "risk", delta: 2 }],
    },
    runtimeEffects: { playerHpDelta: -1 },
    branches: [
      {
        id: "loan_decline",
        label: "拒绝贷款广告",
        text: "你压下冲动，决定靠时间换空间。",
        effects: {
          enqueueBranch: ["burnout_warning"],
          setFlags: ["loan_declined"],
          bias: [{ tag: "survival", delta: 2 }],
          playerHpDelta: 0,
        },
      },
      {
        id: "loan_try_small",
        label: "小额试水",
        text: "你抱着侥幸心理试了小额借贷。",
        effects: {
          enqueueBranch: ["debt_collection"],
          setFlags: ["loan_taken"],
          bias: [{ tag: "debt", delta: 3 }],
          playerHpDelta: -1,
        },
      },
    ],
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
    branches: [
      {
        id: "burnout_rest",
        label: "强制休整一周",
        text: "你决定暂时停下来，短期进度变慢但状态恢复。",
        effects: {
          enqueueBranch: ["parent_pressure_call"],
          setFlags: ["rest_mode"],
          bias: [{ tag: "survival", delta: 2 }],
          playerHpDelta: 2,
        },
      },
      {
        id: "burnout_push",
        label: "继续硬扛",
        text: "你决定继续推进，赌一次状态还能撑住。",
        effects: {
          enqueueBranch: ["public_opinion_wave"],
          setFlags: ["overwork_mode"],
          bias: [{ tag: "risk", delta: 2 }],
          playerHpDelta: -1,
        },
      },
    ],
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
    branches: [
      {
        id: "absurd_follow",
        label: "尝试跟进",
        text: "你决定先小规模尝试，看看是不是机会。",
        effects: {
          enqueueBranch: ["fake_expert_course"],
          setFlags: ["absurd_follow"],
          bias: [{ tag: "risk", delta: 2 }],
        },
      },
      {
        id: "absurd_reject",
        label: "直接拒绝",
        text: "你觉得这事不靠谱，决定回归稳妥路线。",
        effects: {
          enqueueBranch: ["gig_platform_ban"],
          setFlags: ["absurd_reject"],
          bias: [{ tag: "survival", delta: 1 }],
        },
      },
    ],
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
    branches: [
      {
        id: "social_apology",
        label: "主动道歉修复关系",
        text: "你选择降低姿态，争取把损失控制住。",
        effects: {
          setFlags: ["social_repair"],
          bias: [{ tag: "social", delta: 2 }],
          playerHpDelta: 1,
        },
      },
      {
        id: "social_counter",
        label: "硬刚舆论",
        text: "你选择正面硬刚，声量上去了但风险更高。",
        effects: {
          setFlags: ["social_counter"],
          bias: [{ tag: "risk", delta: 2 }],
          playerHpDelta: -1,
        },
      },
    ],
    tags: ["tieba", "social"],
  },
  compensation_stall: {
    id: "compensation_stall",
    title: "补偿拖延",
    text: "谈判进入拉扯期，你被迫投入更多时间和精力。",
    nodeType: "battle",
    enemyPool: ["enforcer"],
    requiresFlags: ["negotiation_path"],
    preEffects: {
      bias: [{ tag: "survival", delta: 1 }],
    },
    runtimeEffects: { playerHpDelta: -2 },
    tags: ["career", "risk"],
  },
  job_hunt_sprint: {
    id: "job_hunt_sprint",
    title: "求职冲刺",
    text: "你连续投递和面试，短期压力拉满但机会也在增加。",
    nodeType: "battle",
    enemyPool: ["sniper", "enforcer"],
    requiresFlags: ["quick_exit_path"],
    preEffects: {
      bias: [{ tag: "career", delta: 2 }],
    },
    runtimeEffects: { playerHpDelta: -1 },
    tags: ["career", "survival"],
  },
  roommate_conflict: {
    id: "roommate_conflict",
    title: "合租冲突",
    text: "新的合租方案节省了预算，但居住摩擦开始升级。",
    nodeType: "battle",
    enemyPool: ["scavenger", "sniper"],
    requiresFlags: ["moving_out"],
    preEffects: {
      bias: [{ tag: "social", delta: 1 }],
    },
    runtimeEffects: { playerHpDelta: -1 },
    tags: ["rent", "social"],
  },
  credit_card_trap: {
    id: "credit_card_trap",
    title: "信用卡分期陷阱",
    text: "你以为分期能缓解压力，结果手续费悄悄吞掉了现金流。",
    nodeType: "battle",
    enemyPool: ["enforcer", "sniper"],
    requiresFlags: ["borrow_to_hold"],
    preEffects: {
      bias: [{ tag: "debt", delta: 2 }],
    },
    runtimeEffects: { playerHpDelta: -2 },
    tags: ["debt", "risk"],
  },
  public_opinion_wave: {
    id: "public_opinion_wave",
    title: "舆情浪潮",
    text: "你被卷入一波网络讨论，短时间内流量和风险都在上升。",
    nodeType: "battle",
    enemyPool: ["sniper", "enforcer"],
    preEffects: {
      bias: [{ tag: "social", delta: 2 }],
    },
    runtimeEffects: { playerHpDelta: -1 },
    branches: [
      {
        id: "opinion_hide",
        label: "降温处理",
        text: "你选择降温，稳住局势。",
        effects: {
          setFlags: ["opinion_hide"],
          bias: [{ tag: "survival", delta: 1 }],
        },
      },
      {
        id: "opinion_ride",
        label: "借势放大",
        text: "你决定借势冲一把，把争议当流量。",
        effects: {
          setFlags: ["opinion_ride"],
          bias: [{ tag: "risk", delta: 2 }],
          playerHpDelta: -1,
        },
      },
    ],
    tags: ["social", "risk"],
  },
  parent_pressure_call: {
    id: "parent_pressure_call",
    title: "家庭来电压力",
    text: "家里打来电话问近况，你必须在现实和期待之间回答。",
    nodeType: "battle",
    enemyPool: ["scavenger", "enforcer"],
    preEffects: {
      bias: [{ tag: "social", delta: 1 }],
    },
    runtimeEffects: { playerHpDelta: -1 },
    branches: [
      {
        id: "parent_tell_truth",
        label: "如实说明现状",
        text: "你选择坦白处境，短期尴尬但减轻心理负担。",
        effects: {
          setFlags: ["family_truth"],
          bias: [{ tag: "survival", delta: 1 }],
          playerHpDelta: 1,
        },
      },
      {
        id: "parent_hold_mask",
        label: "先报喜不报忧",
        text: "你选择维持表面稳定，把压力留给自己。",
        effects: {
          setFlags: ["family_mask"],
          bias: [{ tag: "risk", delta: 1 }],
          playerHpDelta: -1,
        },
      },
    ],
    tags: ["social", "pressure"],
  },
  fake_expert_course: {
    id: "fake_expert_course",
    title: "大师课程推销",
    text: "有人向你兜售“逆天改命课”，承诺三天翻盘。",
    nodeType: "battle",
    enemyPool: ["scavenger", "sniper"],
    requiresFlags: ["absurd_follow"],
    preEffects: {
      bias: [{ tag: "risk", delta: 2 }],
    },
    runtimeEffects: { playerHpDelta: -1 },
    branches: [
      {
        id: "course_buy",
        label: "付费买课",
        text: "你决定花钱买希望。",
        effects: {
          setFlags: ["course_buyer"],
          bias: [{ tag: "debt", delta: 2 }],
          playerHpDelta: -1,
        },
      },
      {
        id: "course_skip",
        label: "理性跳过",
        text: "你选择止损，不再追加沉没成本。",
        effects: {
          setFlags: ["course_skipper"],
          bias: [{ tag: "survival", delta: 1 }],
        },
      },
    ],
    tags: ["tieba", "absurd"],
  },
  gig_platform_ban: {
    id: "gig_platform_ban",
    title: "平台规则突变",
    text: "你依赖的平台临时改规则，收益模型被打乱。",
    nodeType: "battle",
    enemyPool: ["sniper", "enforcer"],
    preEffects: {
      bias: [{ tag: "career", delta: 1 }],
    },
    runtimeEffects: { playerHpDelta: -1 },
    branches: [
      {
        id: "gig_appeal",
        label: "提交申诉",
        text: "你尝试走流程挽回影响。",
        effects: {
          setFlags: ["gig_appeal"],
          bias: [{ tag: "career", delta: 1 }],
        },
      },
      {
        id: "gig_switch",
        label: "切换平台",
        text: "你果断换到别的平台，但需要重新爬坡。",
        effects: {
          setFlags: ["gig_switch"],
          bias: [{ tag: "survival", delta: 1 }],
        },
      },
    ],
    tags: ["career", "risk"],
  },
};

export const STORY_ARC_ORDER = ["layoff_rumor", "rent_hike_notice", "burnout_warning"];
const BASE_STORY_DECK = [
  "absurd_side_hustle",
  "social_misfire",
  "public_opinion_wave",
  "parent_pressure_call",
  "gig_platform_ban",
  "fake_expert_course",
];

export const STORY_EVENTS = {
  ...BASE_STORY_EVENTS,
  ...EXTRA_STORY_EVENTS,
};

export const STORY_DECK = [...BASE_STORY_DECK, ...EXTRA_STORY_DECK];
