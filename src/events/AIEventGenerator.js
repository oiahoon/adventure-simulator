/**
 * AI事件生成器
 * 使用模板和规则生成动态的游戏事件
 */
class AIEventGenerator {
    constructor() {
        this.eventTemplates = this.loadEventTemplates();
        this.characterTraits = this.loadCharacterTraits();
        this.locationData = this.loadLocationData();
        this.narrativeElements = this.loadNarrativeElements();
        this.eventHistory = [];
        
        console.log('🤖 AI事件生成器初始化完成');
    }

    /**
     * 加载事件模板
     */
    loadEventTemplates() {
        return {
            // 遭遇类事件模板
            encounter: {
                templates: [
                    "在{location}，{character}遇到了{entity}。{entity_description}",
                    "{character}在{location}的路上，突然遇到了{entity}。",
                    "当{character}正在{activity}时，{entity}出现了。",
                    "{weather_condition}的{time_of_day}，{character}在{location}发现了{discovery}。"
                ],
                entities: [
                    { name: "神秘商人", description: "穿着华丽长袍的商人，眼中闪烁着智慧的光芒", type: "friendly" },
                    { name: "受伤的旅者", description: "一个看起来疲惫不堪的旅行者，似乎需要帮助", type: "neutral" },
                    { name: "野生动物", description: "一只看起来有些饥饿的野兽，正警惕地观察着你", type: "hostile" },
                    { name: "迷路的孩子", description: "一个看起来害怕的小孩，似乎与家人走散了", type: "quest" },
                    { name: "古老的雕像", description: "一座布满青苔的古老雕像，散发着神秘的气息", type: "mystery" },
                    { name: "废弃的营地", description: "一个看起来最近被遗弃的营地，还有余温的篝火", type: "exploration" }
                ],
                activities: [
                    "寻找食物", "休息", "观察周围环境", "整理装备", "思考下一步行动", "练习技能"
                ],
                discoveries: [
                    "一个隐藏的洞穴", "闪闪发光的物品", "奇怪的符号", "一条隐秘的小径", "古老的遗迹", "稀有的植物"
                ],
                weather_conditions: [
                    "阳光明媚", "阴云密布", "细雨蒙蒙", "大雾弥漫", "微风习习", "烈日炎炎"
                ],
                time_of_days: [
                    "清晨", "上午", "中午", "下午", "黄昏", "夜晚"
                ]
            },

            // 挑战类事件模板
            challenge: {
                templates: [
                    "{character}面临着{challenge_type}的挑战：{challenge_description}",
                    "前方的道路被{obstacle}阻挡，{character}必须找到解决方法。",
                    "{character}发现了{puzzle_type}，解开它可能会有{reward_hint}。",
                    "一个{difficulty_level}的{challenge_category}出现在{character}面前。"
                ],
                challenge_types: [
                    "智力", "体力", "勇气", "技巧", "耐心", "创造力"
                ],
                obstacles: [
                    "一条湍急的河流", "一堵高墙", "茂密的荆棘丛", "一个深坑", "坍塌的桥梁", "迷雾笼罩的区域"
                ],
                puzzle_types: [
                    "古老的机关", "神秘的密码", "复杂的迷宫", "魔法阵", "古文字谜题", "数字密码锁"
                ],
                reward_hints: [
                    "丰厚的奖励", "珍贵的知识", "强大的力量", "隐藏的宝藏", "重要的线索", "神秘的能力"
                ]
            },

            // 社交类事件模板
            social: {
                templates: [
                    "{character}遇到了{npc_type}，他们{npc_action}。",
                    "在{social_location}，{character}被卷入了{social_situation}。",
                    "{npc_type}向{character}提出了{request_type}的请求。",
                    "{character}目睹了{social_event}，需要决定是否介入。"
                ],
                npc_types: [
                    "村民", "贵族", "士兵", "学者", "艺术家", "工匠", "农夫", "商人", "盗贼", "牧师"
                ],
                npc_actions: [
                    "正在争论", "看起来很困扰", "在庆祝什么", "似乎在寻找什么", "正在交易", "在讲述故事"
                ],
                social_situations: [
                    "一场激烈的辩论", "一个庆祝活动", "一起纠纷", "一场交易谈判", "一个秘密会议", "一次公开演讲"
                ],
                request_types: [
                    "帮助", "保护", "寻找", "传递消息", "解决问题", "提供建议"
                ]
            },

            // 探索类事件模板
            exploration: {
                templates: [
                    "{character}在{exploration_location}发现了{discovery_type}。",
                    "探索{location}时，{character}注意到{observation}。",
                    "{character}的{exploration_method}让他们找到了{finding}。",
                    "在{location}的{specific_area}，{character}遇到了{exploration_event}。"
                ],
                discovery_types: [
                    "一个隐藏的房间", "古老的文献", "珍贵的矿物", "神秘的装置", "失落的宝藏", "重要的线索"
                ],
                observations: [
                    "墙上的奇怪标记", "地面上的脚印", "空气中的异味", "远处的光芒", "不寻常的声音", "温度的变化"
                ],
                exploration_methods: [
                    "仔细观察", "敏锐的听觉", "丰富的经验", "直觉", "系统性搜索", "意外发现"
                ],
                findings: [
                    "一条秘密通道", "有价值的物品", "重要信息", "隐藏的危险", "新的区域", "古老的秘密"
                ]
            }
        };
    }

