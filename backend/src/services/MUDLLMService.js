const LLMService = require('./LLMService');

/**
 * MUD专用LLM服务 - 专门为文字MUD游戏优化
 * 参考北大侠客行等经典MUD的内容生成
 */
class MUDLLMService extends LLMService {
    constructor() {
        super();
        this.mudPromptTemplates = this.initializeMUDPrompts();
        this.characterMemory = new Map(); // 角色记忆系统
        this.worldState = this.initializeWorldState();
        
        console.log('🏮 MUD专用LLM服务初始化完成');
    }

    /**
     * 初始化MUD专用提示词模板
     */
    initializeMUDPrompts() {
        return {
            // NPC对话生成
            npc_dialogue: {
                system: "你是一个专业的武侠小说作家，擅长创造生动的NPC对话和互动。你需要根据NPC的性格、背景和当前情况生成符合其身份的对话内容。",
                template: `为武侠MUD游戏生成NPC对话。

【NPC信息】
- 姓名：{npc_name}
- 身份：{npc_title}
- 性格：{npc_personality}
- 背景：{npc_background}
- 当前状态：{npc_current_state}

【玩家信息】
- 姓名：{player_name}
- 等级：{player_level}
- 门派：{player_sect}
- 声望：{player_reputation}
- 与NPC关系：{relationship_status}

【对话场景】
- 地点：{location}
- 时间：{time_context}
- 触发原因：{trigger_reason}

请生成符合武侠风格的对话，包含：
1. NPC的开场白（体现其性格和身份）
2. 可能的对话选项（3-4个）
3. 每个选项可能的后续发展

输出JSON格式：
{
  "opening_dialogue": "NPC开场对话",
  "dialogue_options": [
    {
      "option": "对话选项1",
      "npc_response": "NPC可能的回应",
      "consequences": "可能的后果"
    }
  ],
  "mood": "NPC当前情绪",
  "relationship_change": 0
}`
            },

            // 门派事件生成
            sect_event: {
                system: "你是武侠世界的门派事务专家，深谙各大门派的传统、规矩和内部运作。你需要生成符合门派特色的事件和任务。",
                template: `为武侠MUD游戏生成门派相关事件。

【门派信息】
- 门派名称：{sect_name}
- 门派类型：{sect_type}
- 门派特色：{sect_specialty}
- 当前状况：{sect_current_state}

【玩家状态】
- 门派地位：{player_sect_rank}
- 门派贡献：{player_contribution}
- 门派声望：{player_sect_reputation}

【事件类型】{event_type}

请生成一个符合门派传统的事件：
{
  "title": "事件标题",
  "description": "详细描述（200-300字）",
  "type": "事件类型",
  "participants": ["参与的NPC"],
  "objectives": [
    {
      "description": "目标描述",
      "requirements": "完成条件"
    }
  ],
  "rewards": {
    "sect_contribution": 50,
    "sect_reputation": 25,
    "skills": ["可能获得的技能"],
    "items": ["可能获得的物品"]
  },
  "consequences": {
    "success": "成功后果",
    "failure": "失败后果"
  },
  "time_limit": "时间限制"
}`
            },

            // 江湖传闻生成
            jianghu_rumor: {
                system: "你是江湖中消息最灵通的说书人，知晓天下大事小情。你需要生成符合当前江湖形势的传闻和消息。",
                template: `为武侠MUD游戏生成江湖传闻。

【当前江湖形势】
- 主要门派关系：{sect_relations}
- 近期重大事件：{recent_events}
- 玩家影响力：{player_influence}

【传闻类型】{rumor_type}

请生成一个江湖传闻：
{
  "title": "传闻标题",
  "content": "传闻内容（150-250字）",
  "source": "消息来源",
  "reliability": "可信度（1-10）",
  "impact": {
    "sects": ["影响的门派"],
    "regions": ["影响的地区"],
    "npcs": ["涉及的重要NPC"]
  },
  "player_relevance": "与玩家的相关性",
  "potential_opportunities": ["可能带来的机会"],
  "verification_method": "验证方法"
}`
            },

            // 武功秘籍生成
            martial_arts: {
                system: "你是武学宗师，精通各派武功的精髓。你需要创造符合武侠传统的武功招式和心法。",
                template: `为武侠MUD游戏生成武功秘籍。

【武功类型】{martial_type}
【门派风格】{sect_style}
【等级要求】{level_requirement}
【玩家属性】{player_attributes}

请生成一套完整的武功：
{
  "name": "武功名称",
  "type": "武功类型",
  "description": "武功描述和背景",
  "requirements": {
    "level": 10,
    "attributes": {"strength": 15},
    "prerequisites": ["前置技能"]
  },
  "techniques": [
    {
      "name": "招式名称",
      "description": "招式描述",
      "effects": "战斗效果",
      "power": 85
    }
  ],
  "training_method": "修炼方法",
  "mastery_levels": [
    {
      "level": "初窥门径",
      "description": "初级效果"
    }
  ],
  "special_effects": ["特殊效果"],
  "lore": "武功传说和历史"
}`
            },

            // 江湖奇遇生成
            adventure_encounter: {
                system: "你是江湖奇遇的编织者，擅长创造充满悬念和机遇的冒险故事。每个奇遇都应该有深度和后续发展的可能。",
                template: `为武侠MUD游戏生成江湖奇遇。

【环境信息】
- 地点：{location}
- 时间：{time_period}
- 天气：{weather}
- 玩家状态：{player_state}

【奇遇类型】{encounter_type}

请生成一个引人入胜的江湖奇遇：
{
  "title": "奇遇标题",
  "initial_description": "初始场景描述（200-300字）",
  "mystery_elements": ["神秘元素"],
  "key_npcs": [
    {
      "name": "NPC姓名",
      "role": "在奇遇中的作用",
      "secrets": "隐藏的秘密"
    }
  ],
  "investigation_clues": [
    {
      "clue": "线索内容",
      "discovery_method": "发现方法",
      "leads_to": "指向的方向"
    }
  ],
  "possible_outcomes": [
    {
      "condition": "触发条件",
      "result": "结果描述",
      "rewards": "奖励内容"
    }
  ],
  "long_term_consequences": "长期影响",
  "sequel_potential": "后续发展可能性"
}`
            }
        };
    }

