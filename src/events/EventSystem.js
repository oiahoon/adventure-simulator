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
        
        // 优先级：LLM生成事件 > AI生成事件 > 传统事件
        if (this.useGeneratedEvents && Math.random() < this.generatedEventRate) {
            try {
                event = await this.getGeneratedEvent(gameState);
                if (event) {
                    eventSource = 'LLM生成事件';
                    console.log('🎭 使用LLM生成事件');
                }
            } catch (error) {
                console.warn('LLM生成事件获取失败:', error);
            }
        }
        
        // 如果没有获取到LLM事件，尝试AI生成
        if (!event && this.useAIGeneration && this.aiGenerator && Math.random() < this.aiGenerationRate) {
            try {
                event = this.aiGenerator.generateEvent(gameState);
                if (event) {
                    eventSource = 'AI实时生成事件';
                    console.log('🤖 使用AI生成事件');
                }
            } catch (error) {
                console.warn('AI事件生成失败，使用传统事件:', error);
            }
        }
        
        // 最后使用传统事件
        if (!event) {
            event = this.generateTraditionalEvent(gameState);
            eventSource = '内置传统事件模板';
            console.log('📋 使用传统事件模板');
        }
        
        if (event) {
            // 添加事件来源信息
            event.source = eventSource;
            console.log(`📅 处理事件: ${event.title} (来源: ${eventSource})`);
            await this.processEvent(event, gameState);
        } else {
            console.warn('⚠️ 无法获取任何事件，生成基础探索事件');
            // 生成基础探索事件而不是使用内置模板
            const event = {
                id: `basic_${Date.now()}`,
                title: '日常探索',
                description: `${gameState.character.name}在${gameState.currentLocation}进行日常的探索活动，虽然没有特别的发现，但也积累了一些经验。`,
                type: 'exploration',
                effects: {
                    status: {
                        experience: Math.floor(Math.random() * 20) + 10, // 10-30经验
                        fatigue: Math.floor(Math.random() * 5) + 1       // 1-5疲劳
                    }
                },
                rarity: 'common',
                impact_description: '获得少量经验值'
            };
            
            // 处理这个基础事件
            await this.processEvent(event, gameState);
        }
    }

    /**
     * 获取LLM生成的事件
     */
    async getGeneratedEvent(gameState) {
        if (!this.generatedEventLoader) {
            return null;
        }

        const character = gameState.character;
        const location = gameState.currentLocation;
        
        // 构建事件条件
        const condition = {
            characterLevel: character.level
        };
        
        // 根据地点调整事件类型偏好
        const locationPreferences = {
            newbie_village: ['slice-of-life', 'social', 'cultural'],
            town: ['business', 'social', 'political'],
            forest: ['exploration', 'fantasy', 'survival'],
            mountain: ['survival', 'exploration', 'mythological'],
            ruins: ['mythological', 'academic', 'horror'],
            dungeon: ['fantasy', 'horror', 'survival']
        };
        
        const preferredTypes = locationPreferences[location] || [];
        
        // 尝试获取符合条件的事件
        for (const type of preferredTypes) {
            const event = await this.generatedEventLoader.getRandomGeneratedEvent({
                ...condition,
                type
            });
            
            if (event) {
                return this.adaptGeneratedEvent(event, gameState);
            }
        }
        
        // 如果没有找到特定类型的事件，获取任意事件
        const anyEvent = await this.generatedEventLoader.getRandomGeneratedEvent(condition);
        return anyEvent ? this.adaptGeneratedEvent(anyEvent, gameState) : null;
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
        
        // 应用属性变化
        if (effects.attributes) {
            Object.entries(effects.attributes).forEach(([attr, value]) => {
                if (Math.abs(value) > 0 && character.attributes[attr] !== undefined) {
                    character.attributes[attr] += value;
                    character.attributes[attr] = Math.max(1, character.attributes[attr]);
                    hasEffects = true;
                }
            });
        }
        
        // 应用人格变化
        if (effects.personality) {
            Object.entries(effects.personality).forEach(([trait, value]) => {
                if (Math.abs(value) > 0 && character.personality[trait] !== undefined) {
                    character.personality[trait] += value;
                    character.personality[trait] = Math.max(0, Math.min(100, character.personality[trait]));
                    hasEffects = true;
                }
            });
        }
        
        // 应用社会影响
        if (effects.social) {
            Object.entries(effects.social).forEach(([social, value]) => {
                if (Math.abs(value) > 0 && character.social[social] !== undefined) {
                    character.social[social] += value;
                    hasEffects = true;
                }
            });
        }
        
        // 应用状态变化
        if (effects.status) {
            Object.entries(effects.status).forEach(([status, value]) => {
                if (Math.abs(value) > 0 && character.status[status] !== undefined) {
                    
                    // 特殊处理经验值
                    if (status === 'experience') {
                        const oldLevel = character.level;
                        character.gainExperience(value);
                        if (character.level > oldLevel) {
                            this.handleLevelUp(character, oldLevel, gameState);
                        }
                    } else {
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
            effects.items.forEach(item => {
                character.inventory.push({
                    name: item,
                    type: 'misc',
                    description: '通过事件获得的物品',
                    obtainedAt: Date.now()
                });
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
}
