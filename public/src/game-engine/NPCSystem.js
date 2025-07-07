/**
 * 动态NPC系统 - 基于LLM生成的智能NPC
 * 参考北大侠客行的NPC设计理念
 */
class NPCSystem {
    constructor() {
        this.npcs = new Map();
        this.npcTemplates = this.initializeNPCTemplates();
        this.relationshipMatrix = new Map(); // NPC之间的关系网络
        this.worldEvents = []; // 影响NPC的世界事件
        
        console.log('🧙‍♂️ 动态NPC系统初始化完成');
    }

    /**
     * 初始化NPC模板（参考侠客行的经典NPC）
     */
    initializeNPCTemplates() {
        return {
            // 武林高手类
            master: {
                types: ['剑圣', '刀王', '拳皇', '掌门', '宗师'],
                personality: ['高傲', '正直', '神秘', '严厉', '慈祥'],
                skills: ['绝世武功', '内功心法', '兵器精通'],
                relationships: ['师父', '前辈', '敌人', '朋友'],
                locations: ['名山大川', '隐秘洞府', '武林圣地']
            },
            
            // 江湖人士类
            wanderer: {
                types: ['游侠', '商人', '医师', '学者', '艺人'],
                personality: ['豪爽', '狡猾', '善良', '贪婪', '风趣'],
                skills: ['江湖经验', '特殊技艺', '人脉关系'],
                relationships: ['朋友', '生意伙伴', '信息贩子'],
                locations: ['客栈', '市集', '渡口', '山道']
            },
            
            // 门派弟子类
            disciple: {
                types: ['内门弟子', '外门弟子', '记名弟子', '叛徒'],
                personality: ['忠诚', '野心', '单纯', '复杂'],
                skills: ['门派武功', '门派知识', '人际关系'],
                relationships: ['师兄弟', '竞争对手', '密友'],
                locations: ['门派驻地', '练功场', '藏经阁']
            },
            
            // 反派角色类
            villain: {
                types: ['魔教长老', '邪派掌门', '江洋大盗', '叛徒'],
                personality: ['邪恶', '狡诈', '残忍', '野心勃勃'],
                skills: ['邪门武功', '阴谋诡计', '势力网络'],
                relationships: ['仇敌', '手下', '合作者'],
                locations: ['邪教总坛', '匪窝', '暗黑之地']
            }
        };
    }

    /**
     * 基于LLM生成动态NPC
     */
    async generateDynamicNPC(location, playerState, context = {}) {
        const npcType = this.selectNPCType(location, playerState);
        const template = this.npcTemplates[npcType];
        
        const prompt = this.buildNPCPrompt(template, location, playerState, context);
        
        try {
            // 调用LLM生成NPC
            const npcData = await this.callLLMForNPC(prompt);
            const npc = this.createNPCFromData(npcData, npcType, location);
            
            // 建立NPC关系网络
            this.establishNPCRelationships(npc);
            
            // 存储NPC
            this.npcs.set(npc.id, npc);
            
            console.log(`🧙‍♂️ 生成动态NPC: ${npc.name} (${npc.title})`);
            return npc;
            
        } catch (error) {
            console.warn('NPC生成失败，使用模板NPC:', error);
            return this.generateTemplateNPC(npcType, location);
        }
    }

    /**
     * 构建NPC生成提示词
     */
    buildNPCPrompt(template, location, playerState, context) {
        return `请为武侠MUD游戏生成一个动态NPC角色。

【环境信息】
- 地点：${location}
- 玩家等级：${playerState.character.level}
- 玩家职业：${playerState.character.getProfessionName()}
- 当前时间：${context.gameTime || '白天'}

【NPC类型】
- 基础类型：${template.types.join('、')}
- 可能性格：${template.personality.join('、')}
- 可能技能：${template.skills.join('、')}

【生成要求】
1. 符合${location}的环境特色
2. 与玩家等级相匹配的实力设定
3. 有独特的个人背景故事
4. 具有明确的行为动机和目标
5. 能够与玩家产生有意义的互动

【输出格式】
请严格按照JSON格式返回：
{
  "name": "NPC姓名",
  "title": "称号或身份",
  "description": "外貌和气质描述（100-150字）",
  "background": "背景故事（150-200字）",
  "personality": {
    "traits": ["性格特点1", "性格特点2"],
    "motivation": "行为动机",
    "goals": ["目标1", "目标2"]
  },
  "abilities": {
    "martial_arts": ["武功1", "武功2"],
    "special_skills": ["特殊技能1"],
    "power_level": 85
  },
  "relationships": {
    "allies": ["盟友关系"],
    "enemies": ["敌对关系"],
    "neutral": ["中性关系"]
  },
  "dialogue_style": "说话风格描述",
  "current_activity": "当前在做什么",
  "interaction_options": [
    {
      "action": "对话",
      "description": "与NPC交谈",
      "requirements": []
    },
    {
      "action": "切磋",
      "description": "请教武功",
      "requirements": ["等级>=5"]
    }
  ]
}`;
    }

    /**
     * 选择NPC类型
     */
    selectNPCType(location, playerState) {
        const locationNPCMap = {
            '新手村': ['wanderer', 'disciple'],
            '小镇': ['wanderer', 'master', 'disciple'],
            '森林': ['wanderer', 'villain'],
            '山脉': ['master', 'wanderer'],
            '遗迹': ['master', 'villain'],
            '门派': ['master', 'disciple'],
            '江湖': ['wanderer', 'villain', 'master']
        };
        
        const possibleTypes = locationNPCMap[location] || ['wanderer'];
        
        // 根据玩家等级调整NPC类型概率
        let weights = {};
        possibleTypes.forEach(type => {
            weights[type] = this.calculateNPCTypeWeight(type, playerState);
        });
        
        return this.weightedRandomSelect(weights);
    }