    /**
     * 初始化世界状态
     */
    initializeWorldState() {
        return {
            currentEvents: [], // 当前发生的世界事件
            sectRelations: {}, // 门派关系状态
            importantNPCs: {}, // 重要NPC状态
            worldTrends: [], // 世界发展趋势
            seasonalEvents: [], // 季节性事件
            lastUpdate: Date.now()
        };
    }

    /**
     * 生成NPC对话
     */
    async generateNPCDialogue(npcInfo, playerInfo, context) {
        const prompt = this.buildPromptFromTemplate('npc_dialogue', {
            npc_name: npcInfo.name,
            npc_title: npcInfo.title,
            npc_personality: npcInfo.personality.traits.join('、'),
            npc_background: npcInfo.background,
            npc_current_state: npcInfo.current_activity,
            player_name: playerInfo.name,
            player_level: playerInfo.level,
            player_sect: playerInfo.sect || '无门派',
            player_reputation: this.formatReputation(playerInfo.reputation),
            relationship_status: this.getRelationshipDescription(npcInfo.relationshipWithPlayer),
            location: context.location,
            time_context: context.timeContext || '白天',
            trigger_reason: context.triggerReason || '偶然相遇'
        });

        try {
            const response = await this.callLLMAPI(prompt, 'npc_dialogue');
            return this.parseAndValidateResponse(response, 'npc_dialogue');
        } catch (error) {
            console.error('NPC对话生成失败:', error);
            return this.generateFallbackDialogue(npcInfo, playerInfo);
        }
    }

