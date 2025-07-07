/**
 * MUD游戏引擎 - 整合所有MUD系统
 * 参考北大侠客行的游戏循环和系统集成
 */
class MUDGameEngine {
    constructor() {
        this.npcSystem = new NPCSystem();
        this.sectSystem = new SectSystem();
        this.reputationSystem = new ReputationSystem();
        this.gameState = this.initializeGameState();
        this.mudAPIEndpoint = this.getMUDAPIEndpoint();
        this.isRunning = false;
        this.gameLoop = null;
        
        console.log('🏮 MUD游戏引擎初始化完成');
    }

    /**
     * 获取MUD API端点
     */
    getMUDAPIEndpoint() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api/mud';
        }
        return '/api/mud';
    }

    /**
     * 初始化游戏状态
     */
    initializeGameState() {
        return {
            character: null,
            currentLocation: '新手村',
            gameTime: {
                day: 1,
                hour: 8,
                period: '上午'
            },
            worldEvents: [],
            activeNPCs: new Map(),
            recentInteractions: [],
            playerActions: [],
            mudFeatures: {
                npcInteractionEnabled: true,
                sectSystemEnabled: true,
                reputationSystemEnabled: true,
                rumorSystemEnabled: true
            }
        };
    }

    /**
     * 启动MUD游戏循环
     */
    startMUDGameLoop(character) {
        this.gameState.character = character;
        this.isRunning = true;
        
        console.log(`🎮 启动MUD游戏循环: ${character.name}`);
        
        // 初始化角色的MUD状态
        this.initializeCharacterMUDState(character);
        
        // 启动主游戏循环
        this.gameLoop = setInterval(() => {
            this.processMUDGameTick();
        }, 5000); // 每5秒一个游戏tick
        
        // 启动NPC更新循环
        setInterval(() => {
            this.updateActiveNPCs();
        }, 15000); // 每15秒更新NPC
        
        // 启动世界事件循环
        setInterval(() => {
            this.processWorldEvents();
        }, 30000); // 每30秒处理世界事件
    }

    /**
     * 初始化角色的MUD状态
     */
    initializeCharacterMUDState(character) {
        // 初始化声望
        if (!character.reputation) {
            character.reputation = this.reputationSystem.playerReputation;
        }
        
        // 初始化门派状态
        if (!character.sectStatus) {
            character.sectStatus = null;
        }
        
        // 初始化社交关系
        if (!character.socialRelations) {
            character.socialRelations = new Map();
        }
        
        console.log(`👤 角色MUD状态初始化完成: ${character.name}`);
    }

    /**
     * 处理MUD游戏tick
     */
    async processMUDGameTick() {
        if (!this.isRunning || !this.gameState.character) return;
        
        try {
            // 更新游戏时间
            this.updateGameTime();
            
            // 处理随机事件
            await this.processRandomMUDEvent();
            
            // 更新角色状态
            this.updateCharacterStatus();
            
            // 处理声望变化
            this.processReputationEffects();
            
            // 检查门派事件
            await this.checkSectEvents();
            
        } catch (error) {
            console.error('MUD游戏tick处理失败:', error);
        }
    }

    /**
     * 处理随机MUD事件
     */
    async processRandomMUDEvent() {
        const eventProbability = this.calculateEventProbability();
        
        if (Math.random() < eventProbability) {
            const eventType = this.selectMUDEventType();
            
            switch (eventType) {
                case 'npc_encounter':
                    await this.triggerNPCEncounter();
                    break;
                case 'rumor':
                    await this.triggerRumorEvent();
                    break;
                case 'adventure':
                    await this.triggerAdventureEncounter();
                    break;
                case 'sect_event':
                    await this.triggerSectEvent();
                    break;
            }
        }
    }

    /**
     * 触发NPC遭遇
     */
    async triggerNPCEncounter() {
        try {
            // 生成或获取NPC
            const npc = await this.npcSystem.generateDynamicNPC(
                this.gameState.currentLocation,
                this.gameState,
                { gameTime: this.gameState.gameTime }
            );
            
            if (npc) {
                // 生成对话
                const dialogue = await this.generateNPCDialogue(npc);
                
                // 显示NPC遭遇事件
                this.displayNPCEncounter(npc, dialogue);
                
                // 记录互动
                this.recordInteraction('npc_encounter', {
                    npcId: npc.id,
                    npcName: npc.name,
                    location: this.gameState.currentLocation
                });
            }
            
        } catch (error) {
            console.error('NPC遭遇生成失败:', error);
        }
    }

    /**
     * 生成NPC对话
     */
    async generateNPCDialogue(npc) {
        try {
            const response = await fetch(`${this.mudAPIEndpoint}/npc/dialogue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    npcInfo: npc,
                    playerInfo: {
                        name: this.gameState.character.name,
                        level: this.gameState.character.level,
                        sect: this.sectSystem.getPlayerSectInfo()?.sect?.name,
                        reputation: this.gameState.character.reputation
                    },
                    context: {
                        location: this.gameState.currentLocation,
                        timeContext: this.gameState.gameTime.period,
                        triggerReason: '偶然相遇'
                    }
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.dialogue;
            }
            
        } catch (error) {
            console.error('NPC对话生成失败:', error);
        }
        
        return null;
    }

    /**
     * 触发传闻事件
     */
    async triggerRumorEvent() {
        try {
            const response = await fetch(`${this.mudAPIEndpoint}/rumor/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    worldContext: {
                        sectRelations: this.sectSystem.sectRelations,
                        recentEvents: this.gameState.worldEvents.slice(-5),
                        playerInfluence: this.calculatePlayerInfluence()
                    },
                    rumorType: 'general'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayRumorEvent(data.rumor);
                
                // 记录传闻
                this.gameState.worldEvents.push({
                    type: 'rumor',
                    content: data.rumor,
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            console.error('传闻事件生成失败:', error);
        }
    }

    /**
     * 触发冒险奇遇
     */
    async triggerAdventureEncounter() {
        try {
            const response = await fetch(`${this.mudAPIEndpoint}/encounter/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: this.gameState.currentLocation,
                    playerState: {
                        level: this.gameState.character.level,
                        attributes: this.gameState.character.attributes,
                        reputation: this.gameState.character.reputation,
                        sect: this.sectSystem.getPlayerSectInfo()?.sect?.name
                    },
                    encounterType: 'mystery'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayAdventureEncounter(data.encounter);
                
                // 记录奇遇
                this.recordInteraction('adventure_encounter', {
                    title: data.encounter.title,
                    location: this.gameState.currentLocation
                });
            }
            
        } catch (error) {
            console.error('冒险奇遇生成失败:', error);
        }
    }

    /**
     * 触发门派事件
     */
    async triggerSectEvent() {
        const sectInfo = this.sectSystem.getPlayerSectInfo();
        if (!sectInfo) return;
        
        try {
            const response = await fetch(`${this.mudAPIEndpoint}/sect/event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sectInfo: sectInfo.sect,
                    playerSectStatus: sectInfo.status,
                    eventType: 'mission'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displaySectEvent(data.event);
                
                // 记录门派事件
                this.recordInteraction('sect_event', {
                    sectName: sectInfo.sect.name,
                    eventTitle: data.event.title
                });
            }
            
        } catch (error) {
            console.error('门派事件生成失败:', error);
        }
    }

    /**
     * 计算事件概率
     */
    calculateEventProbability() {
        let baseProbability = 0.3; // 基础30%概率
        
        // 根据角色等级调整
        const level = this.gameState.character.level;
        if (level >= 10) baseProbability += 0.1;
        if (level >= 20) baseProbability += 0.1;
        
        // 根据声望调整
        const totalReputation = Object.values(this.gameState.character.reputation || {})
            .reduce((sum, val) => sum + val, 0);
        if (totalReputation >= 200) baseProbability += 0.1;
        
        // 根据地点调整
        const locationMultiplier = {
            '新手村': 0.8,
            '小镇': 1.0,
            '森林': 1.2,
            '山脉': 1.3,
            '遗迹': 1.5,
            '江湖': 1.4
        };
        
        baseProbability *= locationMultiplier[this.gameState.currentLocation] || 1.0;
        
        return Math.min(0.8, baseProbability); // 最高80%概率
    }

    /**
     * 选择MUD事件类型
     */
    selectMUDEventType() {
        const weights = {
            npc_encounter: 0.4,
            rumor: 0.2,
            adventure: 0.3,
            sect_event: this.sectSystem.getPlayerSectInfo() ? 0.1 : 0
        };
        
        return this.weightedRandomSelect(weights);
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

    /**
     * 更新游戏时间
     */
    updateGameTime() {
        this.gameState.gameTime.hour += 1;
        
        if (this.gameState.gameTime.hour >= 24) {
            this.gameState.gameTime.hour = 0;
            this.gameState.gameTime.day += 1;
        }
        
        // 更新时间段
        const hour = this.gameState.gameTime.hour;
        if (hour >= 6 && hour < 12) {
            this.gameState.gameTime.period = '上午';
        } else if (hour >= 12 && hour < 18) {
            this.gameState.gameTime.period = '下午';
        } else if (hour >= 18 && hour < 22) {
            this.gameState.gameTime.period = '傍晚';
        } else {
            this.gameState.gameTime.period = '夜晚';
        }
    }

    /**
     * 更新角色状态
     */
    updateCharacterStatus() {
        const character = this.gameState.character;
        
        // 自然恢复
        if (character.status.hp < character.getMaxHP()) {
            character.status.hp = Math.min(character.getMaxHP(), character.status.hp + 2);
        }
        
        if (character.status.mp < character.getMaxMP()) {
            character.status.mp = Math.min(character.getMaxMP(), character.status.mp + 1);
        }
        
        // 减少疲劳
        if (character.status.fatigue > 0) {
            character.status.fatigue = Math.max(0, character.status.fatigue - 1);
        }
    }

    /**
     * 处理声望效果
     */
    processReputationEffects() {
        // 检查声望带来的机会
        const opportunities = this.reputationSystem.getReputationOpportunities();
        
        opportunities.forEach(opportunity => {
            if (Math.random() < opportunity.probability) {
                this.triggerReputationOpportunity(opportunity);
            }
        });
    }

    /**
     * 检查门派事件
     */
    async checkSectEvents() {
        const sectInfo = this.sectSystem.getPlayerSectInfo();
        if (!sectInfo) return;
        
        // 检查是否可以升级
        const promotion = this.sectSystem.promoteSectRank();
        if (promotion.success) {
            this.displaySectPromotion(promotion);
        }
        
        // 随机门派任务
        if (Math.random() < 0.1) { // 10%概率
            const mission = await this.sectSystem.generateSectMission(this.gameState);
            if (mission) {
                this.displaySectMission(mission);
            }
        }
    }

    /**
     * 显示NPC遭遇
     */
    displayNPCEncounter(npc, dialogue) {
        const event = {
            type: 'npc_encounter',
            title: `遇到${npc.name}`,
            description: `在${this.gameState.currentLocation}，你遇到了${npc.title}${npc.name}。\n\n${npc.description}`,
            dialogue: dialogue,
            npc: npc,
            timestamp: Date.now()
        };
        
        this.displayMUDEvent(event);
    }

    /**
     * 显示传闻事件
     */
    displayRumorEvent(rumor) {
        const event = {
            type: 'rumor',
            title: rumor.title,
            description: `你听到了一个江湖传闻：\n\n${rumor.content}\n\n消息来源：${rumor.source}\n可信度：${rumor.reliability}/10`,
            timestamp: Date.now()
        };
        
        this.displayMUDEvent(event);
    }

    /**
     * 显示冒险奇遇
     */
    displayAdventureEncounter(encounter) {
        const event = {
            type: 'adventure',
            title: encounter.title,
            description: encounter.initial_description,
            encounter: encounter,
            timestamp: Date.now()
        };
        
        this.displayMUDEvent(event);
    }

    /**
     * 显示门派事件
     */
    displaySectEvent(sectEvent) {
        const event = {
            type: 'sect_event',
            title: sectEvent.title,
            description: sectEvent.description,
            sectEvent: sectEvent,
            timestamp: Date.now()
        };
        
        this.displayMUDEvent(event);
    }

    /**
     * 显示MUD事件（通用方法）
     */
    displayMUDEvent(event) {
        // 这里应该调用UI管理器显示事件
        console.log(`🎭 MUD事件: ${event.title}`);
        console.log(event.description);
        
        // 触发自定义事件，让UI系统处理
        window.dispatchEvent(new CustomEvent('mudEvent', { detail: event }));
    }

    /**
     * 记录互动
     */
    recordInteraction(type, data) {
        this.gameState.recentInteractions.push({
            type: type,
            data: data,
            timestamp: Date.now()
        });
        
        // 只保留最近20个互动记录
        if (this.gameState.recentInteractions.length > 20) {
            this.gameState.recentInteractions.shift();
        }
    }

    /**
     * 计算玩家影响力
     */
    calculatePlayerInfluence() {
        const character = this.gameState.character;
        const totalReputation = Object.values(character.reputation || {})
            .reduce((sum, val) => sum + val, 0);
        
        if (totalReputation < 100) return '微不足道';
        if (totalReputation < 300) return '小有名气';
        if (totalReputation < 600) return '颇有影响';
        if (totalReputation < 1000) return '名动一方';
        return '威震江湖';
    }

    /**
     * 停止MUD游戏循环
     */
    stopMUDGameLoop() {
        this.isRunning = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        console.log('🛑 MUD游戏循环已停止');
    }

    /**
     * 获取游戏状态
     */
    getMUDGameState() {
        return {
            ...this.gameState,
            npcCount: this.npcSystem.npcs.size,
            sectInfo: this.sectSystem.getPlayerSectInfo(),
            reputationStatus: this.reputationSystem.getReputationStatus()
        };
    }
}

// 全局实例
window.MUDGameEngine = MUDGameEngine;
