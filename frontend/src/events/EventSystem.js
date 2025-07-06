/**
 * 事件系统
 * 管理游戏中的各种事件触发和处理
 */
class EventSystem {
    constructor() {
        this.eventTemplates = this.loadEventTemplates();
        this.eventHistory = [];
        this.currentEvent = null;
        
        // 安全地初始化AIEventGenerator
        try {
            if (typeof AIEventGenerator !== 'undefined') {
                this.aiGenerator = new AIEventGenerator();
                console.log('✅ AIEventGenerator初始化成功');
            } else {
                console.warn('⚠️ AIEventGenerator未定义，将禁用AI事件生成');
                this.aiGenerator = null;
            }
        } catch (error) {
            console.error('❌ AIEventGenerator初始化失败:', error);
            this.aiGenerator = null;
        }
        
        // 安全地初始化LLM生成器
        try {
            if (typeof LLMEventGenerator !== 'undefined') {
                this.llmGenerator = new LLMEventGenerator();
                console.log('✅ LLM事件生成器初始化成功');
            } else {
                console.warn('⚠️ LLM事件生成器未定义');
                this.llmGenerator = null;
            }
        } catch (error) {
            console.error('❌ LLM事件生成器初始化失败:', error);
            this.llmGenerator = null;
        }
        
        this.generatedEventLoader = window.GeneratedEventLoader;
        this.useAIGeneration = this.aiGenerator !== null; // 只有在AI生成器可用时才启用
        this.aiGenerationRate = 0.7; // AI生成事件的概率
        this.useGeneratedEvents = true; // 是否使用LLM生成的事件
        this.generatedEventRate = 0.5; // LLM生成事件的概率
        
        console.log('📅 事件系统初始化完成');
    }

    /**
     * 加载事件模板
     */
    loadEventTemplates() {
        return {
            // 新手村事件
            newbie_village: [
                {
                    id: 'village_start',
                    title: '踏出第一步',
                    description: '你站在新手村的村口，准备开始你的冒险之旅。村长走过来给了你一些建议。',
                    type: 'story',
                    choices: [
                        { text: '感谢村长的建议', effect: { reputation: 5 } },
                        { text: '迫不及待地离开', effect: { fatigue: -5 } }
                    ]
                },
                {
                    id: 'village_shop',
                    title: '村庄商店',
                    description: '你来到了村庄的商店，店主热情地向你推荐各种商品。',
                    type: 'shop',
                    choices: [
                        { text: '购买基础装备', cost: 50, effect: { equipment: 'basic_sword' } },
                        { text: '购买药水', cost: 20, effect: { hp: 30 } },
                        { text: '什么都不买', effect: {} }
                    ]
                }
            ],
            
            // 森林事件
            forest: [
                {
                    id: 'forest_encounter',
                    title: '森林遭遇',
                    description: '在茂密的森林中，你听到了奇怪的声音。',
                    type: 'encounter',
                    choices: [
                        { text: '小心地调查', requirement: 'exploration', difficulty: 30 },
                        { text: '大声呼喊', requirement: 'charisma', difficulty: 25 },
                        { text: '快速离开', effect: { fatigue: 10 } }
                    ]
                },
                {
                    id: 'forest_treasure',
                    title: '发现宝箱',
                    description: '你在一棵古老的橡树下发现了一个神秘的宝箱。',
                    type: 'treasure',
                    choices: [
                        { text: '尝试开锁', requirement: 'dexterity', difficulty: 40 },
                        { text: '用力砸开', requirement: 'strength', difficulty: 35 },
                        { text: '寻找钥匙', requirement: 'intelligence', difficulty: 30 }
                    ]
                }
            ],
            
            // 战斗事件
            combat: [
                {
                    id: 'goblin_encounter',
                    title: '哥布林袭击',
                    description: '一只凶恶的哥布林挡住了你的去路，看起来想要抢夺你的财物。',
                    type: 'combat',
                    enemy: { name: '哥布林', hp: 30, attack: 15 },
                    choices: [
                        { text: '正面战斗', requirement: 'combat', difficulty: 40 },
                        { text: '使用魔法', requirement: 'magic', difficulty: 35, cost: { mp: 10 } },
                        { text: '尝试逃跑', requirement: 'dexterity', difficulty: 30 }
                    ]
                }
            ],
            
            // 社交事件
            social: [
                {
                    id: 'merchant_encounter',
                    title: '遇见商人',
                    description: '路上遇到了一位友善的商人，他似乎有话要说。',
                    type: 'social',
                    choices: [
                        { text: '友好交谈', requirement: 'social', difficulty: 25 },
                        { text: '询问消息', effect: { reputation: 2 } },
                        { text: '保持距离', effect: {} }
                    ]
                }
            ]
        };
    }