    /**
     * 加载角色特质数据
     */
    loadCharacterTraits() {
        return {
            warrior: {
                preferred_actions: ["直接对抗", "保护他人", "勇敢面对"],
                personality: ["勇敢", "直接", "保护欲强"],
                speech_style: "坚定而直接"
            },
            mage: {
                preferred_actions: ["研究分析", "使用魔法", "寻求知识"],
                personality: ["好奇", "理性", "追求真理"],
                speech_style: "深思熟虑"
            },
            rogue: {
                preferred_actions: ["潜行观察", "寻找机会", "避免正面冲突"],
                personality: ["机敏", "谨慎", "独立"],
                speech_style: "简洁而机智"
            },
            priest: {
                preferred_actions: ["帮助他人", "寻求和平", "提供治疗"],
                personality: ["慈悲", "耐心", "有信仰"],
                speech_style: "温和而智慧"
            },
            ranger: {
                preferred_actions: ["观察环境", "与自然和谐", "追踪线索"],
                personality: ["独立", "观察力强", "热爱自然"],
                speech_style: "简洁而实用"
            },
            noble: {
                preferred_actions: ["外交谈判", "展示权威", "寻求优雅解决"],
                personality: ["自信", "有教养", "重视荣誉"],
                speech_style: "优雅而权威"
            }
        };
    }

    /**
     * 加载地点数据
     */
    loadLocationData() {
        return {
            newbie_village: {
                name: "新手村",
                atmosphere: "安全而宁静",
                common_events: ["daily_life", "simple_quests", "social_interactions"],
                danger_level: 1,
                resources: ["基础装备", "简单任务", "友善NPC"]
            },
            forest: {
                name: "神秘森林",
                atmosphere: "幽深而神秘",
                common_events: ["wildlife_encounters", "hidden_treasures", "natural_obstacles"],
                danger_level: 3,
                resources: ["草药", "野生动物", "隐藏路径"]
            },
            mountain: {
                name: "崎岖山脉",
                atmosphere: "险峻而壮观",
                common_events: ["climbing_challenges", "cave_exploration", "weather_hazards"],
                danger_level: 4,
                resources: ["矿物", "高地植物", "山洞"]
            },
            ruins: {
                name: "古代遗迹",
                atmosphere: "神秘而危险",
                common_events: ["ancient_puzzles", "magical_phenomena", "guardian_encounters"],
                danger_level: 5,
                resources: ["古代知识", "魔法物品", "历史线索"]
            }
        };
    }

