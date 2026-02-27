"use strict";

const DECK_RULES = {
  mode: "hand",
  baseHandSize: 3,
  maxHandSize: 3,
  drawPerTurn: 3,
  preventDuplicatesInHand: true,
  discardCooldownTurns: 4,
  deferCooldownTurns: 2
};

const BASE_STATS = {
  hp: 70,
  san: 58,
  fatigue: 24,
  debt: 78,
  heat: 12,
  cash: 56,
  careerXP: 0,
  examXP: 0,
  social: 0
};

const CITIES = ["beijing", "shanghai", "shenzhen", "chengdu"];
const CAREERS = ["rider", "coder", "exam", "freelancer"];

const CARDS = [
  {
    id: "card_job_push",
    deckTags: ["deck:main", "tag:jobhunt"],
    rarity: "common",
    canDiscard: true,
    event: {
      id: "card_job_push",
      version: 1,
      category: "daily",
      tags: ["jobhunt", "career"],
      baseWeight: 1.2,
      cooldown: 1,
      title: "冲刺投递",
      text: "你把简历投向了更多岗位，换来一点机会和更多焦虑。",
      choices: [
        {
          id: "left",
          label: "密集投递",
          outcomes: [
            {
              deltas: [
                { stat: "careerXP", add: 3 },
                { stat: "fatigue", add: 4 },
                { stat: "san", add: -2 }
              ],
              arcStep: { jobhunt: 1, unemployment: 1 }
            }
          ]
        },
        {
          id: "right",
          label: "挑着投",
          outcomes: [
            {
              deltas: [
                { stat: "careerXP", add: 2 },
                { stat: "fatigue", add: 2 },
                { stat: "san", add: 1 }
              ],
              arcStep: { jobhunt: 1 }
            }
          ]
        }
      ]
    }
  },
  {
    id: "card_cash_defense",
    deckTags: ["deck:main", "tag:mortgage"],
    rarity: "common",
    canDiscard: true,
    event: {
      id: "card_cash_defense",
      version: 1,
      category: "daily",
      tags: ["mortgage", "debt"],
      baseWeight: 1,
      cooldown: 1,
      title: "现金防线",
      text: "你收紧开销，优先保证账单不断供。",
      choices: [
        {
          id: "left",
          label: "极限节流",
          outcomes: [
            {
              deltas: [
                { stat: "debt", add: -10 },
                { stat: "san", add: -2 },
                { stat: "social", add: -1 }
              ],
              arcStep: { mortgage: 2 }
            }
          ]
        },
        {
          id: "right",
          label: "温和节流",
          outcomes: [
            {
              deltas: [
                { stat: "debt", add: -6 },
                { stat: "san", add: -1 }
              ],
              arcStep: { mortgage: 1 }
            }
          ]
        }
      ]
    }
  },
  {
    id: "card_family_shift",
    deckTags: ["deck:main", "tag:parenting"],
    rarity: "common",
    canDiscard: true,
    event: {
      id: "card_family_shift",
      version: 1,
      category: "daily",
      tags: ["family", "parenting"],
      baseWeight: 0.95,
      cooldown: 2,
      title: "家庭夜班",
      text: "你接过了夜间照护任务，家庭没崩但身体更累。",
      choices: [
        {
          id: "left",
          label: "硬扛",
          outcomes: [
            {
              deltas: [
                { stat: "fatigue", add: 6 },
                { stat: "san", add: 1 },
                { stat: "cash", add: -4 }
              ],
              arcStep: { parenting: 2 }
            }
          ]
        },
        {
          id: "right",
          label: "请求支援",
          outcomes: [
            {
              deltas: [
                { stat: "fatigue", add: 2 },
                { stat: "san", add: 2 },
                { stat: "debt", add: 4 }
              ],
              arcStep: { parenting: 1 }
            }
          ]
        }
      ]
    }
  },
  {
    id: "card_evidence_save",
    deckTags: ["deck:opportunity", "tag:legal"],
    rarity: "uncommon",
    canDiscard: true,
    event: {
      id: "card_evidence_save",
      version: 1,
      category: "system",
      tags: ["legal", "heat"],
      baseWeight: 0.86,
      cooldown: 4,
      title: "证据留存",
      text: "你整理监控、录音和聊天记录，给未来风波留后手。",
      choices: [
        {
          id: "left",
          label: "完整归档",
          outcomes: [
            {
              deltas: [
                { stat: "heat", add: -3 },
                { stat: "fatigue", add: 2 }
              ],
              setFlags: {
                "legal.prepared": { v: true, ttl: 8 }
              },
              arcStep: { legal: 2 }
            }
          ]
        },
        {
          id: "right",
          label: "先存一半",
          outcomes: [
            {
              deltas: [
                { stat: "heat", add: -1 },
                { stat: "fatigue", add: 1 }
              ],
              arcStep: { legal: 1 }
            }
          ]
        }
      ]
    }
  },
  {
    id: "card_rest_halfday",
    deckTags: ["deck:opportunity", "tag:recover"],
    rarity: "common",
    canDiscard: true,
    event: {
      id: "card_rest_halfday",
      version: 1,
      category: "daily",
      tags: ["recover"],
      baseWeight: 0.9,
      cooldown: 2,
      title: "半日休整",
      text: "你决定慢下来，把身体和情绪拉回安全区。",
      choices: [
        {
          id: "left",
          label: "彻底休息",
          outcomes: [
            {
              deltas: [
                { stat: "hp", add: 10 },
                { stat: "fatigue", add: -8 },
                { stat: "cash", add: -6 }
              ]
            }
          ]
        },
        {
          id: "right",
          label: "半休半工",
          outcomes: [
            {
              deltas: [
                { stat: "hp", add: 5 },
                { stat: "fatigue", add: -4 },
                { stat: "cash", add: -2 }
              ]
            }
          ]
        }
      ]
    }
  }
];