    /**
     * 触发随机事件
     */
    async triggerRandomEvent(gameState) {
        let event = null;
        let eventSource = '';
        
        // 优先级：实时LLM生成 > 数据库LLM事件 > AI生成事件 > 传统事件
        
        // 1. 尝试实时LLM生成（最高优先级，但概率较低）
        if (this.llmGenerator && this.llmGenerator.shouldUseLLM(gameState)) {
            try {
                event = await this.llmGenerator.generateEvent(gameState);
                if (event) {
                    eventSource = '实时LLM生成事件';
                    console.log('🤖 使用实时LLM生成事件');
                }
            } catch (error) {
                console.warn('实时LLM生成事件失败:', error);
            }
        }
        
        // 2. 尝试数据库中的LLM生成事件
        if (!event && this.useGeneratedEvents && Math.random() < this.generatedEventRate) {
            try {
                event = await this.getGeneratedEvent(gameState);
                if (event) {
                    eventSource = '数据库LLM生成事件';
                    console.log('🎭 使用数据库LLM生成事件');
                }
            } catch (error) {
                console.warn('数据库LLM生成事件获取失败:', error);
            }
        }
        
        // 3. 如果没有获取到LLM事件，尝试AI模板生成
        if (!event && this.useAIGeneration && this.aiGenerator && Math.random() < this.aiGenerationRate) {
            try {
                event = this.aiGenerator.generateEvent(gameState);
                if (event) {
                    eventSource = 'AI模板生成事件';
                    console.log('🤖 使用AI模板生成事件');
                }
            } catch (error) {
                console.warn('AI事件生成失败，使用传统事件:', error);
            }
        }
        
        // 4. 最后使用我设计的有意义事件
        if (!event) {
            event = this.generateMeaningfulEvent(gameState);
            eventSource = '增强传统事件';
            console.log('📋 使用增强传统事件');
        }
        
        if (event) {
            // 添加事件来源信息
            event.source = eventSource;
            console.log(`📅 处理事件: ${event.title} (来源: ${eventSource})`);
            await this.processEvent(event, gameState);
        } else {
            console.warn('⚠️ 无法获取任何事件');
        }
    }

    /**
     * 获取LLM生成的事件
     */
    async getGeneratedEvent(gameState) {
        // 首先尝试从数据库加载预生成的事件
        if (this.generatedEventLoader) {
            try {
                const character = gameState.character;
                const location = gameState.currentLocation;
                
                // 构建事件条件
                const condition = {
                    characterLevel: character.level
                };
                
                // 根据地点调整事件类型偏好
                const locationPreferences = {
                    '新手村': ['slice-of-life', 'social', 'cultural'],
                    '小镇': ['business', 'social', 'political'],
                    '森林': ['exploration', 'fantasy', 'survival'],
                    '山脉': ['survival', 'exploration', 'mythological'],
                    '遗迹': ['mythological', 'academic', 'horror'],
                };
                
                const preferredTypes = locationPreferences[location] || ['exploration', 'adventure'];
                const event = await this.generatedEventLoader.getRandomEvent(condition, preferredTypes);
                
                if (event) {
                    console.log('📚 使用数据库中的LLM生成事件');
                    return event;
                }
            } catch (error) {
                console.warn('数据库事件加载失败:', error);
            }
        }
        
        // 如果数据库没有事件，尝试实时LLM生成
        return await this.generateRealTimeLLMEvent(gameState);
    }

    /**
     * 实时LLM事件生成
     */
    async generateRealTimeLLMEvent(gameState) {
        // 检查是否有可用的LLM API（这里可以集成DeepSeek或其他LLM）
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            // 开发环境下可以尝试调用本地API
            try {
                const event = await this.callLocalLLMAPI(gameState);
                if (event) {
                    console.log('🤖 使用实时LLM生成事件');
                    return event;
                }
            } catch (error) {
                console.warn('实时LLM生成失败:', error);
            }
        }
        