    /**
     * 计算NPC类型权重
     */
    calculateNPCTypeWeight(npcType, playerState) {
        const level = playerState.character.level;
        let weight = 1.0;
        
        switch (npcType) {
            case 'master':
                weight = level >= 10 ? 0.3 : 0.1; // 高等级更容易遇到高手
                break;
            case 'villain':
                weight = level >= 5 ? 0.2 : 0.05; // 有一定实力才会遇到反派
                break;
            case 'disciple':
                weight = level <= 15 ? 0.4 : 0.2; // 低等级更容易遇到同门
                break;
            case 'wanderer':
                weight = 0.5; // 江湖人士最常见
                break;
        }
        
        return weight;
    }

    /**
     * 创建NPC对象
     */
    createNPCFromData(npcData, type, location) {
        return {
            id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            location: location,
            ...npcData,
            lastInteraction: 0,
            relationshipWithPlayer: 0, // -100到100的好感度
            isActive: true,
            createdAt: Date.now()
        };
    }

    /**
     * 建立NPC关系网络
     */
    establishNPCRelationships(newNPC) {
        // 与现有NPC建立关系
        for (const [id, existingNPC] of this.npcs) {
            if (existingNPC.location === newNPC.location) {
                const relationship = this.calculateNPCRelationship(newNPC, existingNPC);
                
                if (relationship !== 'none') {
                    this.relationshipMatrix.set(`${newNPC.id}_${id}`, relationship);
                    this.relationshipMatrix.set(`${id}_${newNPC.id}`, relationship);
                }
            }
        }
    }

    /**
     * 计算NPC之间的关系
     */
    calculateNPCRelationship(npc1, npc2) {
        // 同门派的关系
        if (npc1.type === 'disciple' && npc2.type === 'disciple') {
            return Math.random() < 0.7 ? 'ally' : 'rival';
        }
        
        // 正邪对立
        if ((npc1.type === 'master' && npc2.type === 'villain') ||
            (npc1.type === 'villain' && npc2.type === 'master')) {
            return 'enemy';
        }
        
        // 江湖人士之间
        if (npc1.type === 'wanderer' && npc2.type === 'wanderer') {
            const rand = Math.random();
            if (rand < 0.3) return 'ally';
            if (rand < 0.1) return 'enemy';
        }
        
        return 'neutral';
    }

    /**
     * 获取地点的活跃NPC
     */
    getActiveNPCsInLocation(location) {
        return Array.from(this.npcs.values()).filter(npc => 
            npc.location === location && npc.isActive
        );
    }

    /**
     * NPC与玩家互动
     */
    async interactWithNPC(npcId, action, playerState) {
        const npc = this.npcs.get(npcId);
        if (!npc) return null;
        
        // 更新互动时间
        npc.lastInteraction = Date.now();
        
        // 基于LLM生成动态对话和互动结果
        const interactionPrompt = this.buildInteractionPrompt(npc, action, playerState);
        
        try {
            const result = await this.callLLMForInteraction(interactionPrompt);
            
            // 更新NPC与玩家的关系
            this.updatePlayerRelationship(npc, result.relationshipChange || 0);
            
            return result;
            
        } catch (error) {
            console.warn('NPC互动生成失败:', error);
            return this.generateTemplateInteraction(npc, action);
        }
    }

    /**
     * 更新玩家与NPC的关系
     */
    updatePlayerRelationship(npc, change) {
        npc.relationshipWithPlayer = Math.max(-100, 
            Math.min(100, npc.relationshipWithPlayer + change)
        );
    }

    /**
     * 调用LLM生成NPC（占位符方法）
     */
    async callLLMForNPC(prompt) {
        // 这里应该调用后端API
        // 暂时返回模板数据
        return this.generateTemplateNPCData();
    }

    /**
     * 调用LLM生成互动（占位符方法）
     */
    async callLLMForInteraction(prompt) {
        // 这里应该调用后端API
        // 暂时返回模板互动
        return {
            dialogue: "这位少侠，江湖路远，多加小心。",
            result: "获得了一些江湖经验",
            effects: {
                status: { experience: 10 }
            },
            relationshipChange: 5
        };
    }

    /**
     * 生成模板NPC数据
     */
    generateTemplateNPCData() {
        return {
            name: "神秘老者",
            title: "江湖前辈",
            description: "一位白发苍苍的老者，眼中闪烁着智慧的光芒，身上散发着深不可测的气息。",
            background: "这位老者在江湖中游历多年，见证了无数风云变幻，拥有丰富的江湖经验和深厚的武功底蕴。",
            personality: {
                traits: ["睿智", "神秘"],
                motivation: "寻找有缘人传授武功",
                goals: ["指点后辈", "维护江湖正道"]
            },
            abilities: {
                martial_arts: ["太极拳法", "内功心法"],
                special_skills: ["医术", "占卜"],
                power_level: 90
            },
            relationships: {
                allies: ["正派武林人士"],
                enemies: ["邪教妖人"],
                neutral: ["普通江湖人士"]
            },
            dialogue_style: "说话缓慢而有深意，喜欢用比喻",
            current_activity: "在此地静坐修炼",
            interaction_options: [
                {
                    action: "请教",
                    description: "向前辈请教江湖经验",
                    requirements: []
                },
                {
                    action: "切磋",
                    description: "请求指点武功",
                    requirements: ["等级>=3"]
                }
            ]
        };
    }

    /**
     * 权重随机选择
     */
    weightedRandomSelect(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [item, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return item;
            }
        }
        
        return Object.keys(weights)[0];
    }
}

// 全局实例
window.NPCSystem = NPCSystem;
