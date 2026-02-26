(function () {
  const professions = [
    { id: "rider", name: "外卖骑手", mod: { str: 1, agi: 2, vit: 1, int: 0, spi: 0, luk: 0 }, skill: "冲刺抢单" },
    { id: "coder", name: "互联网打工人", mod: { str: -1, agi: 0, vit: 1, int: 3, spi: 1, luk: 0 }, skill: "工位续命" },
    { id: "exam", name: "考公备考生", mod: { str: 0, agi: 0, vit: 1, int: 2, spi: 1, luk: 0 }, skill: "行测冲刺" },
    { id: "freelancer", name: "县城返乡青年", mod: { str: 1, agi: 1, vit: 0, int: 1, spi: 0, luk: 2 }, skill: "人情网络" }
  ];

  const regionalOrigins = [
    { id: "county", label: "县城普通家庭", stat: { vit: 1, spi: 1, luk: 1 }, city: { debt: 14, morale: -1, fatigue: 1 }, gold: -6 },
    { id: "prefecture", label: "地级市工薪家庭", stat: { str: 1, vit: 1, int: 1 }, city: { debt: 8, morale: 0, fatigue: 0 }, gold: -2 },
    { id: "metro", label: "一线租房青年", stat: { agi: 1, int: 1, spi: -1 }, city: { debt: 18, morale: -2, fatigue: 2, heat: 1 }, gold: 3 },
    { id: "newtown", label: "新一线合租青年", stat: { agi: 1, int: 1, luk: 1 }, city: { debt: 10, morale: 1, fatigue: 1 }, gold: 1 },
    { id: "smallbiz", label: "个体户子女", stat: { str: 1, vit: 1, luk: 2 }, city: { debt: 6, morale: 1 }, gold: 8 }
  ];

  const educationTracks = [
    { id: "college", label: "本科应届生", stat: { int: 2, spi: -1 }, city: { morale: -1, fatigue: 1 }, gold: -2 },
    { id: "junior", label: "大专技能岗", stat: { agi: 1, vit: 1, int: 1 }, city: { fatigue: 1 }, gold: 0 },
    { id: "postgrad", label: "考研二战", stat: { int: 2, spi: 1, vit: -1 }, city: { morale: -2, fatigue: 2 }, gold: -4 },
    { id: "selflearn", label: "自学转行", stat: { int: 1, spi: 1, luk: 1 }, city: { morale: 1, fatigue: 1 }, gold: -1 }
  ];

  const familyPressures = [
    { id: "support-home", label: "每月寄钱回家", stat: { spi: 1, vit: 1 }, city: { debt: 12, morale: -1, fatigue: 1 }, gold: -8 },
    { id: "single-burden", label: "独生子女压力", stat: { spi: 2 }, city: { debt: 10, fatigue: 1 }, gold: -5 },
    { id: "no-burden", label: "暂时无家庭负担", stat: { int: 1, luk: 1 }, city: { debt: -5, morale: 2, fatigue: -1 }, gold: 4 },
    { id: "roommates", label: "合租互助", stat: { agi: 1, spi: 1 }, city: { debt: -2, morale: 2 }, gold: 2 }
  ];

  const professionNameThemes = {
    rider: {
      common: ["王建国", "李志强", "赵海峰", "刘东", "陈龙", "周伟"],
      memePrefix: ["跑单王", "超时侠", "逆风骑士", "电驴战神", "单王", "冲单侠"],
      memeSuffix: ["老王", "阿峰", "小刘", "师傅", "队长", "哥"]
    },
    coder: {
      common: ["张子豪", "陈宇轩", "徐浩然", "杨博文", "吴佳宁", "黄思雨"],
      memePrefix: ["改Bug", "上线人", "熬夜侠", "工位战神", "需求受害者", "发布守夜人"],
      memeSuffix: ["同学", "工程师", "老哥", "小陈", "小张", "老师"]
    },
    exam: {
      common: ["李一诺", "王嘉怡", "周晨曦", "孙静", "赵梦瑶", "胡俊杰"],
      memePrefix: ["申论侠", "行测人", "考编战士", "刷题王", "上岸候补", "背书机器"],
      memeSuffix: ["同学", "小李", "小周", "老师", "队友", "学员"]
    },
    freelancer: {
      common: ["刘伟", "高磊", "朱勇", "马涛", "黄娜", "吴敏"],
      memePrefix: ["返乡青年", "县城合伙人", "小镇创业人", "自媒体练习生", "夜市摊主", "直播试水员"],
      memeSuffix: ["阿强", "小吴", "老刘", "老板", "同学", "哥"]
    }
  };

  const sects = [
    { id: "public", name: "体制冲线", bonus: { vit: 2, spi: 2 }, desc: "抗压更稳，精神恢复更快。" },
    { id: "corp", name: "大厂硬扛", bonus: { str: 2, agi: 1 }, desc: "推进更快，战斗收益更高。" },
    { id: "solo", name: "灵活经营", bonus: { int: 2, luk: 2 }, desc: "随机机会更多，资源波动更大。" }
  ];

  const skills = [
    { id: "burst", name: "爆发", desc: "战斗首回合额外造成 8 点伤害。" },
    { id: "guard", name: "坚守", desc: "每回合减少 3 点受到的伤害。" },
    { id: "fortune", name: "鸿运", desc: "拾取金币和道具时额外 +30%。" }
  ];

  const chapters = [
    { id: 1, name: "城市入场", minLevel: 1, mission: "挺过早高峰并拿到第一笔稳定收入" },
    { id: 2, name: "试用期炼狱", minLevel: 2, mission: "完成路线抉择并建立生存节奏" },
    { id: 3, name: "就业寒潮", minLevel: 3, mission: "在裁员传闻和面试循环中守住现金流" },
    { id: 4, name: "技能分化", minLevel: 4, mission: "确定能力加点路线并拉开差距" },
    { id: 5, name: "成家与房贷", minLevel: 5, mission: "在家庭责任与账单压力中维持平衡" },
    { id: 6, name: "舆情与法律", minLevel: 6, mission: "处理高风险公共事件，避免连锁失控" },
    { id: 7, name: "现金流保卫", minLevel: 7, mission: "在终局前稳住身心状态与债务曲线" },
    { id: 8, name: "中国版斩杀线", minLevel: 8, mission: "击败系统性暴雷并活着走出终盘" }
  ];

  const chapterQuestBook = {
    1: [
      { id: "c1-1", text: "完成 2 次城市移动", req: { travels: 2 } },
      { id: "c1-2", text: "击败 1 名街头敌人", req: { victories: 1 } },
      { id: "c1-3", text: "累计拾取 1 次补给", req: { loots: 1 } },
      { id: "c1-4", text: "触发 1 次随机事件", req: { randomEvents: 1 } }
    ],
    2: [
      { id: "c2-1", text: "完成生存路线抉择", req: { choices: 1 } },
      { id: "c2-2", text: "累计 3 场战斗", req: { battles: 3 } },
      { id: "c2-3", text: "触发 2 次城市随机事件", req: { randomEvents: 2 } },
      { id: "c2-4", text: "完成 1 次支线任务", req: { sideQuestCompletions: 1 } }
    ],
    3: [
      { id: "c3-1", text: "连胜推进到 4 场胜利", req: { victories: 4 } },
      { id: "c3-2", text: "完成 1 次商店补给", req: { shops: 1 } },
      { id: "c3-3", text: "累计触发 1 次稀有事件", req: { rareEvents: 1 } },
      { id: "c3-4", text: "累计 5 次城市移动", req: { travels: 5 } }
    ],
    4: [
      { id: "c4-1", text: "完成进阶天赋抉择", req: { choices: 2 } },
      { id: "c4-2", text: "达到 Lv.4", req: { level: 4 } },
      { id: "c4-3", text: "累计 6 场胜利", req: { victories: 6 } },
      { id: "c4-4", text: "累计完成 2 次支线", req: { sideQuestCompletions: 2 } }
    ],
    5: [
      { id: "c5-1", text: "在城市边区间穿梭 8 次", req: { travels: 8 } },
      { id: "c5-2", text: "完成 2 次支线任务", req: { sideQuestCompletions: 2 } },
      { id: "c5-3", text: "累计 2 次稀有事件", req: { rareEvents: 2 } },
      { id: "c5-4", text: "累计 8 场胜利", req: { victories: 8 } },
      { id: "c5-5", text: "完成 3 次支线任务（含家庭线）", req: { sideQuestCompletions: 3 } }
    ],
    6: [
      { id: "c6-1", text: "推进至政务大厅并获胜 8 场", req: { victories: 8 } },
      { id: "c6-2", text: "累计 10 场战斗", req: { battles: 10 } },
      { id: "c6-3", text: "累计 3 次关键抉择/支线抉择", req: { choices: 2, sideQuestCompletions: 3 } },
      { id: "c6-4", text: "累计触发 3 次稀有事件", req: { rareEvents: 3 } }
    ],
    7: [
      { id: "c7-1", text: "角色达到 Lv.7", req: { level: 7 } },
      { id: "c7-2", text: "累计完成 4 次支线任务", req: { sideQuestCompletions: 4 } },
      { id: "c7-3", text: "累计触发 3 次稀有事件", req: { rareEvents: 3 } },
      { id: "c7-4", text: "累计 12 场战斗", req: { battles: 12 } }
    ],
    8: [{ id: "c8-1", text: "击败系统性暴雷完成中国版斩杀线", req: { bossDefeated: true } }]
  };

  const sideQuestTemplates = [
    { id: "sq-rider", title: "外卖护送", text: "护送骑手穿过晚高峰。", req: { travels: 3 }, reward: { gold: 50, exp: 18 } },
    { id: "sq-group", title: "群聊答疑", text: "在群里给出可执行方案。", req: { randomEvents: 2 }, reward: { exp: 26, int: 1 } },
    { id: "sq-deadline", title: "临时加班", text: "在截止前打完两场硬仗。", req: { battles: 2, victories: 1 }, reward: { gold: 36, vit: 1 } },
    { id: "sq-night", title: "夜路代驾", text: "凌晨完成夜城跑图。", req: { travels: 4 }, reward: { gold: 62, luk: 1 } },
    { id: "sq-hotsearch", title: "热搜反击", text: "以胜场和事件覆盖负面话题。", req: { victories: 2, rareEvents: 1 }, reward: { exp: 40, spi: 1 } },
    { id: "sq-campus", title: "社团返场", text: "回母校分享你的都市生存法。", req: { loots: 2, randomEvents: 1 }, reward: { gold: 30, exp: 22 } },
    { id: "sq-interview", title: "反向面试二周目", text: "继续在面试战场存活。", req: { randomEvents: 3, battles: 1 }, reward: { int: 1, spi: 1, exp: 28 } },
    { id: "sq-stream", title: "直播连麦", text: "完成一场不翻车的连麦挑战。", req: { victories: 2, randomEvents: 1 }, reward: { gold: 70, exp: 35 } },
    { id: "sq-rent", title: "月底房租", text: "在发薪前凑够本月房租。", req: { loots: 2, victories: 1 }, reward: { gold: 85, exp: 26 } },
    { id: "sq-family", title: "家庭支援", text: "寄一笔钱回家并维持本周状态。", req: { travels: 2, shops: 1 }, reward: { spi: 1, gold: 48, exp: 22 } },
    { id: "sq-hospital", title: "深夜陪诊", text: "跑完夜路后还要去医院排号。", req: { travels: 3, randomEvents: 2 }, reward: { vit: 1, exp: 34 } },
    { id: "sq-training", title: "技能证书", text: "白天打工晚上备考，争取一张证书。", req: { battles: 2, randomEvents: 2 }, reward: { int: 1, exp: 38 } },
    { id: "sq-neighbor", title: "邻里互助", text: "帮邻居搬家后继续上夜班。", req: { travels: 3, victories: 1 }, reward: { gold: 40, vit: 1 } },
    { id: "sq-delivery-peak", title: "高峰单王", text: "在晚高峰连续扛住两轮压力。", req: { battles: 3, loots: 1 }, reward: { gold: 78, agi: 1 } },
    { id: "sq-night-school", title: "夜校复读", text: "下班后再去夜校上一节硬课。", req: { randomEvents: 3 }, reward: { int: 1, spi: 1, exp: 30 } },
    { id: "sq-marriage-plan", title: "婚礼预算", text: "在现实压力里凑齐婚礼预算。", req: { shops: 2, loots: 2 }, reward: { gold: 60, spi: 1, exp: 38 } },
    { id: "sq-parent-meet", title: "双方见面", text: "协调两边家庭安排并维持工作节奏。", req: { randomEvents: 3, travels: 2 }, reward: { spi: 1, gold: 32, exp: 32 } },
    { id: "sq-newborn-night", title: "新生儿夜班", text: "夜里照顾孩子，白天继续上工。", req: { battles: 2, randomEvents: 2 }, reward: { vit: 1, spi: 1, exp: 44 } },
    { id: "sq-bride-price", title: "彩礼谈判", text: "在现实和体面之间寻找双方都能接受的方案。", req: { randomEvents: 3, loots: 2 }, reward: { gold: 42, spi: 1, exp: 36, debt: -8 } },
    { id: "sq-mortgage-budget", title: "房贷重算", text: "重新核算家庭现金流，避免断供风险。", req: { shops: 2, randomEvents: 2 }, reward: { exp: 34, int: 1, debt: -12 } },
    { id: "sq-second-child", title: "二胎准备", text: "评估二胎计划并安排托育与预算。", req: { sideQuestCompletions: 5, randomEvents: 3 }, reward: { exp: 46, spi: 1, morale: 6, fatigue: -2 } }
  ];

  const achievementBook = [
    { id: "ach-win", tier: "gold", title: "终局幸存者", desc: "击败终局敌人完成通关。", when: "win", check: () => true },
    { id: "ach-last-stand", tier: "silver", title: "最后一班地铁", desc: "在终局前夕倒下。", when: "lose", check: () => state.story.chapterId >= 7 },
    { id: "ach-relentless", tier: "silver", title: "打不垮的上班人", desc: "总战斗场次达到 15。", when: "any", check: () => state.metrics.battles >= 15 },
    { id: "ach-side-master", tier: "gold", title: "兼职永动机", desc: "完成至少 6 条支线。", when: "any", check: () => state.metrics.sideQuestCompletions >= 6 },
    { id: "ach-rare", tier: "gold", title: "离谱见证者", desc: "触发至少 5 次稀有事件。", when: "any", check: () => state.metrics.rareEvents >= 5 },
    { id: "ach-frugal", tier: "silver", title: "精打细算", desc: "通关时金币不低于 300。", when: "win", check: () => state.player.gold >= 300 },
    { id: "ach-courage", tier: "silver", title: "逆风赶路人", desc: "死亡时胜场不低于 10。", when: "lose", check: () => state.metrics.victories >= 10 },
    { id: "ach-streak", tier: "gold", title: "连胜节拍器", desc: "最高连胜达到 5。", when: "any", check: () => state.metrics.maxWinStreak >= 5 },
    { id: "ach-solidarity", tier: "gold", title: "人间互助网", desc: "累计触发随机事件达到 12。", when: "any", check: () => state.metrics.randomEvents >= 12 },
    { id: "ach-mainline", tier: "gold", title: "主线通勤王", desc: "主线节点完成数达到 20。", when: "any", check: () => countMainlineCompleted() >= 20 },
    { id: "ach-steady", tier: "silver", title: "扛压体质", desc: "最终等级达到 9 级。", when: "any", check: () => state.player.level >= 9 },
    { id: "ach-zero", tier: "bronze", title: "清零重开者", desc: "结算时金币低于 20。", when: "any", check: () => state.player.gold < 20 },
    { id: "ach-night", tier: "silver", title: "夜色赶路人", desc: "存活到第 8 天。", when: "any", check: () => state.day >= 8 },
    { id: "ach-chapter-full", tier: "gold", title: "全章穿透", desc: "到达第 8 章。", when: "any", check: () => state.story.chapterId >= 8 },
    { id: "ach-boss-rush", tier: "epic", title: "速战速决", desc: "在第 8 天前通关。", when: "win", check: () => state.day <= 7 },
    { id: "ach-iron", tier: "epic", title: "铁人模式", desc: "通关且未使用药剂。", when: "win", check: () => state.metrics.potionUsed === 0 },
    { id: "ach-hidden-1", tier: "hidden", title: "雨夜同路", desc: "触发雨夜重逢并完成结算。", when: "any", check: () => state.story.milestones.some((m) => m.includes("雨夜重逢")) },
    { id: "ach-hidden-2", tier: "hidden", title: "社保通关", desc: "触发社保流程打通并达成结局。", when: "any", check: () => state.story.milestones.some((m) => m.includes("社保流程")) },
    { id: "ach-hidden-3", tier: "hidden", title: "凌晨回电", desc: "触发电话牵挂后继续存活至第 10 天。", when: "any", check: () => state.story.milestones.some((m) => m.includes("电话那头")) && state.day >= 10 },
    { id: "ach-city-steady", tier: "epic", title: "城市稳态", desc: "结算时精神 >= 70 且疲劳 <= 35。", when: "any", check: () => state.cityStatus.morale >= 70 && state.cityStatus.fatigue <= 35 },
    { id: "ach-debt-clean", tier: "gold", title: "债务清算", desc: "结算时债务 <= 30。", when: "any", check: () => state.cityStatus.debt <= 30 },
    { id: "ach-heat-wave", tier: "epic", title: "热度风暴", desc: "结算时热度 >= 75 且仍然存活。", when: "win", check: () => state.cityStatus.heat >= 75 },
    { id: "ach-hard-life", tier: "hidden", title: "硬扛到底", desc: "债务 >= 180 且通关。", when: "win", check: () => state.cityStatus.debt >= 180 },
    { id: "ach-family-setup", tier: "gold", title: "成家立业", desc: "结算时进入已婚或育儿阶段。", when: "any", check: () => state.story.familyStage === "已婚" || state.story.familyStage === "育儿中" },
    { id: "ach-newborn", tier: "epic", title: "奶粉与远方", desc: "结算时处于育儿阶段。", when: "any", check: () => state.story.familyStage === "育儿中" },
    { id: "ach-parent-iron", tier: "hidden", title: "凌晨四点的灯", desc: "育儿阶段达成通关。", when: "win", check: () => state.story.familyStage === "育儿中" },
    { id: "ach-second-child", tier: "hidden", title: "二胎守夜人", desc: "结算时孩子数量 >= 2。", when: "any", check: () => state.story.childCount >= 2 },
    { id: "ach-mortgage", tier: "gold", title: "房贷不断供", desc: "触发房贷事件后仍然通关。", when: "win", check: () => state.story.milestones.some((m) => m.includes("房贷")) },
    { id: "ach-good-samaritan", tier: "epic", title: "扶人不折心", desc: "经历扶人风波后完成结局。", when: "any", check: () => state.story.milestones.some((m) => m.includes("扶人")) },
    { id: "ach-legal-storm", tier: "hidden", title: "风波余生", desc: "经历严重法律纠纷后仍达成结局。", when: "any", check: () => state.story.milestones.some((m) => m.includes("法律风波")) },
    { id: "ach-divorce", tier: "silver", title: "财产重分配", desc: "触发离婚财产分割事件。", when: "any", check: () => state.story.milestones.some((m) => m.includes("离婚财产分割")) }
  ];

  const locations = [
    { id: "novice", name: "城中村", type: "town", x: 120, y: 280 },
    { id: "forest", name: "产业园", type: "wild", x: 260, y: 230 },
    { id: "market", name: "老商圈", type: "town", x: 380, y: 280 },
    { id: "river", name: "三甲医院", type: "wild", x: 470, y: 190 },
    { id: "ruins", name: "政务大厅", type: "wild", x: 560, y: 105 }
  ];

  const links = [
    ["novice", "forest"],
    ["forest", "market"],
    ["forest", "river"],
    ["market", "river"],
    ["river", "ruins"]
  ];

  const boss = { name: "系统性暴雷", hp: 142, atk: 21, rewardExp: 240, rewardGold: 180 };

  const state = {
    mode: "menu",
    player: null,
    turn: 0,
    day: 1,
    speed: 1,
    currentLocation: "novice",
    isPaused: false,
    pendingChoice: null,
    seed: "",
    rng: null,
    initialSeedFromUrl: null,
    story: {
      chapterId: 1,
      milestones: [],
      majorChoices: [],
      stance: 0,
      mainlineProgress: {},
      activeSideQuest: null,
      familyStage: "单身",
      childCount: 0
    },
    cityStatus: {
      morale: 58,
      fatigue: 24,
      debt: 70,
      heat: 12
    },
    uiState: {
      turnSummary: "待开始",
      turnDelta: "-",
      nextRisk: "-"
    },
    metrics: {
      battles: 0,
      victories: 0,
      winStreak: 0,
      maxWinStreak: 0,
      travels: 0,
      shops: 0,
      loots: 0,
      potionUsed: 0,
      randomEvents: 0,
      rareEvents: 0,
      chapterAdvances: 0,
      sideQuestCompletions: 0
    },
    runResult: null,
    flags: {
      sectChosen: false,
      skillChosen: false,
      bossDefeated: false
    },
    log: []
  };

  let rafId = 0;
  let rafLast = 0;
  let turnAccumulator = 0;

  const els = {
    rerollBtn: document.getElementById("reroll-btn"),
    startBtn: document.getElementById("start-btn"),
    pauseBtn: document.getElementById("pause-btn"),
    resumeBtn: document.getElementById("resume-btn"),
    shareCardBtn: document.getElementById("share-card-btn"),
    copyShareBtn: document.getElementById("copy-share-btn"),
    copyLinkBtn: document.getElementById("copy-link-btn"),
    speedSelect: document.getElementById("speed-select"),
    log: document.getElementById("log"),
    sheet: document.getElementById("character-sheet"),
    endingSheet: document.getElementById("ending-sheet"),
    seedPill: document.getElementById("seed-pill"),
    kpiHp: document.getElementById("kpi-hp"),
    kpiMorale: document.getElementById("kpi-morale"),
    kpiFatigue: document.getElementById("kpi-fatigue"),
    kpiDebt: document.getElementById("kpi-debt"),
    kpiHeat: document.getElementById("kpi-heat"),
    kpiChapter: document.getElementById("kpi-chapter"),
    killHp: document.getElementById("kill-hp"),
    killMorale: document.getElementById("kill-morale"),
    killFatigue: document.getElementById("kill-fatigue"),
    killDebt: document.getElementById("kill-debt"),
    killHeat: document.getElementById("kill-heat"),
    killHpText: document.getElementById("kill-hp-text"),
    killMoraleText: document.getElementById("kill-morale-text"),
    killFatigueText: document.getElementById("kill-fatigue-text"),
    killDebtText: document.getElementById("kill-debt-text"),
    killHeatText: document.getElementById("kill-heat-text"),
    turnSummary: document.getElementById("turn-summary"),
    turnDelta: document.getElementById("turn-delta"),
    turnRisk: document.getElementById("turn-risk"),
    canvas: document.getElementById("world-canvas"),
    shareCanvas: document.getElementById("share-canvas"),
    downloadShareLink: document.getElementById("download-share-link"),
    choiceModal: document.getElementById("choice-modal"),
    choiceTitle: document.getElementById("choice-title"),
    choiceBody: document.getElementById("choice-body"),
    choiceOptions: document.getElementById("choice-options")
  };

  const ctx = els.canvas.getContext("2d");
  const shareCtx = els.shareCanvas.getContext("2d");

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeSeedString() {
    return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e8).toString(36)}`;
  }

  function readSeedFromUrl() {
    const seed = new URLSearchParams(window.location.search).get("seed");
    return seed && seed.trim() ? seed.trim() : null;
  }

  function resetRng(seedString) {
    state.seed = seedString;
    state.rng = mulberry32(hashSeed(seedString));
  }

  function random() {
    return state.rng ? state.rng() : Math.random();
  }

  function randInt(min, max) {
    return Math.floor(random() * (max - min + 1)) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  function roll3d6() {
    return randInt(1, 6) + randInt(1, 6) + randInt(1, 6);
  }

  function addStatMod(target, mod) {
    if (!mod) return;
    target.str += mod.str || 0;
    target.agi += mod.agi || 0;
    target.vit += mod.vit || 0;
    target.int += mod.int || 0;
    target.spi += mod.spi || 0;
    target.luk += mod.luk || 0;
  }

  function normalizeStats(stats) {
    stats.str = clamp(stats.str, 4, 22);
    stats.agi = clamp(stats.agi, 4, 22);
    stats.vit = clamp(stats.vit, 4, 22);
    stats.int = clamp(stats.int, 4, 22);
    stats.spi = clamp(stats.spi, 4, 22);
    stats.luk = clamp(stats.luk, 4, 22);
    return stats;
  }

  function makeName(jobId) {
    const surname = ["王", "李", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴", "徐", "孙", "胡", "朱", "高"];
    const commonTwoChar = ["宇轩", "浩然", "梓涵", "子豪", "思雨", "佳宁", "俊杰", "梦瑶", "一诺", "嘉怡", "晨曦", "博文"];
    const commonOneChar = ["伟", "磊", "静", "敏", "娜", "婷", "超", "涛", "勇", "峰"];
    const fallbackMemePrefix = ["打工人", "考编人", "躺平派", "牛马", "卷王", "通勤侠"];
    const fallbackMemeSuffix = ["阿强", "小刘", "老王", "同学", "师傅", "队长"];
    const theme = professionNameThemes[jobId] || null;
    const memePrefix = theme ? theme.memePrefix : fallbackMemePrefix;
    const memeSuffix = theme ? theme.memeSuffix : fallbackMemeSuffix;
    const commonPool = theme ? theme.common : [];

    if (random() < 0.2) {
      return `${pick(memePrefix)}${pick(memeSuffix)}`;
    }

    if (commonPool.length && random() < 0.62) {
      return pick(commonPool);
    }

    if (random() < 0.58) {
      return `${pick(surname)}${pick(commonTwoChar)}`;
    }
    return `${pick(surname)}${pick(commonOneChar)}`;
  }

  function locationById(id) {
    return locations.find((l) => l.id === id);
  }

  function chapterById(id) {
    return chapters.find((c) => c.id === id) || chapters[0];
  }

  function createPlayer() {
    const job = pick(professions);
    const origin = pick(regionalOrigins);
    const edu = pick(educationTracks);
    const family = pick(familyPressures);
    const stats = normalizeStats({
      str: roll3d6(),
      agi: roll3d6(),
      vit: roll3d6(),
      int: roll3d6(),
      spi: roll3d6(),
      luk: roll3d6()
    });
    addStatMod(stats, job.mod);
    addStatMod(stats, origin.stat);
    addStatMod(stats, edu.stat);
    addStatMod(stats, family.stat);
    normalizeStats(stats);

    const hpMax = 70 + stats.vit * 5;
    const mpMax = 24 + stats.spi * 3;
    const baseCity = {
      morale: 58 + randInt(-4, 4),
      fatigue: 24 + randInt(-3, 3),
      debt: 70 + randInt(-8, 12),
      heat: 12 + randInt(-2, 2)
    };
    const cityStatus = {
      morale: clamp(baseCity.morale + (origin.city.morale || 0) + (edu.city.morale || 0) + (family.city.morale || 0), 20, 90),
      fatigue: clamp(baseCity.fatigue + (origin.city.fatigue || 0) + (edu.city.fatigue || 0) + (family.city.fatigue || 0), 10, 65),
      debt: clamp(baseCity.debt + (origin.city.debt || 0) + (edu.city.debt || 0) + (family.city.debt || 0), 20, 220),
      heat: clamp(baseCity.heat + (origin.city.heat || 0) + (edu.city.heat || 0) + (family.city.heat || 0), 0, 45)
    };
    const startGold = clamp(40 + (origin.gold || 0) + (edu.gold || 0) + (family.gold || 0), 16, 80);
    const startPotion = cityStatus.fatigue >= 30 ? 2 : 1;

    return {
      name: makeName(job.id),
      profession: job,
      profile: {
        origin: origin.label,
        education: edu.label,
        family: family.label
      },
      stats,
      level: 1,
      exp: 0,
      nextExp: 70,
      hp: hpMax,
      hpMax,
      mp: mpMax,
      mpMax,
      gold: startGold,
      potion: startPotion,
      sect: null,
      skill: job.skill,
      perk: null,
      startCityStatus: cityStatus
    };
  }

  function addMilestone(text) {
    state.story.milestones.push(text);
    if (state.story.milestones.length > 14) {
      state.story.milestones = state.story.milestones.slice(-14);
    }
  }

  function addLog(message) {
    const stamp = `D${String(state.day).padStart(2, "0")} T${String(state.turn).padStart(3, "0")}`;
    state.log.push(`[${stamp}] ${message}`);
    if (state.log.length > 240) {
      state.log = state.log.slice(-240);
    }
    els.log.textContent = state.log.slice(-70).join("\n");
    els.log.scrollTop = els.log.scrollHeight;
  }

  function updateCityStatus(delta) {
    state.cityStatus.morale = clamp(state.cityStatus.morale + (delta.morale || 0), 0, 100);
    state.cityStatus.fatigue = clamp(state.cityStatus.fatigue + (delta.fatigue || 0), 0, 100);
    state.cityStatus.debt = clamp(state.cityStatus.debt + (delta.debt || 0), 0, 9999);
    state.cityStatus.heat = clamp(state.cityStatus.heat + (delta.heat || 0), 0, 100);
  }

  function applyCityPressure() {
    const p = state.player;
    updateCityStatus({
      fatigue: 2,
      morale: -1,
      heat: state.metrics.victories > 0 && state.turn % 4 === 0 ? 1 : 0
    });

    if (state.turn > 0 && state.turn % 10 === 0) {
      const bill = 26 + Math.floor(state.day * 1.5);
      p.gold = Math.max(0, p.gold - bill);
      updateCityStatus({ debt: 12, morale: -2 });
      addLog(`房租与账单结算：-${bill} 金币。`);
    }

    if (state.cityStatus.fatigue >= 82) {
      const loss = randInt(5, 10);
      p.hp = Math.max(0, p.hp - loss);
      addLog(`疲劳过载，你额外损失 ${loss} 生命。`);
    }

    if (state.cityStatus.morale <= 18) {
      p.stats.int = Math.max(2, p.stats.int - 1);
      updateCityStatus({ heat: 1 });
      addLog("精神压力拉满，临时判断力下降。");
    }
  }

  function updateKpiStrip() {
    if (!state.player) {
      els.seedPill.textContent = "Seed: -";
      els.kpiHp.textContent = "-";
      els.kpiMorale.textContent = "-";
      els.kpiFatigue.textContent = "-";
      els.kpiDebt.textContent = "-";
      els.kpiHeat.textContent = "-";
      els.kpiChapter.textContent = "-";
      return;
    }
    const chapter = chapterById(state.story.chapterId);
    els.seedPill.textContent = `Seed: ${state.seed}`;
    els.kpiHp.textContent = `${state.player.hp}/${state.player.hpMax}`;
    els.kpiMorale.textContent = String(state.cityStatus.morale);
    els.kpiFatigue.textContent = String(state.cityStatus.fatigue);
    els.kpiDebt.textContent = String(state.cityStatus.debt);
    els.kpiHeat.textContent = String(state.cityStatus.heat);
    els.kpiChapter.textContent = `第${chapter.id}章`;
  }

  function riskLevelText() {
    const hpRatio = state.player ? state.player.hp / Math.max(1, state.player.hpMax) : 1;
    let score = 0;
    if (hpRatio < 0.35) score += 3;
    else if (hpRatio < 0.6) score += 2;
    if (state.cityStatus.morale < 30) score += 2;
    if (state.cityStatus.fatigue > 70) score += 2;
    if (state.cityStatus.debt > 180) score += 2;
    if (state.cityStatus.heat > 65) score += 2;
    if (score >= 7) return "极高";
    if (score >= 4) return "中高";
    if (score >= 2) return "可控";
    return "低";
  }

  function setKilllineBar(el, textEl, value, max, invertRisk) {
    const pct = clamp((value / Math.max(1, max)) * 100, 0, 100);
    const display = invertRisk ? 100 - pct : pct;
    el.style.width = `${display}%`;
    if (display < 35) {
      el.style.background = "linear-gradient(90deg, #ef4444, #f97316)";
    } else if (display < 65) {
      el.style.background = "linear-gradient(90deg, #f59e0b, #facc15)";
    } else {
      el.style.background = "linear-gradient(90deg, #22c55e, #3b82f6)";
    }
    textEl.textContent = `${Math.round(value)}`;
  }

  function updateKilllinePanel() {
    if (!state.player) {
      return;
    }
    setKilllineBar(els.killHp, els.killHpText, state.player.hp, state.player.hpMax, false);
    setKilllineBar(els.killMorale, els.killMoraleText, state.cityStatus.morale, 100, false);
    setKilllineBar(els.killFatigue, els.killFatigueText, state.cityStatus.fatigue, 100, true);
    setKilllineBar(els.killDebt, els.killDebtText, state.cityStatus.debt, 300, true);
    setKilllineBar(els.killHeat, els.killHeatText, state.cityStatus.heat, 100, true);
    els.turnSummary.textContent = `回合反馈：${state.uiState.turnSummary}`;
    els.turnDelta.textContent = `变化：${state.uiState.turnDelta}`;
    els.turnRisk.textContent = `下回合风险：${state.uiState.nextRisk}`;
  }

  function finalizeTurnFeedback(before, label) {
    if (!state.player || !before) return;
    const dHp = state.player.hp - before.hp;
    const dGold = state.player.gold - before.gold;
    const dMorale = state.cityStatus.morale - before.morale;
    const dFatigue = state.cityStatus.fatigue - before.fatigue;
    const dDebt = state.cityStatus.debt - before.debt;
    const dHeat = state.cityStatus.heat - before.heat;
    const streak = state.metrics.winStreak > 0 ? ` 连胜${state.metrics.winStreak}` : "";
    state.uiState.turnSummary = `${label}${streak}`;
    state.uiState.turnDelta = `HP ${dHp >= 0 ? "+" : ""}${dHp} | 金币 ${dGold >= 0 ? "+" : ""}${dGold} | 精神 ${dMorale >= 0 ? "+" : ""}${dMorale} | 疲劳 ${dFatigue >= 0 ? "+" : ""}${dFatigue} | 债务 ${dDebt >= 0 ? "+" : ""}${dDebt} | 热度 ${dHeat >= 0 ? "+" : ""}${dHeat}`;
    state.uiState.nextRisk = riskLevelText();
  }

  function reqSatisfied(req) {
    const p = state.player;
    const checks = {
      level: p.level,
      battles: state.metrics.battles,
      victories: state.metrics.victories,
      travels: state.metrics.travels,
      shops: state.metrics.shops,
      loots: state.metrics.loots,
      randomEvents: state.metrics.randomEvents,
      rareEvents: state.metrics.rareEvents,
      choices: state.story.majorChoices.length,
      sideQuestCompletions: state.metrics.sideQuestCompletions
    };

    const keys = Object.keys(req || {});
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (key === "bossDefeated") {
        if (!!req[key] !== !!state.flags.bossDefeated) {
          return false;
        }
        continue;
      }
      if ((checks[key] || 0) < req[key]) {
        return false;
      }
    }
    return true;
  }

  function getCurrentMainlineTask() {
    const chapterId = state.story.chapterId;
    const list = chapterQuestBook[chapterId] || [];
    const idx = state.story.mainlineProgress[chapterId] || 0;
    return list[idx] || null;
  }

  function maybeProgressMainlineTask() {
    const chapterId = state.story.chapterId;
    const list = chapterQuestBook[chapterId] || [];
    if (!list.length) {
      return;
    }

    let idx = state.story.mainlineProgress[chapterId] || 0;
    while (idx < list.length && reqSatisfied(list[idx].req)) {
      addMilestone(`主线达成: ${list[idx].text}`);
      addLog(`主线节点完成: ${list[idx].text}`);
      idx += 1;
      state.story.mainlineProgress[chapterId] = idx;
    }
  }

  function getSideQuestProgressText(quest) {
    if (!quest) {
      return "无";
    }
    const parts = [];
    const req = quest.req;
    const baseline = quest.baseline;
    const entries = Object.keys(req);
    for (let i = 0; i < entries.length; i += 1) {
      const key = entries[i];
      const now = (state.metrics[key] || 0) - (baseline[key] || 0);
      parts.push(`${key}:${Math.max(0, now)}/${req[key]}`);
    }
    return parts.join(" ");
  }

  function maybeAssignSideQuest() {
    if (state.story.activeSideQuest || random() > 0.14) {
      return;
    }
    if (state.story.chapterId < 2) {
      return;
    }
    const tpl = pick(sideQuestTemplates);
    const baseline = {
      battles: state.metrics.battles,
      victories: state.metrics.victories,
      travels: state.metrics.travels,
      shops: state.metrics.shops,
      loots: state.metrics.loots,
      randomEvents: state.metrics.randomEvents,
      rareEvents: state.metrics.rareEvents
    };
    state.story.activeSideQuest = { ...tpl, baseline };
    addLog(`支线接取: ${tpl.title} - ${tpl.text}`);
  }

  function grantSideQuestReward(reward) {
    const p = state.player;
    if (reward.gold) {
      p.gold += reward.gold;
    }
    if (reward.exp) {
      gainExp(reward.exp);
    }
    if (reward.str) {
      p.stats.str += reward.str;
    }
    if (reward.agi) {
      p.stats.agi += reward.agi;
    }
    if (reward.vit) {
      p.stats.vit += reward.vit;
    }
    if (reward.int) {
      p.stats.int += reward.int;
    }
    if (reward.spi) {
      p.stats.spi += reward.spi;
    }
    if (reward.luk) {
      p.stats.luk += reward.luk;
    }
    updateCityStatus({
      morale: reward.morale || 0,
      fatigue: reward.fatigue || 0,
      debt: reward.debt || 0,
      heat: reward.heat || 0
    });
    updateCityStatus({ morale: 5, debt: -6, fatigue: -3 });
  }

  function maybeCompleteSideQuest() {
    const quest = state.story.activeSideQuest;
    if (!quest) {
      return false;
    }
    const req = quest.req;
    const baseline = quest.baseline;
    const keys = Object.keys(req);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const delta = (state.metrics[key] || 0) - (baseline[key] || 0);
      if (delta < req[key]) {
        return false;
      }
    }

    state.metrics.sideQuestCompletions += 1;
    grantSideQuestReward(quest.reward);
    addMilestone(`支线完成: ${quest.title}`);
    addLog(`支线完成: ${quest.title}，奖励已结算。`);
    state.story.activeSideQuest = null;
    return true;
  }

  function updateChapterProgress() {
    const p = state.player;
    let changed = false;
    while (state.story.chapterId < chapters.length) {
      const currentId = state.story.chapterId;
      const currentList = chapterQuestBook[currentId] || [];
      const currentDone = state.story.mainlineProgress[currentId] || 0;
      const currentReady = currentList.length === 0 || currentDone >= currentList.length;
      const next = chapterById(currentId + 1);
      if (!next) {
        break;
      }
      if (!currentReady || p.level < next.minLevel) {
        break;
      }
      state.story.chapterId = next.id;
      if (typeof state.story.mainlineProgress[next.id] !== "number") {
        state.story.mainlineProgress[next.id] = 0;
      }
      state.metrics.chapterAdvances += 1;
      addMilestone(`推进至第${next.id}章《${next.name}》`);
      addLog(`主线推进: 第${next.id}章《${next.name}》 - ${next.mission}`);
      changed = true;
    }
    if (changed) {
      maybeProgressMainlineTask();
    }
  }

  function formatSheet() {
    const p = state.player;
    if (!p) {
      return "尚未生成角色";
    }

    const loc = locationById(state.currentLocation);
    const modeText = state.mode === "ended" ? "已结束" : state.isPaused ? "暂停" : "运行中";
    const sectText = p.sect ? p.sect.name : "未选择";
    const perkText = p.perk ? p.perk.name : "未选择";
    const chapter = chapterById(state.story.chapterId);
    const mainlineTask = getCurrentMainlineTask();
    const sideQuest = state.story.activeSideQuest;

    return [
      `姓名: ${p.name}`,
      `职业: ${p.profession.name}`,
      `出身: ${p.profile ? p.profile.origin : "未知"}`,
      `教育: ${p.profile ? p.profile.education : "未知"}`,
      `家庭压力: ${p.profile ? p.profile.family : "未知"}`,
      `等级: ${p.level} 经验: ${p.exp}/${p.nextExp}`,
      `生命: ${p.hp}/${p.hpMax}`,
      `内力: ${p.mp}/${p.mpMax}`,
      `金币: ${p.gold} 药剂: ${p.potion}`,
      `地点: ${loc.name}`,
      `主线章节: 第${chapter.id}章《${chapter.name}》`,
      `当前主线: ${chapter.mission}`,
      `主线节点: ${mainlineTask ? mainlineTask.text : "本章已全部完成"}`,
      `当前支线: ${sideQuest ? `${sideQuest.title} (${getSideQuestProgressText(sideQuest)})` : "暂无"}`,
      `家庭阶段: ${state.story.familyStage} (${state.story.childCount} 个孩子)`,
      `精神 ${state.cityStatus.morale} / 疲劳 ${state.cityStatus.fatigue}`,
      `债务 ${state.cityStatus.debt} / 热度 ${state.cityStatus.heat}`,
      `连胜 ${state.metrics.winStreak} / 最高连胜 ${state.metrics.maxWinStreak}`,
      "",
      "属性:",
      `力量 ${p.stats.str}  敏捷 ${p.stats.agi}  体魄 ${p.stats.vit}`,
      `智识 ${p.stats.int}  神识 ${p.stats.spi}  气运 ${p.stats.luk}`,
      "",
      `路线: ${sectText}`,
      `职业技能: ${p.skill}`,
      `进阶天赋: ${perkText}`,
      `世界种子: ${state.seed}`,
      "",
      `状态: ${modeText}`,
      `当前天数: ${state.day}`
    ].join("\n");
  }

  function formatEndingSheet() {
    const result = state.runResult;
    if (!result) {
      return "本局尚未结束";
    }

    return [
      `结局称号: ${result.title}`,
      `结局评语: ${result.epitaph}`,
      `核心成绩: ${result.score} 分`,
      `通关状态: ${result.outcome}`,
      `最终章节: 第${result.finalChapter.id}章《${result.finalChapter.name}》`,
      `关键抉择: ${result.keyChoices || "无"}`,
      `主线节点完成: ${result.mainlineCompleted}`,
      `支线任务完成: ${result.sideQuestCompletions}`,
      `稀有遭遇: ${result.rareEvents} 次`,
      `最高连胜: ${result.maxWinStreak}`,
      `成就数: ${result.achievements.length} (${result.achievementPoints} 分)`,
      `代表成就: ${result.topAchievement}`,
      `家庭阶段: ${result.familyStage} (${result.childCount} 个孩子)`,
      `城市状态: 精神 ${result.cityStatus.morale} / 疲劳 ${result.cityStatus.fatigue}`,
      `城市状态: 债务 ${result.cityStatus.debt} / 热度 ${result.cityStatus.heat}`,
      "",
      "成就:",
      ...(result.achievements.length ? result.achievements.map((a) => `[${a.tier}] ${a.title} - ${a.desc}`) : ["暂无"]),
      "",
      "里程碑:",
      ...result.milestones.slice(-5)
    ].join("\n");
  }

  function drawMap() {
    const width = els.canvas.width;
    const height = els.canvas.height;
    ctx.clearRect(0, 0, width, height);

    const heatRatio = clamp(state.cityStatus.heat / 100, 0, 1);
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, `rgba(${Math.floor(244 + heatRatio * 8)}, ${Math.floor(248 - heatRatio * 24)}, ${Math.floor(255 - heatRatio * 70)}, 1)`);
    bg.addColorStop(1, `rgba(${Math.floor(214 + heatRatio * 20)}, ${Math.floor(229 - heatRatio * 45)}, ${Math.floor(247 - heatRatio * 90)}, 1)`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#9a835d";
    links.forEach(([a, b]) => {
      const from = locationById(a);
      const to = locationById(b);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });

    locations.forEach((loc) => {
      ctx.beginPath();
      ctx.arc(loc.x, loc.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = loc.type === "town" ? "#3f6654" : "#875444";
      ctx.fill();

      ctx.fillStyle = "#fdf8ea";
      ctx.font = "12px serif";
      ctx.textAlign = "center";
      ctx.fillText(loc.name, loc.x, loc.y + 35);
    });

    if (state.player) {
      const here = locationById(state.currentLocation);
      ctx.beginPath();
      ctx.arc(here.x, here.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#f9d145";
      ctx.fill();
      ctx.strokeStyle = "#20150e";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.textAlign = "left";
    ctx.fillStyle = "#1e2328";
    ctx.font = "14px serif";
    ctx.fillText(`Day ${state.day} / Turn ${state.turn}`, 12, 24);
  }

  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const parts = text.split("\n");
    let cursorY = y;
    for (let p = 0; p < parts.length; p += 1) {
      const words = parts[p].split("");
      let line = "";
      for (let i = 0; i < words.length; i += 1) {
        const testLine = line + words[i];
        if (context.measureText(testLine).width > maxWidth && line) {
          context.fillText(line, x, cursorY);
          line = words[i];
          cursorY += lineHeight;
        } else {
          line = testLine;
        }
      }
      context.fillText(line, x, cursorY);
      cursorY += lineHeight;
    }
    return cursorY;
  }

  function clearShareCanvas() {
    const w = els.shareCanvas.width;
    const h = els.shareCanvas.height;
    shareCtx.clearRect(0, 0, w, h);
    const bg = shareCtx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#f0e1c8");
    bg.addColorStop(1, "#dbc3a0");
    shareCtx.fillStyle = bg;
    shareCtx.fillRect(0, 0, w, h);
    shareCtx.fillStyle = "#35251a";
    shareCtx.font = "bold 60px serif";
    shareCtx.fillText("斩杀线战报", 120, 180);
    shareCtx.font = "42px serif";
    shareCtx.fillText("本局结束后可生成分享卡", 120, 270);
  }

  function renderShareCard() {
    const result = state.runResult;
    if (!result) {
      clearShareCanvas();
      return;
    }

    const w = els.shareCanvas.width;
    const h = els.shareCanvas.height;
    shareCtx.clearRect(0, 0, w, h);

    const bg = shareCtx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#f9ecd2");
    bg.addColorStop(0.6, "#e9d4b0");
    bg.addColorStop(1, "#cda57a");
    shareCtx.fillStyle = bg;
    shareCtx.fillRect(0, 0, w, h);

    shareCtx.fillStyle = "rgba(76, 40, 18, 0.18)";
    for (let i = 0; i < 8; i += 1) {
      shareCtx.fillRect(70 + i * 120, 0, 26, h);
    }

    shareCtx.fillStyle = "#2f1d14";
    shareCtx.font = "bold 72px serif";
    shareCtx.fillText("斩杀线战报", 90, 120);
    shareCtx.font = "42px serif";
    shareCtx.fillText(`${result.name} · ${result.profession}`, 90, 190);

    shareCtx.strokeStyle = "#7f5a3f";
    shareCtx.lineWidth = 5;
    shareCtx.strokeRect(72, 230, w - 144, h - 350);

    shareCtx.fillStyle = "#3e291d";
    shareCtx.font = "bold 52px serif";
    shareCtx.fillText(result.title, 110, 330);

    shareCtx.font = "36px serif";
    let y = 410;
    y = wrapText(shareCtx, `评语: ${result.epitaph}`, 110, y, w - 220, 56) + 10;

    const rows = [
      `结局: ${result.outcome}`,
      `总评分: ${result.score}`,
      `等级/天数: Lv.${result.level} / 第 ${result.day} 天`,
      `主线进度: 第${result.finalChapter.id}章《${result.finalChapter.name}》`,
      `主线节点完成: ${result.mainlineCompleted}`,
      `支线完成数: ${result.sideQuestCompletions}`,
      `达成成就: ${result.achievements.length} 个 / ${result.achievementPoints} 分`,
      `代表成就: ${result.topAchievement}`,
      `最高连胜: ${result.maxWinStreak}`,
      `家庭阶段: ${result.familyStage} (${result.childCount}孩)`,
      `精神/疲劳: ${result.cityStatus.morale}/${result.cityStatus.fatigue}`,
      `债务/热度: ${result.cityStatus.debt}/${result.cityStatus.heat}`,
      `关键抉择: ${result.keyChoices || "无"}`,
      `胜场/战斗: ${result.victories}/${result.battles}`,
      `稀有事件: ${result.rareEvents}`,
      `Seed: ${state.seed}`
    ];

    rows.forEach((line) => {
      shareCtx.fillText(line, 110, y);
      y += 56;
    });

    y += 24;
    shareCtx.font = "bold 38px serif";
    shareCtx.fillText("名场面", 110, y);
    y += 50;
    shareCtx.font = "34px serif";
    y = wrapText(shareCtx, `“${result.highlight}”`, 110, y, w - 220, 50) + 16;

    shareCtx.font = "28px monospace";
    wrapText(shareCtx, result.challengeUrl, 110, y, w - 220, 42);

    shareCtx.font = "24px serif";
    shareCtx.fillText("分享至微信/群聊，邀请好友挑战同种子命运", 110, h - 70);

    els.downloadShareLink.href = els.shareCanvas.toDataURL("image/png");
    els.downloadShareLink.classList.remove("hidden");
  }

  function render() {
    els.sheet.textContent = formatSheet();
    els.endingSheet.textContent = formatEndingSheet();
    updateKpiStrip();
    updateKilllinePanel();
    drawMap();
  }

  function getTurnMs() {
    return 1200 / state.speed;
  }

  function gainExp(amount) {
    const p = state.player;
    p.exp += amount;

    while (p.exp >= p.nextExp) {
      p.exp -= p.nextExp;
      p.level += 1;
      p.nextExp = Math.floor(p.nextExp * 1.3);
      p.hpMax += 12 + Math.floor(p.stats.vit / 2);
      p.mpMax += 6 + Math.floor(p.stats.spi / 3);
      p.hp = p.hpMax;
      p.mp = p.mpMax;
      p.stats.str += randInt(0, 1);
      p.stats.agi += randInt(0, 1);
      p.stats.vit += randInt(0, 1);
      p.stats.int += randInt(0, 1);
      p.stats.spi += randInt(0, 1);
      p.stats.luk += randInt(0, 1);
      addLog(`等级提升到 ${p.level}，全属性成长并恢复状态。`);
      addMilestone(`等级提升到 Lv.${p.level}`);
      maybeProgressMainlineTask();
      updateChapterProgress();
    }
  }

  function maybeOpenChoice() {
    const p = state.player;

    if (!state.flags.sectChosen && p.level >= 2) {
      openChoice({
        title: "关键抉择: 选择路线",
        body: "城市生存窗口很短，你必须定下一条路线。",
        options: sects.map((sect) => ({
          id: sect.id,
          label: `${sect.name} - ${sect.desc}`,
          onPick: function () {
            p.sect = sect;
            p.stats.str += sect.bonus.str || 0;
            p.stats.agi += sect.bonus.agi || 0;
            p.stats.vit += sect.bonus.vit || 0;
            p.stats.int += sect.bonus.int || 0;
            p.stats.spi += sect.bonus.spi || 0;
            p.stats.luk += sect.bonus.luk || 0;
            state.flags.sectChosen = true;
            state.story.majorChoices.push(`路线: ${sect.name}`);
            state.story.stance += sect.id === "corp" ? 1 : sect.id === "public" ? 2 : 0;
            updateCityStatus({ morale: 4, fatigue: -2, debt: -4 });
            addMilestone(`加入 ${sect.name}`);
            addLog(`你选择了 ${sect.name}。`);
            maybeProgressMainlineTask();
            updateChapterProgress();
          }
        }))
      });
      return true;
    }

    if (!state.flags.skillChosen && p.level >= 4) {
      openChoice({
        title: "关键抉择: 选择进阶天赋",
        body: "你的技能树开始分化，选择一条战斗风格。",
        options: skills.map((perk) => ({
          id: perk.id,
          label: `${perk.name} - ${perk.desc}`,
          onPick: function () {
            p.perk = perk;
            state.flags.skillChosen = true;
            state.story.majorChoices.push(`天赋: ${perk.name}`);
            updateCityStatus({ morale: 3, fatigue: -1 });
            addMilestone(`领悟 ${perk.name}`);
            addLog(`你领悟了天赋: ${perk.name}。`);
            maybeProgressMainlineTask();
            updateChapterProgress();
          }
        }))
      });
      return true;
    }

    return false;
  }

  function openChoice(choice) {
    state.pendingChoice = choice;
    state.isPaused = true;
    els.choiceTitle.textContent = choice.title;
    els.choiceBody.textContent = choice.body;
    els.choiceOptions.innerHTML = "";

    choice.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = opt.label;
      btn.addEventListener("click", () => {
        opt.onPick();
        closeChoice();
      });
      els.choiceOptions.appendChild(btn);
    });

    els.choiceModal.classList.remove("hidden");
    updateButtons();
    render();
  }

  function closeChoice() {
    state.pendingChoice = null;
    els.choiceModal.classList.add("hidden");
    if (state.mode === "running") {
      state.isPaused = false;
    }
    updateButtons();
    render();
  }

  function tryUsePotion() {
    const p = state.player;
    if (p.potion > 0 && p.hp < Math.floor(p.hpMax * 0.35)) {
      p.potion -= 1;
      state.metrics.potionUsed += 1;
      const heal = 42 + p.stats.spi;
      p.hp = Math.min(p.hpMax, p.hp + heal);
      addLog(`自动使用能量饮料，恢复 ${heal} 生命。`);
      return true;
    }
    return false;
  }

  function doTravel() {
    const current = state.currentLocation;
    const neighbors = links
      .filter(([a, b]) => a === current || b === current)
      .map(([a, b]) => (a === current ? b : a));
    state.currentLocation = pick(neighbors);
    state.metrics.travels += 1;
    updateCityStatus({ fatigue: 3, morale: -1, heat: state.cityStatus.heat > 50 ? 1 : 0 });
    const loc = locationById(state.currentLocation);
    addLog(`自动行走到 ${loc.name}。`);
  }

  function doRestOrShop() {
    const p = state.player;
    const inTown = locationById(state.currentLocation).type === "town";
    if (!inTown) {
      return false;
    }

    if (p.hp < Math.floor(p.hpMax * 0.65)) {
      const heal = 18 + Math.floor(p.stats.vit / 2);
      p.hp = Math.min(p.hpMax, p.hp + heal);
      updateCityStatus({ fatigue: -8, morale: 3 });
      addLog(`在出租屋短休回血，恢复 ${heal} 生命。`);
      return true;
    }

    if (p.gold >= 24 && p.potion < 3) {
      p.gold -= 24;
      p.potion += 1;
      state.metrics.shops += 1;
      updateCityStatus({ debt: -4, morale: 1 });
      addLog("在便利店补给了一瓶能量饮料。(-24 金币)");
      return true;
    }

    return false;
  }

  function getPerkBonus() {
    const perk = state.player.perk ? state.player.perk.id : "";
    return {
      burst: perk === "burst" ? 8 : 0,
      guard: perk === "guard" ? 3 : 0,
      fortune: perk === "fortune" ? 1.3 : 1
    };
  }

  function doEncounter(isBoss) {
    const p = state.player;
    const perk = getPerkBonus();
    state.metrics.battles += 1;

    let enemy = null;
    if (isBoss) {
      enemy = { ...boss };
    } else {
      const levelBase = Math.max(1, p.level + randInt(-1, 1));
      enemy = {
        name: pick(["压价甲方", "突发裁员邮件", "超时罚单", "网暴跟帖团"]),
        hp: 22 + levelBase * 11 + randInt(0, 16),
        atk: 6 + levelBase * 3 + randInt(0, 6),
        rewardExp: 24 + levelBase * 16,
        rewardGold: 12 + levelBase * 8
      };
    }

    addLog(`遭遇 ${enemy.name}，自动战斗开始。`);
    updateCityStatus({ fatigue: 5, heat: 3 });

    let round = 0;
    while (enemy.hp > 0 && p.hp > 0 && round < 10) {
      round += 1;
      const playerDamage = randInt(6, 12) + Math.floor(p.stats.str * 0.7) + (round === 1 ? perk.burst : 0);
      enemy.hp -= playerDamage;
      addLog(`你造成 ${playerDamage} 伤害。`);
      if (enemy.hp <= 0) {
        break;
      }

      let incoming = randInt(4, 10) + enemy.atk - Math.floor(p.stats.vit * 0.35);
      incoming = Math.max(1, incoming - perk.guard);
      p.hp -= incoming;
      addLog(`${enemy.name} 反击造成 ${incoming} 伤害。`);

      if (tryUsePotion()) {
        continue;
      }
    }

    if (p.hp <= 0) {
      p.hp = 0;
      state.metrics.winStreak = 0;
      updateCityStatus({ morale: -12 });
      addLog("你在战斗中陨落。生存线到此终结。");
      endRun(false);
      return;
    }

    if (enemy.hp <= 0) {
      state.metrics.victories += 1;
      state.metrics.winStreak += 1;
      state.metrics.maxWinStreak = Math.max(state.metrics.maxWinStreak, state.metrics.winStreak);
      const fortune = perk.fortune;
      const streakBonus = state.metrics.winStreak * 3;
      const expGain = Math.floor(enemy.rewardExp * fortune);
      const goldGain = Math.floor(enemy.rewardGold * fortune) + streakBonus;
      p.gold += goldGain;
      updateCityStatus({ morale: 5, debt: -3 });
      gainExp(expGain);
      addLog(`击败 ${enemy.name}，获得 ${expGain} 经验与 ${goldGain} 金币。`);
      if (!isBoss && randInt(1, 100) <= 18 + Math.floor(p.stats.luk / 2)) {
        p.potion += 1;
        addLog("战利品中找到一瓶能量饮料。");
      }
      if (isBoss) {
        state.flags.bossDefeated = true;
        addMilestone("击败系统性暴雷");
        addLog("你熬穿系统性暴雷，斩杀线成功抬升。");
        endRun(true);
      }
    } else {
      state.metrics.winStreak = 0;
    }
  }

  function maybeBossBattle() {
    const p = state.player;
    if (state.flags.bossDefeated || p.level < 6) {
      return false;
    }
    if (locationById(state.currentLocation).id !== "ruins") {
      return false;
    }
    if (randInt(1, 100) > 35 + p.stats.luk) {
      return false;
    }

    doEncounter(true);
    return true;
  }

  function doLoot() {
    const p = state.player;
    const gain = randInt(8, 24) + Math.floor(p.stats.luk / 3);
    p.gold += gain;
    state.metrics.loots += 1;
    updateCityStatus({ debt: -5, morale: 2 });
    addLog(`路遇遗落包裹，获得 ${gain} 金币。`);
  }

  function maybeRandomEvent() {
    if (random() > 0.2) {
      return false;
    }

    const p = state.player;
    const area = locationById(state.currentLocation).type;
    const events = [
      {
        id: "graduate-wave",
        text: "今年毕业生规模继续走高，招聘会里人山人海。",
        apply: function () {
          gainExp(16);
          updateCityStatus({ morale: -2, heat: 1 });
          addMilestone("毕业季竞争加剧");
        }
      },
      {
        id: "civil-service-rush",
        text: "国考报名再创新高，备考群从清晨刷到深夜。",
        apply: function () {
          p.stats.int += 1;
          p.stats.spi += 1;
          updateCityStatus({ fatigue: 3, morale: -1 });
        }
      },
      {
        id: "social-security-pilot",
        text: "灵活就业社保政策试点扩围，你终于看到了希望。",
        rare: true,
        condition: function () {
          return state.story.chapterId >= 4;
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          updateCityStatus({ morale: 7, debt: -10, fatigue: -3 });
          addMilestone("社保试点红利");
        }
      },
      {
        id: "ai-substitute",
        text: "AI 工具上线后，团队直接砍了半条流程。",
        rare: true,
        condition: function () {
          return state.day >= 3;
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          p.stats.int += 1;
          updateCityStatus({ morale: -4, heat: 4, fatigue: 2 });
          addMilestone("AI 替岗冲击");
        }
      },
      {
        id: "takeout-order-war",
        text: "平台补贴大战开打，单量暴涨但投诉也翻倍。",
        condition: function () {
          return area === "wild";
        },
        apply: function () {
          p.gold += randInt(28, 72);
          updateCityStatus({ fatigue: 6, heat: 3 });
        }
      },
      {
        id: "housing-rate-adjust",
        text: "存量房贷利率调整消息落地，朋友圈刷屏一整天。",
        condition: function () {
          return state.cityStatus.debt >= 100;
        },
        apply: function () {
          updateCityStatus({ debt: -14, morale: 4 });
          addMilestone("房贷利率下调窗口");
        }
      },
      {
        id: "old-for-new",
        text: "家电以旧换新补贴来了，你总算把旧冰箱换掉。",
        condition: function () {
          return area === "town" && state.day >= 4;
        },
        apply: function () {
          p.gold = Math.max(0, p.gold - randInt(10, 26));
          updateCityStatus({ morale: 5, fatigue: -2 });
        }
      },
      {
        id: "night-school-burst",
        text: "夜校挤满了进修的人，你只抢到最后一排。",
        apply: function () {
          p.stats.int += 1;
          gainExp(20);
          updateCityStatus({ fatigue: 2 });
        }
      },
      {
        id: "rent-rise",
        text: "房东通知续租上涨，工资还在原地踏步。",
        condition: function () {
          return area === "town";
        },
        apply: function () {
          p.gold = Math.max(0, p.gold - randInt(20, 55));
          updateCityStatus({ debt: 10, morale: -3 });
          addMilestone("租金再上调");
        }
      },
      {
        id: "medical-queue",
        text: "挂号队伍排到天亮，你在医院走廊补了 20 分钟觉。",
        condition: function () {
          return state.day >= 3;
        },
        apply: function () {
          p.gold = Math.max(0, p.gold - randInt(18, 42));
          updateCityStatus({ fatigue: 4, morale: -1 });
          p.stats.spi += 1;
        }
      },
      {
        id: "livestream-burst",
        text: "你发的生存战报短视频突然爆了，评论区全在求种子。",
        rare: true,
        condition: function () {
          return state.metrics.victories >= 4;
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          p.gold += randInt(65, 130);
          updateCityStatus({ heat: 10, morale: 5 });
          addMilestone("战报出圈");
        }
      },
      {
        id: "layoff-rumor",
        text: "工位间又传出裁员名单，大家边笑边刷新邮箱。",
        rare: true,
        condition: function () {
          return state.story.chapterId >= 3;
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          updateCityStatus({ morale: -6, heat: 6, fatigue: 2 });
          p.stats.vit += 1;
          addMilestone("裁员风暴中稳住节奏");
        }
      },
      {
        id: "public-service-hot",
        text: "政务大厅推出午间延时服务，你终于办完关键证明。",
        condition: function () {
          return state.currentLocation === "ruins";
        },
        apply: function () {
          updateCityStatus({ morale: 4, debt: -6, fatigue: -2 });
        }
      },
      {
        id: "forum-absurd-help",
        text: "贴吧里一个离谱求助帖冲上首页，你认真回复后被群嘲又被点赞。",
        apply: function () {
          p.stats.int += 1;
          updateCityStatus({ morale: random() > 0.5 ? 2 : -2, heat: 2 });
        }
      },
      {
        id: "subway-delay",
        text: "地铁故障晚点，你在站台完成了今日第一轮复盘。",
        apply: function () {
          p.stats.agi += 1;
          gainExp(14);
          updateCityStatus({ fatigue: 1 });
        }
      },
      {
        id: "blind-date",
        text: "朋友给你安排了相亲，尴尬但意外聊得来。",
        condition: function () {
          return state.story.familyStage === "单身" && state.day >= 3;
        },
        apply: function () {
          updateCityStatus({ morale: 5, fatigue: -2, debt: 4 });
          state.story.familyStage = "恋爱中";
          addMilestone("进入恋爱阶段");
        }
      },
      {
        id: "blind-date-accusation",
        text: "相亲后发生恶性纠纷，你被恶意指控并卷入刑责流程。",
        rare: true,
        condition: function () {
          return (state.story.familyStage === "单身" || state.story.familyStage === "恋爱中") && state.day >= 5;
        },
        apply: function () {
          addMilestone("相亲法律风波");
          addMilestone("法律风波");
          updateCityStatus({ morale: -18, fatigue: 12, heat: 20, debt: 25 });
          p.gold = Math.max(0, p.gold - randInt(60, 160));
          if (random() > 0.62) {
            p.gold = 0;
            p.hp = 0;
            addLog("法律风波升级，你失去自由，本局结束。");
            endRun(false);
          } else {
            addLog("你暂时脱身，但已付出沉重代价。");
          }
        }
      },
      {
        id: "marriage-discuss",
        text: "双方家庭开始讨论婚礼与彩礼，预算表拉满。",
        condition: function () {
          return state.story.familyStage === "恋爱中" && state.day >= 5;
        },
        apply: function () {
          p.gold = Math.max(0, p.gold - randInt(30, 80));
          updateCityStatus({ debt: 22, morale: -1, fatigue: 4 });
          if (random() > 0.55) {
            state.story.familyStage = "已婚";
            addMilestone("完成婚礼，进入已婚阶段");
          }
        }
      },
      {
        id: "bride-price-shock",
        text: "彩礼临时上涨，双方气氛瞬间紧绷。",
        condition: function () {
          return state.story.familyStage === "恋爱中" || state.story.familyStage === "已婚";
        },
        apply: function () {
          p.gold = Math.max(0, p.gold - randInt(40, 110));
          updateCityStatus({ debt: 26, morale: -5, fatigue: 3 });
          addMilestone("彩礼谈判拉锯");
        }
      },
      {
        id: "mortgage-apply",
        text: "你签下 30 年房贷，合同厚到像一本字典。",
        condition: function () {
          return state.story.familyStage === "已婚" && state.day >= 6;
        },
        apply: function () {
          updateCityStatus({ debt: 55, morale: 2, fatigue: 4 });
          addMilestone("房贷上肩");
        }
      },
      {
        id: "mortgage-overdue",
        text: "月供扣款失败，银行提示你尽快补齐。",
        condition: function () {
          return state.cityStatus.debt >= 120;
        },
        apply: function () {
          const cost = randInt(25, 65);
          p.gold = Math.max(0, p.gold - cost);
          updateCityStatus({ morale: -6, heat: 4, debt: 18 });
          addMilestone("房贷预警触发");
        }
      },
      {
        id: "newborn",
        text: "家里迎来新生命，喜悦和压力同时翻倍。",
        rare: true,
        condition: function () {
          return state.story.familyStage === "已婚" && state.day >= 7;
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          state.story.familyStage = "育儿中";
          state.story.childCount += 1;
          updateCityStatus({ morale: 8, fatigue: 12, debt: 35, heat: -2 });
          addMilestone("迎来新生儿，进入育儿阶段");
        }
      },
      {
        id: "childcare-subsidy",
        text: "地方发布托育补贴细则，群里有人欢呼有人算账。",
        rare: true,
        condition: function () {
          return state.story.familyStage === "育儿中";
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          updateCityStatus({ debt: -16, morale: 6, fatigue: -3 });
          addMilestone("托育补贴到账");
        }
      },
      {
        id: "second-child-discuss",
        text: "家里开始讨论二胎，预算表和精力表一起爆红。",
        condition: function () {
          return state.story.familyStage === "育儿中" && state.story.childCount === 1 && state.day >= 10;
        },
        apply: function () {
          updateCityStatus({ morale: 2, fatigue: 6, debt: 24 });
          if (random() > 0.62) {
            state.story.childCount += 1;
            addMilestone("二胎落地，家庭升级");
          } else {
            addMilestone("二胎计划暂缓");
          }
        }
      },
      {
        id: "child-sick-night",
        text: "孩子半夜发烧，你抱着去急诊又赶早班。",
        condition: function () {
          return state.story.familyStage === "育儿中";
        },
        apply: function () {
          p.gold = Math.max(0, p.gold - randInt(20, 55));
          updateCityStatus({ fatigue: 10, morale: -4, debt: 12 });
          p.hp = Math.max(1, p.hp - randInt(3, 8));
          addMilestone("深夜急诊与早班并行");
        }
      },
      {
        id: "family-support",
        text: "长辈来帮忙带娃几天，你终于补了觉。",
        condition: function () {
          return state.story.familyStage === "育儿中";
        },
        apply: function () {
          updateCityStatus({ fatigue: -10, morale: 4, debt: -6 });
          p.hp = Math.min(p.hpMax, p.hp + randInt(5, 12));
        }
      },
      {
        id: "road-rage-claim",
        text: "通勤路上小剐蹭，处理流程拖了你一整天。",
        condition: function () {
          return state.day >= 6;
        },
        apply: function () {
          p.gold = Math.max(0, p.gold - randInt(20, 60));
          updateCityStatus({ fatigue: 5, morale: -3, heat: 3 });
        }
      },
      {
        id: "helping-fall-fraud",
        text: "你路上扶人反被质疑，围观和解释拖垮了整天节奏。",
        rare: true,
        condition: function () {
          return state.day >= 4;
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          const severe = random() > 0.72;
          if (severe) {
            p.gold = 0;
            updateCityStatus({ morale: -14, fatigue: 9, heat: 16, debt: 30 });
            addMilestone("扶人风波破产");
            addMilestone("法律风波");
            addLog("风波失控导致赔付归零，你资金链断裂。");
            endRun(false);
            return;
          }
          p.gold = Math.max(0, p.gold - randInt(10, 40));
          updateCityStatus({ morale: -8, fatigue: 6, heat: 8 });
          addMilestone("扶人风波");
        }
      },
      {
        id: "camera-clear",
        text: "调取监控后真相还原，旁观者向你道歉。",
        condition: function () {
          return state.story.milestones.some((m) => m.includes("扶人风波")) && !state.story.milestones.some((m) => m.includes("平反"));
        },
        apply: function () {
          updateCityStatus({ morale: 6, heat: -6, debt: -4 });
          addMilestone("扶人风波平反");
        }
      },
      {
        id: "divorce-asset-split",
        text: "长期高压下关系破裂，进入离婚财产分割流程。",
        condition: function () {
          return (state.story.familyStage === "已婚" || state.story.familyStage === "育儿中") && state.day >= 10;
        },
        apply: function () {
          const lost = Math.floor(p.gold * 0.5);
          p.gold -= lost;
          updateCityStatus({ morale: -12, fatigue: 6, debt: 20, heat: 6 });
          state.story.familyStage = state.story.childCount > 0 ? "离异育儿" : "离异";
          addMilestone("离婚财产分割");
          addLog(`财产分割损失 ${lost} 金币。`);
        }
      },
      {
        id: "community-kitchen",
        text: "社区食堂临时开餐，你省下一顿饭钱。",
        condition: function () {
          return area === "town";
        },
        apply: function () {
          p.gold += randInt(18, 38);
          updateCityStatus({ debt: -8, morale: 3, fatigue: -2 });
        }
      },
      {
        id: "county-job-fair",
        text: "返乡招聘会开场，岗位多但工资条让人沉默。",
        condition: function () {
          return state.story.chapterId >= 2;
        },
        apply: function () {
          gainExp(16);
          updateCityStatus({ morale: -2, debt: -4 });
          addMilestone("县城招聘会观察");
        }
      },
      {
        id: "metro-reading",
        text: "你在地铁上刷完一门公开课，思路突然清晰。",
        apply: function () {
          p.stats.int += 1;
          gainExp(18);
          updateCityStatus({ morale: 2, fatigue: -1 });
        }
      },
      {
        id: "late-fee",
        text: "银行卡短信响起：又一笔滞纳金悄悄扣除。",
        apply: function () {
          const cost = randInt(12, 36);
          p.gold = Math.max(0, p.gold - cost);
          updateCityStatus({ debt: 10, morale: -3 });
        }
      },
      {
        id: "public-praise",
        text: "你做的一件小事被公开表扬，整天都轻快了。",
        rare: true,
        apply: function () {
          state.metrics.rareEvents += 1;
          updateCityStatus({ morale: 8, heat: 2, fatigue: -4 });
          addMilestone("城市善意回声");
        }
      },
      {
        id: "gold-price-spike",
        text: "金价再冲高点，群里全在讨论该不该上车。",
        rare: true,
        condition: function () {
          return state.day >= 8;
        },
        apply: function () {
          state.metrics.rareEvents += 1;
          p.gold += randInt(-40, 90);
          updateCityStatus({ heat: 3, morale: 1 });
          addMilestone("金价讨论夜");
        }
      },
      {
        id: "city-concert-boom",
        text: "周末演唱会与文旅爆火，你兼职加班连轴转。",
        condition: function () {
          return area === "town" && state.day >= 5;
        },
        apply: function () {
          p.gold += randInt(24, 66);
          updateCityStatus({ fatigue: 4, heat: 2 });
        }
      }
    ];

    const pool = events.filter((item) => (item.condition ? item.condition() : true));
    if (!pool.length) {
      return false;
    }

    const evt = pick(pool);
    evt.apply();
    if (!evt.rare) {
      updateCityStatus({ morale: random() > 0.45 ? 1 : -1, fatigue: random() > 0.6 ? -1 : 1 });
    }
    state.metrics.randomEvents += 1;
    addLog(`随机事件: ${evt.text}`);
    return true;
  }

  function takeTurn() {
    if (state.mode !== "running" || state.isPaused || state.pendingChoice) {
      return;
    }

    state.turn += 1;
    if (state.turn % 8 === 0) {
      state.day += 1;
    }

    const p = state.player;
    if (!p || p.hp <= 0) {
      endRun(false);
      return;
    }
    const before = {
      hp: p.hp,
      gold: p.gold,
      morale: state.cityStatus.morale,
      fatigue: state.cityStatus.fatigue,
      debt: state.cityStatus.debt,
      heat: state.cityStatus.heat
    };
    let turnLabel = "日常推进";

    applyCityPressure();

    maybeAssignSideQuest();

    if (maybeOpenChoice()) {
      return;
    }

    if (maybeBossBattle()) {
      turnLabel = "终局交锋";
      finalizeTurnFeedback(before, turnLabel);
      render();
      return;
    }

    if (maybeRandomEvent()) {
      turnLabel = "随机事件";
      maybeCompleteSideQuest();
      maybeProgressMainlineTask();
      updateChapterProgress();
      finalizeTurnFeedback(before, turnLabel);
      render();
      return;
    }

    if (doRestOrShop()) {
      turnLabel = "休整补给";
      maybeCompleteSideQuest();
      maybeProgressMainlineTask();
      updateChapterProgress();
      finalizeTurnFeedback(before, turnLabel);
      render();
      return;
    }

    const roll = random();
    if (roll < 0.44) {
      turnLabel = "战斗回合";
      doEncounter(false);
    } else if (roll < 0.74) {
      turnLabel = "移动回合";
      doTravel();
    } else if (roll < 0.9) {
      turnLabel = "搜刮回合";
      doLoot();
    } else {
      turnLabel = "混合回合";
      doRestOrShop() || doTravel();
    }

    if (p.hp <= 0) {
      endRun(false);
      return;
    }

    maybeCompleteSideQuest();
    maybeProgressMainlineTask();
    updateChapterProgress();
    maybeOpenChoice();
    finalizeTurnFeedback(before, turnLabel);
    render();
  }

  function composeTitle(isWin, score) {
    const p = state.player;
    if (isWin && state.story.familyStage === "育儿中") {
      return "凌晨奶粉战神";
    }
    if (!isWin && state.story.familyStage === "育儿中") {
      return "摇篮未眠者";
    }
    if (isWin && state.cityStatus.morale >= 76 && state.cityStatus.fatigue <= 30) {
      return "城市稳态师";
    }
    if (isWin && state.cityStatus.heat >= 75) {
      return "全城聚光者";
    }
    if (isWin && state.metrics.rareEvents >= 3) {
      return "热搜定局人";
    }
    if (isWin && p.hp > Math.floor(p.hpMax * 0.6)) {
      return "地铁不败客";
    }
    if (isWin && p.perk && p.perk.id === "fortune") {
      return "欧皇通勤王";
    }
    if (!isWin && state.metrics.victories >= 8) {
      return "虽败仍上分";
    }
    if (!isWin && state.story.chapterId >= 6) {
      return "折戟高楼夜";
    }
    if (!isWin && state.cityStatus.debt >= 180) {
      return "账单压城人";
    }
    if (score >= 760) {
      return "全城传奇录";
    }
    return isWin ? "乱局清场者" : "路口无名客";
  }

  function composeEpitaph(isWin) {
    const p = state.player;
    const sectName = p.sect ? p.sect.name : "未选路线";
    const perkName = p.perk ? p.perk.name : "未定打法";
    const familyTail = `（${state.story.familyStage}，孩子${state.story.childCount}）`;
    const cityTail = `（精神${state.cityStatus.morale}/疲劳${state.cityStatus.fatigue}/债务${state.cityStatus.debt}）`;
    if (isWin) {
      return `${p.name}选择${sectName}路线，靠${perkName}在钢铁丛林里完成清场，顺手把命运做成了可复刻挑战。${familyTail}${cityTail}`;
    }
    return `${p.name}带着${perkName}推进到第${state.story.chapterId}章，在${locationById(state.currentLocation).name}被现实反杀，但留下了足够抽象的路线供后来者挑战。${familyTail}${cityTail}`;
  }

  function buildHighlight() {
    const candidates = state.log
      .filter((line) => line.includes("主线推进") || line.includes("随机事件") || line.includes("击败") || line.includes("关键抉择"))
      .slice(-12);
    if (!candidates.length) {
      return "这条生存线虽平凡，却足够真实。";
    }
    const picked = candidates[randInt(0, candidates.length - 1)];
    return picked.replace(/^\[[^\]]+\]\s*/, "");
  }

  function buildChallengeUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("seed", state.seed);
    url.searchParams.set("source", "share");
    return url.toString();
  }

  function countMainlineCompleted() {
    let count = 0;
    const keys = Object.keys(chapterQuestBook);
    for (let i = 0; i < keys.length; i += 1) {
      const chapterId = Number(keys[i]);
      const maxCount = (chapterQuestBook[chapterId] || []).length;
      const done = state.story.mainlineProgress[chapterId] || 0;
      count += Math.min(maxCount, done);
    }
    return count;
  }

  function evaluateAchievements(isWin) {
    const tierValue = { bronze: 1, silver: 2, gold: 3, epic: 4, hidden: 5 };
    return achievementBook
      .filter((item) => {
      if (item.when === "win" && !isWin) {
        return false;
      }
      if (item.when === "lose" && isWin) {
        return false;
      }
      return item.check();
      })
      .map((item) => ({ ...item, points: (tierValue[item.tier] || 1) * 10 }))
      .sort((a, b) => b.points - a.points);
  }

  function buildRunResult(isWin) {
    const p = state.player;
    const score =
      p.level * 95 +
      state.metrics.victories * 28 +
      state.metrics.rareEvents * 80 +
      (isWin ? 260 : 0) +
      Math.floor(p.gold * 0.8) +
      state.story.chapterId * 38 +
      Math.floor(state.cityStatus.morale * 1.1) -
      Math.floor(state.cityStatus.fatigue * 0.7) -
      Math.floor(state.cityStatus.debt * 0.2) -
      Math.floor(state.cityStatus.heat * 0.3);

    const finalChapter = chapterById(state.story.chapterId);
    const title = composeTitle(isWin, score);
    const epitaph = composeEpitaph(isWin);
    const keyChoices = state.story.majorChoices.join(" / ");
    const challengeUrl = buildChallengeUrl();
    const highlight = buildHighlight();
    const mainlineCompleted = countMainlineCompleted();
    const sideQuestCompletions = state.metrics.sideQuestCompletions;
    const achievements = evaluateAchievements(isWin);
    const achievementPoints = achievements.reduce((sum, item) => sum + item.points, 0);
    const topAchievement = achievements.length ? `${achievements[0].title}(${achievements[0].tier})` : "无";

    const shareTemplates = [
      [
        `我在《中国版斩杀线》打出了结局「${title}」`,
        `角色：${p.name}（${p.profession.name}）｜评分：${score}`,
        `主线：第${finalChapter.id}章《${finalChapter.name}》｜主线节点 ${mainlineCompleted} 个`,
        `支线完成：${sideQuestCompletions}｜稀有事件：${state.metrics.rareEvents}｜成就 ${achievements.length}/${achievementPoints}分`,
        `家庭阶段：${state.story.familyStage} (${state.story.childCount} 个孩子)`,
        `城市状态：精神 ${state.cityStatus.morale} / 疲劳 ${state.cityStatus.fatigue} / 债务 ${state.cityStatus.debt}`,
        `最高连胜：${state.metrics.maxWinStreak}`,
        `代表成就：${topAchievement}`,
        `名场面：${highlight}`,
        `同种子挑战：${challengeUrl}`
      ],
      [
        `谁懂啊，刚下地铁就通关了，称号是「${title}」`,
        `${p.name} 这把全靠 ${p.perk ? p.perk.name : "临场发挥"}，硬打到第${finalChapter.id}章`,
        `顺手清了 ${sideQuestCompletions} 条支线，主线节点过了 ${mainlineCompleted} 个，成就拿了 ${achievements.length} 个(${achievementPoints}分)`,
        `目前家庭阶段：${state.story.familyStage} (${state.story.childCount} 个孩子)`,
        `精神 ${state.cityStatus.morale} / 疲劳 ${state.cityStatus.fatigue} / 债务 ${state.cityStatus.debt}，这都没倒`,
        `最高连胜：${state.metrics.maxWinStreak}`,
        `代表成就：${topAchievement}`,
        `最离谱一幕：${highlight}`,
        `来复刻我这条命运线：${challengeUrl}`
      ],
      [
        `这局我不想炫，但系统硬要给我「${title}」`,
        `评分 ${score}，主线节点 ${mainlineCompleted}，支线 ${sideQuestCompletions}，成就 ${achievements.length}(${achievementPoints}分)，也就一般发挥`,
        `家庭阶段：${state.story.familyStage} (${state.story.childCount} 个孩子)`,
        `城市状态：精神 ${state.cityStatus.morale} / 疲劳 ${state.cityStatus.fatigue} / 热度 ${state.cityStatus.heat}`,
        `最高连胜：${state.metrics.maxWinStreak}`,
        `如果你更强，欢迎同种子来超我：${challengeUrl}`
      ]
    ];
    const shareText = pick(shareTemplates).join("\n");

    return {
      outcome: isWin ? "通关" : "陨落",
      title,
      epitaph,
      score,
      name: p.name,
      profession: p.profession.name,
      level: p.level,
      day: state.day,
      battles: state.metrics.battles,
      victories: state.metrics.victories,
      maxWinStreak: state.metrics.maxWinStreak,
      rareEvents: state.metrics.rareEvents,
      mainlineCompleted,
      sideQuestCompletions,
      achievements,
      achievementPoints,
      topAchievement,
      cityStatus: { ...state.cityStatus },
      familyStage: state.story.familyStage,
      childCount: state.story.childCount,
      finalChapter,
      keyChoices,
      milestones: [...state.story.milestones],
      highlight,
      challengeUrl,
      shareText
    };
  }

  function endRun(isWin) {
    state.mode = "ended";
    state.isPaused = true;
    state.runResult = buildRunResult(isWin);
    addLog(isWin ? "结局: 你已通关，本轮挂机结束。" : "结局: 角色死亡，本轮挂机结束。");
    addLog(`结局称号: ${state.runResult.title}`);
    renderShareCard();
    updateButtons();
    render();
  }

  function updateButtons() {
    const hasPlayer = !!state.player;
    const running = state.mode === "running";
    const hasResult = !!state.runResult;

    els.startBtn.disabled = !hasPlayer || running || state.mode === "ended";
    els.pauseBtn.disabled = !running || state.isPaused || !!state.pendingChoice;
    els.resumeBtn.disabled = !running || (!state.isPaused && !state.pendingChoice);
    els.speedSelect.disabled = !running;
    els.shareCardBtn.disabled = !hasResult;
    els.copyShareBtn.disabled = !hasResult;
    els.copyLinkBtn.disabled = !hasResult;
  }

  function reroll() {
    const seedToUse = state.initialSeedFromUrl || makeSeedString();
    resetRng(seedToUse);

    state.player = createPlayer();
    state.turn = 0;
    state.day = 1;
    state.currentLocation = "novice";
    state.log = [];
    state.mode = "menu";
    state.isPaused = false;
    state.pendingChoice = null;
    state.story = {
      chapterId: 1,
      milestones: ["踏入城市生存线"],
      majorChoices: [],
      stance: 0,
      mainlineProgress: { 1: 0 },
      activeSideQuest: null,
      familyStage: "单身",
      childCount: 0
    };
    state.cityStatus = state.player.startCityStatus
      ? { ...state.player.startCityStatus }
      : {
          morale: randInt(52, 68),
          fatigue: randInt(18, 32),
          debt: randInt(60, 110),
          heat: randInt(8, 16)
        };
    state.metrics = {
      battles: 0,
      victories: 0,
      winStreak: 0,
      maxWinStreak: 0,
      travels: 0,
      shops: 0,
      loots: 0,
      potionUsed: 0,
      randomEvents: 0,
      rareEvents: 0,
      chapterAdvances: 0,
      sideQuestCompletions: 0
    };
    state.uiState = {
      turnSummary: "待开始",
      turnDelta: "-",
      nextRisk: "低"
    };
    state.runResult = null;
    state.flags = {
      sectChosen: false,
      skillChosen: false,
      bossDefeated: false
    };

    clearShareCanvas();
    els.downloadShareLink.classList.add("hidden");
    addLog(`掷骰完成: ${state.player.name} (${state.player.profession.name}) 进入城市生存线。`);
    if (state.player.profile) {
      addLog(`角色画像: ${state.player.profile.origin} / ${state.player.profile.education} / ${state.player.profile.family}`);
    }
    addLog(`本局命运种子: ${state.seed}`);
    maybeProgressMainlineTask();
    if (state.initialSeedFromUrl) {
      addLog("挑战模式: 你正在游玩分享种子。\n");
    }

    updateButtons();
    render();
  }

  function startRun() {
    if (!state.player) {
      return;
    }
    state.mode = "running";
    state.isPaused = false;
    state.pendingChoice = null;
    addLog("挂机开始，角色将自动探索、战斗与交易。");
    updateButtons();
    render();
  }

  function pauseRun() {
    if (state.mode !== "running") {
      return;
    }
    state.isPaused = true;
    addLog("你暂时按下暂停。\n");
    updateButtons();
    render();
  }

  function resumeRun() {
    if (state.mode !== "running") {
      return;
    }
    if (state.pendingChoice) {
      addLog("请先完成关键抉择，再继续挂机。\n");
      return;
    }
    state.isPaused = false;
    addLog("继续挂机。\n");
    updateButtons();
    render();
  }

  function onSpeedChange(e) {
    state.speed = Number(e.target.value) || 1;
    addLog(`挂机速度调整为 ${state.speed.toFixed(2)}x`);
  }

  async function copyText(text) {
    if (!text) {
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  function onShareCard() {
    if (!state.runResult) {
      return;
    }
    renderShareCard();
    addLog("已生成分享战报图，可直接下载截图。\n");
  }

  async function onCopyShare() {
    if (!state.runResult) {
      return;
    }
    await copyText(state.runResult.shareText);
    addLog("分享文案已复制。\n");
  }

  async function onCopyLink() {
    if (!state.runResult) {
      return;
    }
    await copyText(state.runResult.challengeUrl);
    addLog("挑战链接已复制。\n");
  }

  function loop(ts) {
    if (!rafLast) {
      rafLast = ts;
    }
    const delta = Math.min(1000, ts - rafLast);
    rafLast = ts;

    if (state.mode === "running" && !state.isPaused && !state.pendingChoice) {
      turnAccumulator += delta;
      const turnMs = getTurnMs();
      while (turnAccumulator >= turnMs) {
        takeTurn();
        turnAccumulator -= turnMs;
        if (state.mode !== "running" || state.isPaused || state.pendingChoice) {
          break;
        }
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function handleKey(e) {
    if (e.key === "f" || e.key === "F") {
      toggleFullscreen();
    }
    if (e.key === "Escape" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function buildTextState() {
    const p = state.player;
    const loc = locationById(state.currentLocation);
    const payload = {
      coordinate_system: "canvas origin=(0,0) at top-left; +x right, +y down",
      mode: state.mode,
      paused: state.isPaused,
      seed: state.seed,
      day: state.day,
      turn: state.turn,
      chapter: chapterById(state.story.chapterId),
      metrics: { ...state.metrics },
      city_status: { ...state.cityStatus },
      family: {
        stage: state.story.familyStage,
        child_count: state.story.childCount
      },
      mainline_task: getCurrentMainlineTask() ? getCurrentMainlineTask().text : null,
      active_side_quest: state.story.activeSideQuest
        ? {
            title: state.story.activeSideQuest.title,
            text: state.story.activeSideQuest.text,
            progress: getSideQuestProgressText(state.story.activeSideQuest)
          }
        : null,
      world: {
        current_location: loc ? { id: loc.id, name: loc.name, x: loc.x, y: loc.y, type: loc.type } : null,
        locations: locations.map((item) => ({ id: item.id, x: item.x, y: item.y, type: item.type }))
      },
      player: p
        ? {
            name: p.name,
            profession: p.profession.name,
            profile: p.profile ? { ...p.profile } : null,
            level: p.level,
            hp: p.hp,
            hp_max: p.hpMax,
            mp: p.mp,
            mp_max: p.mpMax,
            exp: p.exp,
            next_exp: p.nextExp,
            gold: p.gold,
            potion: p.potion,
            sect: p.sect ? p.sect.name : null,
            skill: p.skill,
            perk: p.perk ? p.perk.name : null,
            stats: { ...p.stats }
          }
        : null,
      pending_choice: state.pendingChoice
        ? {
            title: state.pendingChoice.title,
            options: state.pendingChoice.options.map((o) => o.id)
          }
        : null,
      run_result: state.runResult
        ? {
            outcome: state.runResult.outcome,
            title: state.runResult.title,
            score: state.runResult.score,
            achievements: state.runResult.achievements.map((a) => a.id),
            achievement_points: state.runResult.achievementPoints,
            top_achievement: state.runResult.topAchievement,
            max_win_streak: state.runResult.maxWinStreak,
            city_status: state.runResult.cityStatus,
            family_stage: state.runResult.familyStage,
            child_count: state.runResult.childCount,
            challenge_url: state.runResult.challengeUrl
          }
        : null,
      recent_log: state.log.slice(-8)
    };

    return JSON.stringify(payload);
  }

  window.render_game_to_text = buildTextState;

  window.advanceTime = function advanceTime(ms) {
    if (!Number.isFinite(ms) || ms <= 0) {
      return;
    }
    if (state.mode !== "running" || state.isPaused || state.pendingChoice) {
      render();
      return;
    }

    turnAccumulator += ms;
    const turnMs = getTurnMs();
    let safety = 0;
    while (turnAccumulator >= turnMs && safety < 200) {
      takeTurn();
      turnAccumulator -= turnMs;
      safety += 1;
      if (state.mode !== "running" || state.isPaused || state.pendingChoice) {
        break;
      }
    }
    render();
  };

  function wireEvents() {
    els.rerollBtn.addEventListener("click", reroll);
    els.startBtn.addEventListener("click", startRun);
    els.pauseBtn.addEventListener("click", pauseRun);
    els.resumeBtn.addEventListener("click", resumeRun);
    els.shareCardBtn.addEventListener("click", onShareCard);
    els.copyShareBtn.addEventListener("click", function () {
      onCopyShare().catch(function () {
        addLog("复制分享文案失败。\n");
      });
    });
    els.copyLinkBtn.addEventListener("click", function () {
      onCopyLink().catch(function () {
        addLog("复制挑战链接失败。\n");
      });
    });
    els.speedSelect.addEventListener("change", onSpeedChange);
    window.addEventListener("keydown", handleKey);
  }

  function init() {
    state.initialSeedFromUrl = readSeedFromUrl();
    wireEvents();
    reroll();
    rafId = requestAnimationFrame(loop);
    updateButtons();
    render();
  }

  window.addEventListener("beforeunload", function () {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  });

  init();
})();