    /**
     * 生成门派事件
     */
    async generateSectEvent(sectInfo, playerSectStatus, eventType = 'mission') {
        const prompt = this.buildPromptFromTemplate('sect_event', {
            sect_name: sectInfo.name,
            sect_type: sectInfo.type,
            sect_specialty: sectInfo.specialty.join('、'),
            sect_current_state: this.getSectCurrentState(sectInfo),
            player_sect_rank: sectInfo.ranks[playerSectStatus.rank],
            player_contribution: playerSectStatus.contribution,
            player_sect_reputation: playerSectStatus.reputation,
            event_type: eventType
        });

        try {
            const response = await this.callLLMAPI(prompt, 'sect_event');
            return this.parseAndValidateResponse(response, 'sect_event');
        } catch (error) {
            console.error('门派事件生成失败:', error);
            return this.generateFallbackSectEvent(sectInfo, eventType);
        }
    }

    /**
     * 生成江湖传闻
     */
    async generateJianghuRumor(worldContext, rumorType = 'general') {
        const prompt = this.buildPromptFromTemplate('jianghu_rumor', {
            sect_relations: this.formatSectRelations(worldContext.sectRelations),
            recent_events: worldContext.recentEvents.join('；'),
            player_influence: worldContext.playerInfluence || '微不足道',
            rumor_type: rumorType
        });

        try {
            const response = await this.callLLMAPI(prompt, 'jianghu_rumor');
            return this.parseAndValidateResponse(response, 'jianghu_rumor');
        } catch (error) {
            console.error('江湖传闻生成失败:', error);
            return this.generateFallbackRumor(rumorType);
        }
    }

    /**
     * 生成武功秘籍
     */
    async generateMartialArts(martialType, sectStyle, playerLevel, playerAttributes) {
        const prompt = this.buildPromptFromTemplate('martial_arts', {
            martial_type: martialType,
            sect_style: sectStyle,
            level_requirement: playerLevel,
            player_attributes: JSON.stringify(playerAttributes)
        });

        try {
            const response = await this.callLLMAPI(prompt, 'martial_arts');
            return this.parseAndValidateResponse(response, 'martial_arts');
        } catch (error) {
            console.error('武功生成失败:', error);
            return this.generateFallbackMartialArts(martialType);
        }
    }

    /**
     * 生成江湖奇遇
     */
    async generateAdventureEncounter(location, playerState, encounterType = 'mystery') {
        const prompt = this.buildPromptFromTemplate('adventure_encounter', {
            location: location,
            time_period: this.getCurrentTimePeriod(),
            weather: this.getCurrentWeather(),
            player_state: this.formatPlayerState(playerState),
            encounter_type: encounterType
        });

        try {
            const response = await this.callLLMAPI(prompt, 'adventure_encounter');
            return this.parseAndValidateResponse(response, 'adventure_encounter');
        } catch (error) {
            console.error('江湖奇遇生成失败:', error);
            return this.generateFallbackEncounter(location, encounterType);
        }
    }

    /**
     * 构建提示词
     */
    buildPromptFromTemplate(templateName, variables) {
        const template = this.mudPromptTemplates[templateName];
        if (!template) {
            throw new Error(`未找到模板: ${templateName}`);
        }

        let prompt = template.template;
        
        // 替换变量
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{${key}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
        });