    /**
     * 加载叙事元素
     */
    loadNarrativeElements() {
        return {
            weather_conditions: [
                "阳光明媚", "阴云密布", "细雨绵绵", "大雾弥漫", "狂风呼啸", "雪花飞舞"
            ],
            time_of_day: [
                "清晨", "上午", "正午", "下午", "黄昏", "夜晚", "深夜", "黎明前"
            ],
            emotions: [
                "兴奋", "紧张", "好奇", "担忧", "希望", "困惑", "决心", "平静"
            ],
            difficulty_levels: [
                "简单", "普通", "困难", "极难", "传说级"
            ]
        };
    }

    /**
     * 生成动态事件
     */
    generateEvent(gameState, eventType = null) {
        const character = gameState.character;
        const location = gameState.currentLocation;
        const context = this.analyzeContext(gameState);
        
        // 如果没有指定事件类型，根据上下文智能选择
        if (!eventType) {
            eventType = this.selectEventType(context);
        }
        
        const event = this.createEventFromTemplate(eventType, character, location, context);
        
        // 添加动态选择
        event.choices = this.generateChoices(event, character, context);
        
        // 记录到历史
        this.eventHistory.push(event);
        
        console.log('🎲 AI生成事件:', event.title);
        return event;
    }

    /**
     * 分析游戏上下文
     */
    analyzeContext(gameState) {
        const character = gameState.character;
        const recentEvents = this.eventHistory.slice(-5);
        
        return {
            character_level: character.level,
            character_profession: character.profession,
            character_health: character.status.hp / character.getMaxHP(),
            character_wealth: character.status.wealth,
            character_reputation: character.status.reputation,
            location_danger: this.locationData[gameState.currentLocation]?.danger_level || 1,
            recent_event_types: recentEvents.map(e => e.type),
            game_time: gameState.gameTime,
            total_events: this.eventHistory.length
        };
    }

    /**
     * 智能选择事件类型
     */
    selectEventType(context) {
        const weights = {
            encounter: 30,
            challenge: 25,
            social: 20,
            exploration: 25
        };
        
        // 根据上下文调整权重
        if (context.character_health < 0.3) {
            weights.encounter -= 10; // 低血量时减少遭遇
            weights.social += 5; // 增加社交机会
        }
        
        if (context.character_wealth < 50) {
            weights.exploration += 10; // 缺钱时增加探索
        }
        
        if (context.location_danger > 3) {
            weights.challenge += 10; // 危险地区增加挑战
        }
        
        // 避免重复事件类型
        const recentTypes = context.recent_event_types;
        if (recentTypes.length > 0) {
            const lastType = recentTypes[recentTypes.length - 1];
            weights[lastType] -= 15;
        }
        
        return this.weightedRandomSelect(weights);
    }

    /**
     * 权重随机选择
     */
    weightedRandomSelect(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [key, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return key;
            }
        }
        