const ARCS = {
  unemployment: {
    title: "失业链",
    stages: {
      1: {
        text: "组织传出降本信号，你被卷入待岗名单。",
        outcome: { deltas: [{ stat: "san", add: -6 }, { stat: "debt", add: 8 }], nextStage: 2 }
      },
      2: {
        text: "面试与回绝交替出现，现金流持续波动。",
        outcome: { deltas: [{ stat: "fatigue", add: 3 }, { stat: "cash", add: -8 }], nextStage: 3 }
      },
      3: {
        text: "你终于拿到阶段性机会，失业链暂时收束。",
        outcome: { deltas: [{ stat: "cash", add: 16 }, { stat: "san", add: 4 }], complete: true }
      }
    }
  },
  mortgage: {
    title: "房贷链",
    stages: {
      1: {
        text: "月供上浮通知到达，预算瞬间绷紧。",
        outcome: { deltas: [{ stat: "debt", add: 10 }, { stat: "san", add: -3 }], nextStage: 2 }
      },
      2: {
        text: "你尝试重算月供，银行给出短期方案。",
        outcome: { deltas: [{ stat: "debt", add: -8 }, { stat: "cash", add: -6 }], nextStage: 3 }
      },
      3: {
        text: "供款节奏暂稳，但家庭开支仍高压。",
        outcome: { deltas: [{ stat: "san", add: 2 }, { stat: "fatigue", add: 2 }], complete: true }
      }
    }
  },
  parenting: {
    title: "育儿链",
    stages: {
      1: {
        text: "托育排号拉长，通勤和照护冲突加剧。",
        outcome: { deltas: [{ stat: "fatigue", add: 6 }, { stat: "san", add: -2 }], nextStage: 2 }
      },
      2: {
        text: "你重排照护班次，家庭协作仍不稳定。",
        outcome: { deltas: [{ stat: "fatigue", add: 3 }, { stat: "debt", add: 4 }], nextStage: 3 }
      },
      3: {
        text: "家庭协作建立，育儿链阶段性落地。",
        outcome: { deltas: [{ stat: "san", add: 4 }, { stat: "fatigue", add: -3 }], complete: true }
      }
    }
  },
  legal: {
    title: "法律链",
    stages: {
      1: {
        text: "公共争议升温，你被迫进入应对流程。",
        outcome: { deltas: [{ stat: "heat", add: 8 }, { stat: "san", add: -3 }], nextStage: 2 }
      },
      2: {
        text: "证据审查开启，舆情走向开始分化。",
        outcome: { deltas: [{ stat: "cash", add: -6 }, { stat: "heat", add: -2 }], nextStage: 3 }
      },
      3: {
        text: "风波进入收束，代价仍然留在账本里。",
        outcome: { deltas: [{ stat: "san", add: 3 }, { stat: "debt", add: 5 }], complete: true }
      }
    }
  },
  jobhunt: {
    title: "求职链",
    stages: {
      1: {
        text: "你进入高频投递周期，面试窗口陆续打开。",
        outcome: { deltas: [{ stat: "fatigue", add: 3 }, { stat: "careerXP", add: 2 }], nextStage: 2 }
      },
      2: {
        text: "二面与回绝并存，情绪波动明显。",
        outcome: { deltas: [{ stat: "san", add: -2 }, { stat: "careerXP", add: 3 }], nextStage: 3 }
      },
      3: {
        text: "你获得阶段成果，求职链进入下一轮准备。",
        outcome: { deltas: [{ stat: "cash", add: 10 }, { stat: "san", add: 3 }], complete: true }
      }
    }
  }
};

module.exports = {
  DECK_RULES,
  BASE_STATS,
  CITIES,
  CAREERS,
  CARDS,
  ARCS,
  DEFAULT_CONTENT: {
    DECK_RULES,
    BASE_STATS,
    CITIES,
    CAREERS,
    CARDS,
    ARCS
  }
};