        return {
            system: template.system,
            user: prompt
        };
    }

    /**
     * 调用LLM API
     */
    async callLLMAPI(prompt, type) {
        const messages = [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
        ];

        const response = await axios.post(
            `${this.baseURL}/chat/completions`,
            {
                model: this.model,
                messages: messages,
                temperature: 0.8, // MUD内容需要更多创意
                max_tokens: 3000, // MUD内容通常更长
                top_p: 0.9
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 45000 // 更长的超时时间
            }
        );

        return response.data.choices[0].message.content;
    }

    /**
     * 解析和验证响应
     */
    parseAndValidateResponse(content, type) {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('响应中未找到JSON格式');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            return this.validateResponseStructure(parsed, type);
        } catch (error) {
            console.error(`解析${type}响应失败:`, error);
            throw error;
        }
    }

    /**
     * 验证响应结构
     */
    validateResponseStructure(data, type) {
        // 根据不同类型验证必要字段
        const requiredFields = {
            npc_dialogue: ['opening_dialogue', 'dialogue_options'],
            sect_event: ['title', 'description', 'objectives'],
            jianghu_rumor: ['title', 'content', 'reliability'],
            martial_arts: ['name', 'type', 'techniques'],
            adventure_encounter: ['title', 'initial_description', 'possible_outcomes']
        };

        const required = requiredFields[type] || [];
        const missing = required.filter(field => !data[field]);

        if (missing.length > 0) {
            throw new Error(`缺少必要字段: ${missing.join(', ')}`);
        }

        return data;
    }

    /**
     * 格式化声望信息
     */
    formatReputation(reputation) {
        if (!reputation) return '无名小卒';
        
        const total = Object.values(reputation).reduce((sum, val) => sum + val, 0);
        if (total < 100) return '初出茅庐';
        if (total < 300) return '小有名气';
        if (total < 600) return '声名鹊起';
        return '名动江湖';
    }

    /**
     * 获取关系描述
     */
    getRelationshipDescription(value) {
        if (value >= 80) return '深厚友谊';
        if (value >= 50) return '友好关系';
        if (value >= 20) return '一般关系';
        if (value >= -20) return '陌生关系';
        if (value >= -50) return '不友好';
        return '敌对关系';
    }

    /**
     * 生成备用对话
     */
    generateFallbackDialogue(npcInfo, playerInfo) {
        return {
            opening_dialogue: `${npcInfo.name}看了看${playerInfo.name}，缓缓开口说道："这位${playerInfo.level >= 10 ? '少侠' : '朋友'}，江湖路远，多加小心。"`,
            dialogue_options: [
                {
                    option: "请教江湖经验",
                    npc_response: "江湖险恶，需要时刻保持警惕。",
                    consequences: "获得一些经验"
                },
                {
                    option: "告辞离开",
                    npc_response: "去吧，愿你前程似锦。",
                    consequences: "平安离开"
                }
            ],
            mood: "平静",
            relationship_change: 0
        };
    }

    // 其他备用生成方法...
    generateFallbackSectEvent(sectInfo, eventType) {
        return {
            title: `${sectInfo.name}日常事务`,
            description: `${sectInfo.name}中有一些日常事务需要处理，这是提升门派地位的好机会。`,
            type: eventType,
            objectives: [
                {
                    description: "完成门派任务",
                    requirements: "按时完成指定任务"
                }
            ],
            rewards: {
                sect_contribution: 20,
                sect_reputation: 10
            }
        };
    }

    generateFallbackRumor(rumorType) {
        return {
            title: "江湖传闻",
            content: "最近江湖中传说有神秘高手出现，引起了各方关注。",
            source: "江湖传言",
            reliability: 5,
            impact: {
                sects: [],
                regions: ["江湖各地"],
                npcs: []
            }
        };
    }

    generateFallbackMartialArts(martialType) {
        return {
            name: "基础武功",
            type: martialType,
            description: "一套基础的武功招式",
            techniques: [
                {
                    name: "基础招式",
                    description: "简单实用的基础招式",
                    effects: "造成基础伤害",
                    power: 50
                }
            ]
        };
    }

    generateFallbackEncounter(location, encounterType) {
        return {
            title: `${location}奇遇`,
            initial_description: `在${location}中，你遇到了一些有趣的事情。`,
            possible_outcomes: [
                {
                    condition: "仔细观察",
                    result: "发现了一些线索",
                    rewards: "获得经验"
                }
            ]
        };
    }
}

module.exports = MUDLLMService;