        return Object.keys(weights)[0]; // fallback
    }

    /**
     * 从模板创建事件
     */
    createEventFromTemplate(eventType, character, location, context) {
        const template = this.eventTemplates[eventType];
        const locationData = this.locationData[location];
        
        // 选择模板
        const textTemplate = this.randomSelect(template.templates);
        
        // 填充变量
        let description = textTemplate;
        const variables = this.extractVariables(textTemplate);
        
        variables.forEach(variable => {
            const value = this.getVariableValue(variable, template, character, locationData, context);
            description = description.replace(`{${variable}}`, value);
        });
        
        // 生成标题
        const title = this.generateEventTitle(eventType, context);
        
        return {
            id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            description,
            type: eventType,
            context: context,
            generated: true,
            timestamp: Date.now()
        };
    }

    /**
     * 提取模板变量
     */
    extractVariables(template) {
        const matches = template.match(/\{([^}]+)\}/g);
        return matches ? matches.map(match => match.slice(1, -1)) : [];
    }

    /**
     * 获取变量值
     */
    getVariableValue(variable, template, character, locationData, context) {
        switch (variable) {
            case 'character':
                return character.name;
            case 'location':
                return locationData?.name || '未知地点';
            case 'entity':
                const entity = this.randomSelect(template.entities || []);
                return entity.name || '神秘存在';
            case 'entity_description':
                const entityDesc = this.randomSelect(template.entities || []);
                return entityDesc.description || '一个神秘的存在';
            case 'activity':
                return this.randomSelect(template.activities || ['探索']);
            case 'discovery':
                return this.randomSelect(template.discoveries || ['有趣的东西']);
            case 'challenge_type':
                return this.randomSelect(template.challenge_types || ['未知']);
            case 'obstacle':
                return this.randomSelect(template.obstacles || ['障碍']);
            case 'weather_condition':
                return this.randomSelect(template.weather_conditions || this.narrativeElements.weather_conditions);
            case 'time_of_day':
                return this.randomSelect(template.time_of_days || this.narrativeElements.time_of_day);
            case 'difficulty_level':
                return this.randomSelect(this.narrativeElements.difficulty_levels);
            case 'puzzle_type':
                return this.randomSelect(template.puzzle_types || ['谜题']);
            case 'reward_hint':
                return this.randomSelect(template.reward_hints || ['奖励']);
            case 'npc_type':
                return this.randomSelect(template.npc_types || ['路人']);
            case 'npc_action':
                return this.randomSelect(template.npc_actions || ['在做什么']);
            case 'social_location':
                return this.randomSelect(['市场', '酒馆', '广场', '街道']);
            case 'social_situation':
                return this.randomSelect(['争论', '庆祝', '交易', '聚会']);
            case 'request_type':
                return this.randomSelect(['帮助', '信息', '物品', '服务']);
            case 'social_event':
                return this.randomSelect(['争吵', '事故', '庆典', '交易']);
            case 'challenge_description':
                return this.randomSelect(['需要智慧解决', '需要勇气面对', '需要技巧处理', '需要耐心等待']);
            case 'challenge_category':
                return this.randomSelect(['谜题', '战斗', '谈判', '探索']);
            case 'encounter_action':
                return this.randomSelect(['遇到了意外', '发现了秘密', '听到了声音', '看到了光芒']);
            case 'unexpected_event':
                return this.randomSelect(['意外发生', '奇迹出现', '危险降临', '机会来临']);
            default:
                console.warn(`未知变量: ${variable}`);
                return `[${variable}]`; // 返回变量名作为占位符，便于调试
        }
    }

    /**
     * 生成事件标题
     */
    generateEventTitle(eventType, context) {
        const titleTemplates = {
            encounter: ['意外遭遇', '路上的相遇', '突然出现', '神秘邂逅', '不期而遇'],
            challenge: ['面临挑战', '考验时刻', '困难抉择', '技能试炼', '智慧考验'],
            social: ['人际交往', '社交场合', '对话时刻', '人情世故', '交流机会'],
            exploration: ['新的发现', '探索收获', '意外发现', '隐秘揭示', '探险成果']
        };
        
        const templates = titleTemplates[eventType] || ['神秘事件'];
        return this.randomSelect(templates);
    }

    /**
     * 生成动态选择
     */
    generateChoices(event, character, context) {
        const choices = [];
        const characterTraits = this.characterTraits[character.profession];
        
        // 基于职业生成首选选择
        const preferredAction = this.randomSelect(characterTraits.preferred_actions);
        choices.push({
            text: preferredAction,
            requirement: this.getProfessionMainStat(character.profession),
            difficulty: this.calculateDifficulty(context),
            effect: this.generatePositiveEffect(context)
        });
        
        // 生成通用选择
        choices.push({
            text: '仔细观察情况',
            requirement: 'intelligence',
            difficulty: Math.max(20, context.location_danger * 10),
            effect: { experience: 5, reputation: 1 }
        });
        
        // 生成风险/收益选择
        if (Math.random() > 0.5) {
            choices.push({
                text: '冒险尝试',
                requirement: 'luck',
                difficulty: context.location_danger * 15,
                effect: this.generateRiskyEffect(context),
                risk: true
            });
        }
        
        // 生成安全选择
        choices.push({
            text: '谨慎离开',
            effect: { fatigue: 5 },
            safe: true
        });
        
        return choices;
    }

    /**
     * 获取职业主属性
     */
    getProfessionMainStat(profession) {
        const mainStats = {
            warrior: 'combat',
            mage: 'magic',
            rogue: 'exploration',
            priest: 'social',
            ranger: 'survival',
            noble: 'social'
        };
        return mainStats[profession] || 'combat';
    }

    /**
     * 计算难度
     */
    calculateDifficulty(context) {
        let baseDifficulty = 30;
        baseDifficulty += context.location_danger * 10;
        baseDifficulty += Math.max(0, (context.character_level - 1) * 5);
        
        // 添加随机变化
        baseDifficulty += Math.random() * 20 - 10;
        
        return Math.max(10, Math.min(90, baseDifficulty));
    }

    /**
     * 生成正面效果
     */
    generatePositiveEffect(context) {
        const effects = {};
        
        // 基础奖励
        effects.experience = Math.floor(5 + context.location_danger * 2 + Math.random() * 10);
        
        // 随机额外奖励
        if (Math.random() > 0.7) {
            effects.wealth = Math.floor(10 + context.location_danger * 5 + Math.random() * 20);
        }
        
        if (Math.random() > 0.8) {
            effects.reputation = Math.floor(1 + Math.random() * 3);
        }
        
        if (Math.random() > 0.9) {
            effects.hp = Math.floor(10 + Math.random() * 20);
        }
        
        return effects;
    }

    /**
     * 生成风险效果
     */
    generateRiskyEffect(context) {
        const effects = {};
        
        // 高风险高回报
        if (Math.random() > 0.4) {
            // 成功时的大奖励
            effects.experience = Math.floor(15 + context.location_danger * 5 + Math.random() * 20);
            effects.wealth = Math.floor(30 + context.location_danger * 10 + Math.random() * 50);
            
            if (Math.random() > 0.7) {
                effects.reputation = Math.floor(3 + Math.random() * 5);
            }
        } else {
            // 失败时的惩罚
            effects.hp = -Math.floor(10 + context.location_danger * 5);
            effects.fatigue = Math.floor(10 + Math.random() * 10);
        }
        
        return effects;
    }

    /**
     * 随机选择数组元素
     */
    randomSelect(array) {
        if (!array || array.length === 0) return '';
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * 生成连续剧情事件
     */
    generateSequentialEvent(previousEvent, gameState) {
        // 基于前一个事件生成后续事件
        const context = this.analyzeContext(gameState);
        context.previous_event = previousEvent;
        
        // 增加连续性
        let eventType = previousEvent.type;
        if (Math.random() > 0.6) {
            // 30%概率改变事件类型，保持故事多样性
            eventType = this.selectEventType(context);
        }
        
        const event = this.generateEvent(gameState, eventType);
        
        // 添加连续性描述
        if (previousEvent.type === event.type) {
            event.description = `继续之前的${previousEvent.title}，` + event.description;
        }
        
        return event;
    }

    /**
     * 获取事件统计
     */
    getEventStatistics() {
        const stats = {
            total_generated: this.eventHistory.length,
            by_type: {},
            average_choices: 0,
            unique_events: new Set(this.eventHistory.map(e => e.title)).size
        };
        
        this.eventHistory.forEach(event => {
            stats.by_type[event.type] = (stats.by_type[event.type] || 0) + 1;
            if (event.choices) {
                stats.average_choices += event.choices.length;
            }
        });
        
        stats.average_choices = stats.average_choices / this.eventHistory.length || 0;
        
        return stats;
    }
}