        // 如果LLM不可用，返回null让系统使用其他方式
        return null;
    }

    /**
     * 调用本地LLM API（示例实现）
     */
    async callLocalLLMAPI(gameState) {
        try {
            const character = gameState.character;
            const location = gameState.currentLocation;
            
            const prompt = `请为RPG游戏生成一个事件。

角色信息：
- 姓名：${character.name}
- 等级：${character.level}
- 职业：${character.getProfessionName()}
- 当前地点：${location}
- 主要属性：力量${character.attributes.strength}，智力${character.attributes.intelligence}

请生成一个适合当前角色和地点的事件，包含：
1. 有趣的故事情节
2. 合理的奖励（经验值、金币、物品等）
3. 符合角色等级的挑战

返回JSON格式：
{
  "title": "事件标题",
  "description": "详细描述",
  "effects": {
    "status": {"experience": 30, "wealth": 20},
    "attributes": {"strength": 1},
    "items": ["获得的物品"]
  },
  "rarity": "common",
  "impact_description": "影响描述"
}`;

            // 这里可以调用实际的LLM API
            // 目前返回null，让系统使用其他生成方式
            return null;
            
        } catch (error) {
            console.error('LLM API调用失败:', error);
            return null;
        }
    }

    /**
     * 适配生成的事件到当前游戏状态
     */
    adaptGeneratedEvent(event, gameState) {
        const adaptedEvent = { ...event };
        
        // 替换事件描述中的占位符
        if (adaptedEvent.description) {
            adaptedEvent.description = adaptedEvent.description
                .replace(/\{character\}/g, gameState.character.name)
                .replace(/\{profession\}/g, gameState.character.getProfessionName());
        }
        
        // 调整选择的难度基于角色等级
        if (adaptedEvent.choices) {
            adaptedEvent.choices = adaptedEvent.choices.map(choice => {
                const adaptedChoice = { ...choice };
                
                // 根据角色等级调整难度
                if (adaptedChoice.difficulty) {
                    const levelAdjustment = (gameState.character.level - 1) * 2;
                    adaptedChoice.difficulty = Math.max(10, Math.min(90, 
                        adaptedChoice.difficulty + levelAdjustment
                    ));
                }
                
                return adaptedChoice;
            });
        }
        
        // 添加适配标记
        adaptedEvent.adapted = true;
        adaptedEvent.originalId = adaptedEvent.id;
        adaptedEvent.id = `adapted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return adaptedEvent;
    }

    /**
     * 生成传统事件（使用预定义模板）
     */
    generateTraditionalEvent(gameState) {
        const location = gameState.currentLocation;
        const availableEvents = this.getAvailableEvents(location, gameState);
        
        if (availableEvents.length === 0) {
            return null;
        }
        
        return availableEvents[Math.floor(Math.random() * availableEvents.length)];
    }

    /**
     * 获取可用事件
     */
    getAvailableEvents(location, gameState) {
        const locationEvents = this.eventTemplates[location] || [];
        const genericEvents = [
            ...this.eventTemplates.combat || [],
            ...this.eventTemplates.social || []
        ];
        
        return [...locationEvents, ...genericEvents];
    }

    /**
     * 触发通用事件
     */
    triggerGenericEvent(gameState) {
        const genericEvents = [
            {
                id: 'rest',
                title: '短暂休息',
                description: '你找了个安全的地方休息了一会儿。',
                type: 'rest',
                effect: { hp: 10, mp: 5, fatigue: -10 }
            },
            {
                id: 'travel',
                title: '继续旅行',
                description: '你继续在路上前行，欣赏着沿途的风景。',
                type: 'travel',
                effect: { fatigue: 5, experience: 2 }
            },
            {
                id: 'reflection',
                title: '自我反思',
                description: '你停下脚步，思考着这段冒险的意义。',
                type: 'reflection',
                effect: { experience: 5 }
            }
        ];
        
        const event = genericEvents[Math.floor(Math.random() * genericEvents.length)];
        this.processEvent(event, gameState);
    }

    /**
     * 处理事件
     */
    async processEvent(event, gameState) {
        this.currentEvent = event;
        
        // 记录事件历史
        gameState.addEventToHistory(event);
        
        // 显示事件内容
        await this.displayEvent(event, gameState);
        
        // 应用事件影响
        if (event.effects) {
            this.applyEventEffects(event.effects, gameState, event.impact_description);
        }
        
        // 检查成就
        if (window.AchievementSystem) {
            const newAchievements = window.AchievementSystem.checkAchievements(gameState.character);
            if (newAchievements.length > 0) {
                // 成就已在AchievementSystem中处理UI更新
            }
            
            // 更新社会地位
            window.AchievementSystem.updateSocialStatus(gameState.character);
        }
        
        console.log('📅 处理事件:', event.title);
    }

    /**
     * 应用事件效果
     */
    applyEventEffects(effects, gameState, impactDescription) {
        const character = gameState.character;
        let hasEffects = false;
        
        console.log('🔧 开始应用事件效果:', effects);
        
        // 应用属性变化
        if (effects.attributes) {
            console.log('📊 应用属性变化:', effects.attributes);
            Object.entries(effects.attributes).forEach(([attr, value]) => {
                if (Math.abs(value) > 0 && character.attributes[attr] !== undefined) {
                    const oldValue = character.attributes[attr];
                    character.attributes[attr] += value;
                    character.attributes[attr] = Math.max(1, character.attributes[attr]);
                    console.log(`  ${attr}: ${oldValue} → ${character.attributes[attr]} (${value > 0 ? '+' : ''}${value})`);
                    hasEffects = true;
                }
            });
        }
        
        // 应用人格变化
        if (effects.personality) {
            console.log('🧠 应用人格变化:', effects.personality);
            Object.entries(effects.personality).forEach(([trait, value]) => {
                if (Math.abs(value) > 0 && character.personality[trait] !== undefined) {
                    const oldValue = character.personality[trait];
                    character.personality[trait] += value;
                    character.personality[trait] = Math.max(0, Math.min(100, character.personality[trait]));
                    console.log(`  ${trait}: ${oldValue} → ${character.personality[trait]} (${value > 0 ? '+' : ''}${value})`);
                    hasEffects = true;
                }
            });
        }
        
        // 应用社会影响
        if (effects.social) {
            console.log('🤝 应用社会影响:', effects.social);
            Object.entries(effects.social).forEach(([social, value]) => {
                if (Math.abs(value) > 0 && character.social[social] !== undefined) {
                    const oldValue = character.social[social];
                    character.social[social] += value;
                    console.log(`  ${social}: ${oldValue} → ${character.social[social]} (${value > 0 ? '+' : ''}${value})`);
                    hasEffects = true;
                }
            });
        }
        
        // 应用状态变化
        if (effects.status) {
            console.log('💫 应用状态变化:', effects.status);
            Object.entries(effects.status).forEach(([status, value]) => {
                if (Math.abs(value) > 0 && character.status[status] !== undefined) {
                    
                    // 特殊处理经验值
                    if (status === 'experience') {
                        const oldLevel = character.level;
                        const oldExp = character.experience;
                        character.gainExperience(value);
                        console.log(`  经验值: ${oldExp} → ${character.experience} (${value > 0 ? '+' : ''}${value})`);
                        if (character.level > oldLevel) {
                            console.log(`  🎉 升级！${oldLevel} → ${character.level}`);
                            this.handleLevelUp(character, oldLevel, gameState);
                        }
                    } else {
                        const oldValue = character.status[status];
                        character.status[status] += value;
                        
                        // 其他状态的特殊处理
                        if (status === 'hp') {
                            character.status[status] = Math.max(0, Math.min(character.getMaxHP(), character.status[status]));
                        } else if (status === 'mp') {
                            character.status[status] = Math.max(0, Math.min(character.getMaxMP(), character.status[status]));
                        } else if (status === 'fatigue') {
                            character.status[status] = Math.max(0, Math.min(100, character.status[status]));
                        } else if (status === 'wealth') {
                            character.status[status] = Math.max(0, character.status[status]);
                        }
                        
                        console.log(`  ${status}: ${oldValue} → ${character.status[status]} (${value > 0 ? '+' : ''}${value})`);
                    }
                    
                    hasEffects = true;
                }
            });
        }
        
        // 应用技能获得
        if (effects.skills && effects.skills.length > 0) {
            effects.skills.forEach(skill => {
                if (!character.skills.includes(skill)) {
                    character.skills.push(skill);
                    hasEffects = true;
                }
            });
        }
        
        // 应用物品获得
        if (effects.items && effects.items.length > 0) {
            console.log('🎒 应用物品获得:', effects.items);
            effects.items.forEach(item => {
                character.addItem(item);
                console.log(`  获得物品: ${typeof item === 'string' ? item : item.name}`);
                hasEffects = true;
            });
        }
        
        // 应用称号获得
        if (effects.titles && effects.titles.length > 0) {
            effects.titles.forEach(title => {
                if (!character.social.titles.includes(title)) {
                    character.social.titles.push(title);
                    hasEffects = true;
                }
            });
        }
        
        // 应用成就解锁
        if (effects.achievements && effects.achievements.length > 0) {
            effects.achievements.forEach(achievement => {
                if (!character.achievements.includes(achievement)) {
                    character.achievements.push(achievement);
                    hasEffects = true;
                }
            });
        }
        
        // 更新UI显示
        if (window.gameEngine && window.gameEngine.uiManager) {
            // 使用新的分离日志系统
            if (hasEffects) {
                window.gameEngine.uiManager.addEffectsLog(effects, impactDescription);
            }
            
            // 更新角色显示
            window.gameEngine.uiManager.updateAll(gameState);
        }
        
        // 检查升级
        if (effects.status && effects.status.experience > 0) {
            const requiredExp = character.getRequiredExperience();
            if (character.experience >= requiredExp) {
                const levelUpInfo = character.levelUp();
                if (window.gameEngine && window.gameEngine.uiManager) {
                    window.gameEngine.uiManager.showLevelUpAnimation(character, levelUpInfo);
                }
            }
        }
    }

    /**
     * 显示事件
     */
    async displayEvent(event, gameState) {
        // 统一使用日志系统显示事件
        if (window.gameEngine && window.gameEngine.uiManager) {
            // 添加事件标题和描述到日志
            await window.gameEngine.uiManager.addLogEntry(
                'event', 
                `📅 ${event.title}`, 
                null,
                true // 标记为重要事件
            );
            
            // 添加事件描述
            await window.gameEngine.uiManager.addLogEntry(
                'story', 
                event.description, 
                event.effects
            );
            
            // 如果有影响描述，也添加到日志
            if (event.impact_description) {
                await window.gameEngine.uiManager.addLogEntry(
                    'impact', 
                    `💭 ${event.impact_description}`, 
                    null
                );
            }
        }
    }

    /**
     * 处理事件选择
     */
    handleEventChoices(event, gameState) {
        // 如果是AI控制，自动选择
        if (!this.isPlayerChoice(event)) {
            setTimeout(() => {
                const choice = this.makeAIChoice(event, gameState);
                this.selectChoice(event, choice.choice, choice.index, gameState);
            }, 2000); // 2秒后自动选择
        }
    }

    /**
     * 判断是否需要玩家选择
     */
    isPlayerChoice(event) {
        // 重要事件需要玩家选择
        const importantTypes = ['combat', 'treasure', 'major_story'];
        return importantTypes.includes(event.type);
    }

    /**
     * AI自动选择
     */
    makeAIChoice(event, gameState) {
        const character = gameState.character;
        const choices = event.choices;
        
        // 简单的AI逻辑：选择成功率最高的选项
        let bestChoice = null;
        let bestScore = -1;
        let bestIndex = 0;
        
        choices.forEach((choice, index) => {
            let score = 50; // 基础分数
            
            // 根据角色能力调整分数
            if (choice.requirement) {
                const canPerform = character.canPerformAction(choice.requirement, choice.difficulty || 50);
                score = canPerform ? 80 : 20;
            }
            
            // 考虑效果
            if (choice.effect) {
                if (choice.effect.hp > 0 && character.status.hp < character.getMaxHP() * 0.5) {
                    score += 20; // 低血量时优先回血
                }
                if (choice.effect.wealth > 0) {
                    score += 10; // 喜欢获得金币
                }
                if (choice.effect.reputation > 0) {
                    score += 5; // 喜欢提升声望
                }
            }
            
            // 考虑成本
            if (choice.cost) {
                if (choice.cost.wealth && character.status.wealth < choice.cost.wealth) {
                    score = 0; // 无法承担成本
                }
                if (choice.cost.mp && character.status.mp < choice.cost.mp) {
                    score = 0; // 魔法不足
                }
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestChoice = choice;
                bestIndex = index;
            }
        });
        
        return { choice: bestChoice || choices[0], index: bestIndex };
    }

    /**
     * 选择选项
     */
    selectChoice(event, choice, index, gameState) {
        // 隐藏选择按钮
        const eventChoices = document.getElementById('event-choices');
        if (eventChoices) {
            eventChoices.classList.add('hidden');
        }
        
        // 应用选择效果
        this.applyChoiceEffect(choice, gameState);
        
        // 添加到日志
        if (window.gameEngine && window.gameEngine.uiManager) {
            window.gameEngine.uiManager.addLogEntry('action', `选择: ${choice.text}`);
        }
        
        console.log('✅ 选择:', choice.text);
    }

    /**
     * 应用选择效果
     */
    applyChoiceEffect(choice, gameState) {
        const character = gameState.character;
        
        // 应用成本
        if (choice.cost) {
            if (choice.cost.wealth) {
                character.changeWealth(-choice.cost.wealth);
            }
            if (choice.cost.mp) {
                character.consumeMP(choice.cost.mp);
            }
        }
        
        // 应用效果
        if (choice.effect) {
            this.applyEventEffect(choice.effect, gameState);
        }
        
        // 检查需求并给予额外奖励
        if (choice.requirement) {
            const success = character.canPerformAction(choice.requirement, choice.difficulty || 50);
            if (success) {
                // 成功时给予经验奖励
                character.gainExperience(10);
                if (window.gameEngine && window.gameEngine.uiManager) {
                    window.gameEngine.uiManager.addLogEntry('action', '行动成功！获得经验值。');
                }
            } else {
                // 失败时可能有负面效果
                character.addFatigue(5);
                if (window.gameEngine && window.gameEngine.uiManager) {
                    window.gameEngine.uiManager.addLogEntry('warning', '行动失败，感到有些疲惫。');
                }
            }
        }
    }

    /**
     * 应用事件效果
     */
    applyEventEffect(effect, gameState) {
        const character = gameState.character;
        
        if (effect.hp) character.heal(effect.hp);
        if (effect.mp) character.restoreMP(effect.mp);
        if (effect.fatigue) character.addFatigue(-effect.fatigue);
        if (effect.wealth) character.changeWealth(effect.wealth);
        if (effect.reputation) character.changeReputation(effect.reputation);
        if (effect.experience) character.gainExperience(effect.experience);
        
        // 属性变化
        Object.keys(character.attributes).forEach(attr => {
            if (effect[attr]) {
                character.attributes[attr] += effect[attr];
            }
        });
        
        // 装备效果
        if (effect.equipment) {
            const item = this.createItem(effect.equipment);
            character.addItem(item);
            if (window.gameEngine && window.gameEngine.uiManager) {
                window.gameEngine.uiManager.addLogEntry('action', `获得物品: ${item.name}`);
            }
        }
    }

    /**
     * 创建物品
     */
    createItem(itemId) {
        const items = {
            basic_sword: { name: '基础剑', type: 'weapon', attack: 10, description: '一把普通的铁剑' },
            health_potion: { name: '生命药水', type: 'consumable', effect: { hp: 50 }, description: '恢复生命值的药水' }
        };
        
        return items[itemId] || { name: '未知物品', type: 'misc', description: '神秘的物品' };
    }

    /**
     * 处理升级
     */
    async handleLevelUp(character, oldLevel, gameState) {
        const newLevel = character.level;
        console.log(`🎉 ${character.name}从${oldLevel}级升级到${newLevel}级！`);
        
        // 添加升级日志
        if (window.gameEngine && window.gameEngine.uiManager) {
            await window.gameEngine.uiManager.addLogEntry(
                'levelup', 
                `🎉 恭喜！${character.name}升级了！等级：${oldLevel} → ${newLevel}`, 
                null
            );
        }
        
        // 检查是否解锁新地点
        const availableLocations = character.getAvailableLocations();
        const newLocations = availableLocations.filter(loc => 
            loc.minLevel === newLevel
        );
        
        if (newLocations.length > 0) {
            if (window.gameEngine && window.gameEngine.uiManager) {
                await window.gameEngine.uiManager.addLogEntry(
                    'unlock', 
                    `🗺️ 升级解锁了新地点：${newLocations.map(loc => loc.name).join('、')}`, 
                    null
                );
            }
        }
    }

    /**
     * 生成有意义的事件
     */
    generateMeaningfulEvent(gameState) {
        const character = gameState.character;
        const location = gameState.currentLocation;
        const level = character.level;
        
        // 根据角色等级和地点生成不同类型的事件
        const eventTypes = [
            'combat', 'treasure', 'skill_training', 'social', 'mystery', 
            'merchant', 'quest', 'exploration', 'challenge'
        ];
        
        const eventType = this.randomSelect(eventTypes);
        const eventId = `${eventType}_${Date.now()}`;
        
        switch (eventType) {
            case 'combat':
                return this.generateCombatEvent(eventId, character, location);
            case 'treasure':
                return this.generateTreasureEvent(eventId, character, location);
            case 'skill_training':
                return this.generateSkillTrainingEvent(eventId, character, location);
            case 'social':
                return this.generateSocialEvent(eventId, character, location);
            case 'mystery':
                return this.generateMysteryEvent(eventId, character, location);
            case 'merchant':
                return this.generateMerchantEvent(eventId, character, location);
            case 'quest':
                return this.generateQuestEvent(eventId, character, location);
            case 'challenge':
                return this.generateChallengeEvent(eventId, character, location);
            default:
                return this.generateExplorationEvent(eventId, character, location);
        }
    }

    /**
     * 生成战斗事件
     */
    generateCombatEvent(id, character, location) {
        const enemies = ['野狼', '盗贼', '哥布林', '骷髅战士', '森林熊', '毒蛇'];
        const enemy = this.randomSelect(enemies);
        const victory = Math.random() > 0.3; // 70%胜率
        
        if (victory) {
            const expGain = Math.floor(Math.random() * 40) + 20; // 20-60经验
            const goldGain = Math.floor(Math.random() * 50) + 10; // 10-60金币
            const hpLoss = Math.floor(Math.random() * 15) + 5;   // 5-20生命值损失
            
            return {
                id,
                title: `击败${enemy}`,
                description: `在${location}，${character.name}遭遇了一只${enemy}。经过激烈的战斗，${character.name}成功击败了敌人，获得了战斗经验和战利品。`,
                type: 'combat',
                effects: {
                    status: {
                        experience: expGain,
                        wealth: goldGain,
                        hp: -hpLoss
                    },
                    attributes: {
                        strength: Math.random() > 0.7 ? 1 : 0,
                        constitution: Math.random() > 0.8 ? 1 : 0
                    }
                },
                rarity: 'common',
                impact_description: `获得${expGain}经验值，${goldGain}金币，损失${hpLoss}生命值`
            };
        } else {
            return {
                id,
                title: `逃离${enemy}`,
                description: `在${location}，${character.name}遭遇了一只强大的${enemy}。明智地选择了撤退，虽然没有收获，但保住了性命。`,
                type: 'combat',
                effects: {
                    status: {
                        experience: 5,
                        hp: -Math.floor(Math.random() * 10) + 5
                    },
                    attributes: {
                        dexterity: Math.random() > 0.8 ? 1 : 0
                    }
                },
                rarity: 'common',
                impact_description: '获得少量经验，损失一些生命值'
            };
        }
    }

    /**
     * 生成宝藏事件
     */
    generateTreasureEvent(id, character, location) {
        const treasures = [
            { name: '古老的药水', type: 'consumable', effect: { hp: 50 } },
            { name: '魔法护符', type: 'accessory', effect: { mp: 20 } },
            { name: '锋利的匕首', type: 'weapon', effect: { strength: 2 } },
            { name: '智慧之书', type: 'book', effect: { intelligence: 2 } },
            { name: '敏捷靴子', type: 'equipment', effect: { dexterity: 2 } }
        ];
        
        const treasure = this.randomSelect(treasures);
        const goldFind = Math.floor(Math.random() * 100) + 50; // 50-150金币
        
        return {
            id,
            title: `发现宝藏`,
            description: `在${location}的一个隐秘角落，${character.name}发现了一个古老的宝箱。里面有${treasure.name}和一些金币。`,
            type: 'treasure',
            effects: {
                status: {
                    experience: 30,
                    wealth: goldFind,
                    ...treasure.effect
                },
                items: [treasure.name],
                attributes: treasure.effect
            },
            rarity: 'uncommon',
            impact_description: `获得${treasure.name}、${goldFind}金币和30经验值`
        };
    }

    /**
     * 生成技能训练事件
     */
    generateSkillTrainingEvent(id, character, location) {
        const skills = ['剑术', '魔法', '潜行', '治疗', '锻造', '炼金'];
        const skill = this.randomSelect(skills);
        const attributeMap = {
            '剑术': 'strength',
            '魔法': 'intelligence', 
            '潜行': 'dexterity',
            '治疗': 'constitution',
            '锻造': 'strength',
            '炼金': 'intelligence'
        };
        
        const attribute = attributeMap[skill];
        const attributeGain = Math.floor(Math.random() * 2) + 1; // 1-2属性点
        
        return {
            id,
            title: `${skill}训练`,
            description: `在${location}，${character.name}遇到了一位${skill}大师，接受了专业的训练指导。通过刻苦练习，技能得到了显著提升。`,
            type: 'skill_training',
            effects: {
                status: {
                    experience: 25,
                    fatigue: 10
                },
                attributes: {
                    [attribute]: attributeGain
                },
                skills: [skill]
            },
            rarity: 'uncommon',
            impact_description: `${attribute}+${attributeGain}，学会${skill}技能`
        };
    }

    /**
     * 生成社交事件
     */
    generateSocialEvent(id, character, location) {
        const npcs = ['商人', '学者', '贵族', '农夫', '冒险者'];
        const npc = this.randomSelect(npcs);
        const reputationGain = Math.floor(Math.random() * 20) + 10; // 10-30声望
        
        return {
            id,
            title: `与${npc}交谈`,
            description: `在${location}，${character.name}遇到了一位友善的${npc}。通过愉快的交谈，${character.name}获得了有用的信息和当地人的好感。`,
            type: 'social',
            effects: {
                status: {
                    experience: 15
                },
                social: {
                    reputation: reputationGain,
                    influence: Math.floor(reputationGain / 2)
                },
                attributes: {
                    charisma: Math.random() > 0.7 ? 1 : 0
                }
            },
            rarity: 'common',
            impact_description: `声望+${reputationGain}，魅力可能提升`
        };
    }

    /**
     * 生成神秘事件
     */
    generateMysteryEvent(id, character, location) {
        const mysteries = ['古老遗迹', '神秘符文', '魔法水晶', '预言石碑', '时空裂缝'];
        const mystery = this.randomSelect(mysteries);
        
        return {
            id,
            title: `神秘的${mystery}`,
            description: `在${location}，${character.name}发现了一个神秘的${mystery}。虽然无法完全理解其含义，但感受到了强大的魔法力量。`,
            type: 'mystery',
            effects: {
                status: {
                    experience: 40,
                    mp: Math.floor(Math.random() * 30) + 10
                },
                attributes: {
                    intelligence: Math.random() > 0.6 ? 1 : 0,
                    luck: Math.random() > 0.8 ? 1 : 0
                },
                titles: Math.random() > 0.9 ? ['神秘探索者'] : []
            },
            rarity: 'rare',
            impact_description: '获得大量经验值和魔法力量'
        };
    }

    /**
     * 生成商人事件
     */
    generateMerchantEvent(id, character, location) {
        const items = ['生命药水', '魔法药水', '铁剑', '皮甲', '魔法卷轴'];
        const item = this.randomSelect(items);
        const price = Math.floor(Math.random() * 100) + 50;
        
        // 简化：直接给予物品和消耗金币
        return {
            id,
            title: `遇到商人`,
            description: `在${location}，${character.name}遇到了一位旅行商人。商人出售各种有用的物品，${character.name}购买了${item}。`,
            type: 'merchant',
            effects: {
                status: {
                    experience: 10,
                    wealth: -Math.min(price, character.status.wealth || 100)
                },
                items: [item]
            },
            rarity: 'common',
            impact_description: `获得${item}，花费一些金币`
        };
    }

    /**
     * 生成任务事件
     */
    generateQuestEvent(id, character, location) {
        const quests = ['寻找丢失的物品', '护送商队', '清理怪物', '收集草药', '传递消息'];
        const quest = this.randomSelect(quests);
        const reward = Math.floor(Math.random() * 100) + 50;
        
        return {
            id,
            title: `接受任务：${quest}`,
            description: `在${location}，${character.name}接受了一个任务：${quest}。经过努力完成了任务，获得了丰厚的奖励。`,
            type: 'quest',
            effects: {
                status: {
                    experience: Math.floor(Math.random() * 50) + 30, // 30-80经验
                    wealth: reward
                },
                social: {
                    reputation: 15
                },
                attributes: {
                    [this.randomSelect(['strength', 'intelligence', 'dexterity', 'constitution', 'charisma'])]: 1
                }
            },
            rarity: 'uncommon',
            impact_description: `获得大量经验值、${reward}金币和声望`
        };
    }

    /**
     * 生成挑战事件
     */
    generateChallengeEvent(id, character, location) {
        const challenges = ['智力谜题', '体力考验', '勇气试炼', '技巧挑战', '意志测试'];
        const challenge = this.randomSelect(challenges);
        const success = Math.random() > 0.4; // 60%成功率
        
        if (success) {
            return {
                id,
                title: `挑战成功：${challenge}`,
                description: `在${location}，${character.name}面临了一个${challenge}。凭借智慧和勇气，成功完成了挑战。`,
                type: 'challenge',
                effects: {
                    status: {
                        experience: Math.floor(Math.random() * 60) + 40 // 40-100经验
                    },
                    attributes: {
                        [this.randomSelect(['strength', 'intelligence', 'dexterity', 'constitution', 'charisma', 'luck'])]: Math.floor(Math.random() * 2) + 1
                    },
                    titles: Math.random() > 0.8 ? ['挑战者'] : []
                },
                rarity: 'rare',
                impact_description: '获得大量经验值和属性提升'
            };
        } else {
            return {
                id,
                title: `挑战失败：${challenge}`,
                description: `在${location}，${character.name}面临了一个困难的${challenge}，但这次没有成功。不过失败也是一种学习。`,
                type: 'challenge',
                effects: {
                    status: {
                        experience: 15,
                        hp: -10
                    }
                },
                rarity: 'common',
                impact_description: '获得少量经验值，损失一些生命值'
            };
        }
    }

    /**
     * 生成探索事件
     */
    generateExplorationEvent(id, character, location) {
        return {
            id,
            title: '深度探索',
            description: `${character.name}在${location}进行了深入的探索，发现了一些有趣的地方，积累了宝贵的经验。`,
            type: 'exploration',
            effects: {
                status: {
                    experience: Math.floor(Math.random() * 30) + 20, // 20-50经验
                    fatigue: Math.floor(Math.random() * 8) + 2       // 2-10疲劳
                }
            },
            rarity: 'common',
            impact_description: '获得探索经验'
        };
    }
}
