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
        this.useAIGeneration = this.aiGenerator !== null;
        this.aiGenerationRate = 0.7;
        this.useGeneratedEvents = true;
        this.generatedEventRate = 0.5;
        
        console.log('📅 事件系统初始化完成');
    }

    /**
     * 随机选择数组中的元素
     */
    randomSelect(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * 加载事件模板
     */
    loadEventTemplates() {
        return [
            {
                id: 'basic_adventure',
                title: '基础冒险',
                description: '你在路上遇到了一些小挑战。',
                effects: {
                    status: { experience: 10 }
                }
            }
        ];
    }

    /**
     * 触发随机事件
     */
    async triggerRandomEvent(gameState) {
        var event = null;
        var eventSource = '';
        
        // 1. 尝试实时LLM生成
        if (this.llmGenerator && this.llmGenerator.shouldUseLLM && this.llmGenerator.shouldUseLLM(gameState)) {
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
        
        // 3. 尝试AI模板生成
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
        
        // 4. 使用增强传统事件
        if (!event) {
            event = this.generateMeaningfulEvent(gameState);
            eventSource = '增强传统事件';
            console.log('📋 使用增强传统事件');
        }
        
        if (event) {
            event.source = eventSource;
            console.log('📅 处理事件: ' + event.title + ' (来源: ' + eventSource + ')');
            await this.processEvent(event, gameState);
        } else {
            console.warn('⚠️ 无法获取任何事件');
        }
    }

    /**
     * 获取生成事件
     */
    async getGeneratedEvent(gameState) {
        if (this.generatedEventLoader && this.generatedEventLoader.getRandomEvent) {
            return await this.generatedEventLoader.getRandomEvent(gameState);
        }
        return null;
    }

    /**
     * 生成有意义的事件
     */
    generateMeaningfulEvent(gameState) {
        var eventTypes = ['combat', 'treasure', 'social', 'training', 'travel', 'misfortune'];
        var eventType = this.randomSelect(eventTypes);
        
        var events = {
            combat: [
                {
                    title: '遭遇野兽',
                    description: '你在路上遇到了一只凶猛的野兽，经过一番搏斗...',
                    effects: {
                        status: { experience: 25, hp: -10 }
                    }
                }
            ],
            treasure: [
                {
                    title: '发现宝箱',
                    description: '你发现了一个隐藏的宝箱，里面装满了金币！',
                    effects: {
                        status: { wealth: 100, experience: 15 }
                    }
                }
            ],
            social: [
                {
                    title: '帮助村民',
                    description: '你帮助了一位遇到困难的村民，获得了他的感谢。',
                    effects: {
                        reputation: { righteous: 5 },
                        status: { experience: 20 }
                    }
                }
            ],
            training: [
                {
                    title: '刻苦修炼',
                    description: '你找到了一个安静的地方进行修炼，感觉实力有所提升。',
                    effects: {
                        attributes: { strength: 1 },
                        status: { experience: 30 }
                    }
                }
            ],
            travel: [
                {
                    title: '踏上旅程',
                    description: '你决定前往新的地方探索，开启了新的冒险。',
                    effects: {
                        location: '神秘森林',
                        status: { experience: 10 }
                    }
                }
            ],
            misfortune: [
                {
                    title: '遭遇盗贼',
                    description: '你遭遇了一群盗贼，虽然逃脱了，但损失了一些财物。',
                    effects: {
                        status: { wealth: -50, hp: -5 }
                    }
                }
            ]
        };
        
        var eventList = events[eventType] || events.combat;
        return this.randomSelect(eventList);
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
        var hasRealEffects = false;
        if (event.effects) {
            hasRealEffects = this.applyEventEffects(event.effects, gameState, event.impact_description);
        }
        
        // 只有当事件真正产生影响时才更新UI
        if (hasRealEffects && window.gameEngine && window.gameEngine.uiManager) {
            console.log('🎨 事件产生了实际影响，更新角色面板');
            window.gameEngine.uiManager.updateCharacterPanel(gameState.character);
        }
        
        // 检查成就
        if (window.AchievementSystem) {
            try {
                var newAchievements = window.AchievementSystem.checkAchievements(gameState.character);
                if (newAchievements.length > 0) {
                    // 成就已在AchievementSystem中处理UI更新
                }
                
                // 更新社会地位
                window.AchievementSystem.updateSocialStatus(gameState.character);
            } catch (error) {
                console.warn('成就系统检查失败:', error);
            }
        }
        
        console.log('📅 处理事件:', event.title);
    }

    /**
     * 显示事件（优化版，避免阻塞）
     */
    async displayEvent(event, gameState) {
        // 统一使用日志系统显示事件
        if (window.gameEngine && window.gameEngine.uiManager) {
            // 添加事件标题和描述到日志（非阻塞）
            window.gameEngine.uiManager.addLogEntry(
                'event', 
                '📅 ' + event.title, 
                null,
                true // 标记为重要事件
            );
            
            // 添加事件描述（非阻塞）
            window.gameEngine.uiManager.addLogEntry(
                'story', 
                event.description, 
                event.effects
            );
            
            // 如果有影响描述，也添加到日志（非阻塞）
            if (event.impact_description) {
                window.gameEngine.uiManager.addLogEntry(
                    'impact', 
                    '💭 ' + event.impact_description, 
                    null
                );
            }
        }
        
        // 立即返回，不等待UI更新完成
        return Promise.resolve();
    }

    /**
     * 应用事件效果 - 完整版，支持所有角色属性
     */
    applyEventEffects(effects, gameState, impactDescription) {
        var character = gameState.character;
        var hasEffects = false;
        var effectLog = [];
        
        console.log('🔧 开始应用事件效果:', effects);
        
        // 应用属性变化
        if (effects.attributes) {
            console.log('📊 应用属性变化:', effects.attributes);
            for (var attr in effects.attributes) {
                var value = effects.attributes[attr];
                if (Math.abs(value) > 0 && character.attributes[attr] !== undefined) {
                    var oldValue = character.attributes[attr];
                    character.attributes[attr] += value;
                    character.attributes[attr] = Math.max(1, character.attributes[attr]);
                    
                    var changeText = attr + ': ' + oldValue + ' → ' + character.attributes[attr] + ' (' + (value > 0 ? '+' : '') + value + ')';
                    console.log('  ' + changeText);
                    effectLog.push(changeText);
                    hasEffects = true;
                }
            }
        }
        
        // 应用状态变化（生命值、法力值等）
        if (effects.status) {
            console.log('💫 应用状态变化:', effects.status);
            for (var stat in effects.status) {
                var value = effects.status[stat];
                if (Math.abs(value) > 0) {
                    if (stat === 'experience') {
                        var oldExp = character.experience;
                        var oldLevel = character.level;
                        character.gainExperience(value);
                        
                        var expChangeText = '经验: ' + oldExp + ' → ' + character.experience + ' (+' + value + ')';
                        console.log('  ' + expChangeText);
                        effectLog.push(expChangeText);
                        
                        // 检查是否升级了
                        if (character.level > oldLevel) {
                            var levelUpText = '🎉 升级! ' + oldLevel + ' → ' + character.level + ' 级';
                            console.log('  ' + levelUpText);
                            effectLog.push(levelUpText);
                        }
                        hasEffects = true;
                        
                    } else if (stat === 'wealth') {
                        var oldWealth = character.wealth;
                        character.gainWealth(value);
                        
                        var wealthChangeText = '财富: ' + oldWealth + ' → ' + character.wealth + ' (' + (value > 0 ? '+' : '') + value + ')';
                        console.log('  ' + wealthChangeText);
                        effectLog.push(wealthChangeText);
                        hasEffects = true;
                        
                    } else if (stat === 'hp') {
                        var oldHP = character.status.hp;
                        character.status.hp += value;
                        character.status.hp = Math.max(1, Math.min(character.getMaxHP(), character.status.hp));
                        
                        var hpChangeText = '生命值: ' + oldHP + ' → ' + character.status.hp + ' (' + (value > 0 ? '+' : '') + value + ')';
                        console.log('  ' + hpChangeText);
                        effectLog.push(hpChangeText);
                        hasEffects = true;
                        
                        // 检查是否死亡
                        if (character.status.hp <= 0) {
                            console.log('💀 角色死亡！游戏结束');
                            this.triggerGameOver(gameState, '角色生命值耗尽');
                        }
                        
                    } else if (stat === 'mp') {
                        var oldMP = character.status.mp;
                        character.status.mp += value;
                        character.status.mp = Math.max(0, Math.min(character.getMaxMP(), character.status.mp));
                        
                        var mpChangeText = '法力值: ' + oldMP + ' → ' + character.status.mp + ' (' + (value > 0 ? '+' : '') + value + ')';
                        console.log('  ' + mpChangeText);
                        effectLog.push(mpChangeText);
                        hasEffects = true;
                    }
                }
            }
        }
        
        // 应用位置变化
        if (effects.location && effects.location !== character.location) {
            var oldLocation = character.location;
            character.location = effects.location;
            
            var locationChangeText = '📍 位置变化: ' + oldLocation + ' → ' + character.location;
            console.log('  ' + locationChangeText);
            effectLog.push(locationChangeText);
            hasEffects = true;
        }
        
        // 应用声望变化
        if (effects.reputation) {
            console.log('🌟 应用声望变化:', effects.reputation);
            for (var repType in effects.reputation) {
                var value = effects.reputation[repType];
                if (Math.abs(value) > 0) {
                    if (character.reputation[repType] !== undefined) {
                        var oldRep = character.reputation[repType];
                        character.reputation[repType] += value;
                        
                        var repChangeText = '声望(' + repType + '): ' + oldRep + ' → ' + character.reputation[repType] + ' (' + (value > 0 ? '+' : '') + value + ')';
                        console.log('  ' + repChangeText);
                        effectLog.push(repChangeText);
                        hasEffects = true;
                    }
                    
                    // 更新总声望
                    if (character.social && character.social.reputation !== undefined) {
                        character.social.reputation += value;
                    }
                }
            }
        }
        
        // 应用技能获得
        if (effects.skills && effects.skills.length > 0) {
            console.log('📚 应用技能变化:', effects.skills);
            for (var i = 0; i < effects.skills.length; i++) {
                var skill = effects.skills[i];
                if (typeof skill === 'string' && !character.skills.includes(skill)) {
                    character.learnSkill(skill);
                    
                    var skillText = '学会技能: ' + skill;
                    console.log('  ' + skillText);
                    effectLog.push(skillText);
                    hasEffects = true;
                }
            }
        }
        
        // 记录效果到UI日志
        if (hasEffects && effectLog.length > 0) {
            if (window.gameEngine && window.gameEngine.uiManager && window.gameEngine.uiManager.addLogEntry) {
                window.gameEngine.uiManager.addLogEntry('effect', '💫 事件影响: ' + effectLog.join(', '));
            }
        }
        
        if (hasEffects) {
            console.log('✅ 事件效果应用完成 - 角色属性发生了实际变化');
            console.log('📋 变化摘要:', effectLog);
        } else {
            console.log('ℹ️ 事件没有产生实际的角色属性变化');
        }
        
        return hasEffects;
    }

    /**
     * 触发游戏结束
     */
    triggerGameOver(gameState, reason) {
        console.log('🎮 游戏结束:', reason);
        
        if (window.gameEngine) {
            window.gameEngine.isRunning = false;
            if (window.gameEngine.gameLoop) {
                clearInterval(window.gameEngine.gameLoop);
            }
            
            // 显示游戏结束信息
            if (window.gameEngine.uiManager) {
                window.gameEngine.uiManager.addLogEntry('system', '💀 游戏结束: ' + reason);
                window.gameEngine.uiManager.addLogEntry('system', '🎯 最终等级: ' + gameState.character.level);
                window.gameEngine.uiManager.addLogEntry('system', '💰 最终财富: ' + gameState.character.wealth);
                window.gameEngine.uiManager.addLogEntry('system', '📍 最终位置: ' + gameState.character.location);
            }
        }
    }
}

// 全局导出
window.EventSystem = EventSystem;
