/**
 * 江湖声望系统 - 参考北大侠客行的声望机制
 * 结合LLM生成动态声望事件和后果
 */
class ReputationSystem {
    constructor() {
        this.reputationCategories = this.initializeReputationCategories();
        this.playerReputation = this.initializePlayerReputation();
        this.reputationEvents = []; // 声望事件历史
        this.reputationThresholds = this.initializeThresholds();
        
        console.log('🏆 江湖声望系统初始化完成');
    }

    /**
     * 初始化声望分类
     */
    initializeReputationCategories() {
        return {
            // 正派声望
            righteous: {
                name: '正派声望',
                description: '在正派武林中的名声',
                maxValue: 1000,
                benefits: ['正派NPC好感度提升', '学习正派武功', '获得正派任务'],
                conflicts: ['evil'] // 与邪派声望冲突
            },
            
            // 邪派声望
            evil: {
                name: '邪派声望',
                description: '在邪派中的威名',
                maxValue: 1000,
                benefits: ['邪派NPC好感度提升', '学习邪派武功', '获得邪派任务'],
                conflicts: ['righteous'] // 与正派声望冲突
            },
            
            // 江湖声望
            jianghu: {
                name: '江湖声望',
                description: '在整个江湖中的知名度',
                maxValue: 2000,
                benefits: ['提升影响力', '获得特殊机遇', 'NPC主动接触'],
                conflicts: [] // 不与其他声望冲突
            },
            
            // 门派声望
            sect: {
                name: '门派声望',
                description: '在所属门派中的地位',
                maxValue: 1000,
                benefits: ['门派内部地位', '学习高级武功', '参与门派决策'],
                conflicts: []
            },
            
            // 商业声望
            merchant: {
                name: '商业声望',
                description: '在商界的信誉',
                maxValue: 500,
                benefits: ['商品折扣', '特殊商品', '投资机会'],
                conflicts: []
            },
            
            // 学者声望
            scholar: {
                name: '学者声望',
                description: '在文人学士中的名望',
                maxValue: 500,
                benefits: ['获得古籍', '学习文化技能', '参与文会'],
                conflicts: []
            }
        };
    }

    /**
     * 初始化玩家声望
     */
    initializePlayerReputation() {
        const reputation = {};
        Object.keys(this.reputationCategories).forEach(category => {
            reputation[category] = 0;
        });
        return reputation;
    }

    /**
     * 初始化声望等级阈值
     */
    initializeThresholds() {
        return {
            // 声望等级对应的数值范围
            levels: [
                { name: '无名小卒', min: 0, max: 49, color: '#666666' },
                { name: '初出茅庐', min: 50, max: 99, color: '#888888' },
                { name: '小有名气', min: 100, max: 199, color: '#4CAF50' },
                { name: '声名鹊起', min: 200, max: 399, color: '#2196F3' },
                { name: '名动一方', min: 400, max: 699, color: '#9C27B0' },
                { name: '威震江湖', min: 700, max: 999, color: '#FF9800' },
                { name: '名满天下', min: 1000, max: 1499, color: '#F44336' },
                { name: '传奇人物', min: 1500, max: 1999, color: '#E91E63' },
                { name: '武林神话', min: 2000, max: 9999, color: '#FFD700' }
            ]
        };
    }

    /**
     * 获取声望等级
     */
    getReputationLevel(category, value = null) {
        const repValue = value !== null ? value : this.playerReputation[category];
        
        for (const level of this.reputationThresholds.levels) {
            if (repValue >= level.min && repValue <= level.max) {
                return level;
            }
        }
        
        return this.reputationThresholds.levels[0]; // 默认返回最低等级
    }

    /**
     * 修改声望值
     */
    modifyReputation(category, change, reason = '', source = 'unknown') {
        if (!this.reputationCategories[category]) {
            console.warn(`未知的声望类别: ${category}`);
            return false;
        }

        const oldValue = this.playerReputation[category];
        const categoryInfo = this.reputationCategories[category];
        
        // 计算新值，考虑上限
        let newValue = Math.max(0, Math.min(categoryInfo.maxValue, oldValue + change));
        
        // 处理冲突声望
        if (change > 0 && categoryInfo.conflicts.length > 0) {
            categoryInfo.conflicts.forEach(conflictCategory => {
                const conflictReduction = Math.floor(change * 0.5); // 冲突声望减少一半
                this.playerReputation[conflictCategory] = Math.max(0, 
                    this.playerReputation[conflictCategory] - conflictReduction
                );
            });
        }
        
        this.playerReputation[category] = newValue;
        
        // 记录声望事件
        const event = {
            category: category,
            change: change,
            oldValue: oldValue,
            newValue: newValue,
            reason: reason,
            source: source,
            timestamp: Date.now()
        };
        
        this.reputationEvents.push(event);
        
        // 检查是否有等级变化
        const oldLevel = this.getReputationLevel(category, oldValue);
        const newLevel = this.getReputationLevel(category, newValue);
        
        if (oldLevel.name !== newLevel.name) {
            this.handleReputationLevelChange(category, oldLevel, newLevel);
        }
        
        console.log(`🏆 ${categoryInfo.name}变化: ${change > 0 ? '+' : ''}${change} (${reason})`);
        
        return {
            success: true,
            oldValue: oldValue,
            newValue: newValue,
            oldLevel: oldLevel,
            newLevel: newLevel,
            levelChanged: oldLevel.name !== newLevel.name
        };
    }

    /**
     * 处理声望等级变化
     */
    handleReputationLevelChange(category, oldLevel, newLevel) {
        const categoryInfo = this.reputationCategories[category];
        
        console.log(`🎉 ${categoryInfo.name}等级提升: ${oldLevel.name} → ${newLevel.name}`);
        
        // 触发等级变化事件
        this.triggerReputationLevelEvent(category, oldLevel, newLevel);
    }

    /**
     * 触发声望等级事件
     */
    async triggerReputationLevelEvent(category, oldLevel, newLevel) {
        const categoryInfo = this.reputationCategories[category];
        
        // 基于LLM生成声望等级变化事件
        const prompt = `为武侠MUD游戏生成一个声望等级提升事件。

【声望信息】
- 声望类型：${categoryInfo.name}
- 旧等级：${oldLevel.name}
- 新等级：${newLevel.name}
- 声望描述：${categoryInfo.description}

【事件要求】
1. 体现声望等级提升的意义
2. 包含江湖中的反响和变化
3. 可能带来的新机遇或挑战
4. 符合武侠世界观

请生成JSON格式的事件：
{
  "title": "声望提升事件标题",
  "description": "详细的事件描述（200-300字）",
  "effects": {
    "immediate": "立即效果",
    "longTerm": "长期影响"
  },
  "opportunities": [
    {
      "type": "npc_approach",
      "description": "有NPC主动接触"
    },
    {
      "type": "special_mission",
      "description": "获得特殊任务机会"
    }
  ],
  "challenges": [
    {
      "type": "rivalry",
      "description": "可能面临的挑战"
    }
  ]
}`;

        try {
            const event = await this.callLLMForReputationEvent(prompt);
            this.processReputationEvent(event, category);
        } catch (error) {
            console.warn('声望事件生成失败:', error);
            this.processTemplateReputationEvent(category, oldLevel, newLevel);
        }
    }

    /**
     * 基于行为自动调整声望
     */
    processActionReputation(action, context = {}) {
        const reputationChanges = this.calculateActionReputation(action, context);
        
        reputationChanges.forEach(change => {
            this.modifyReputation(
                change.category,
                change.value,
                change.reason,
                'action'
            );
        });
        
        return reputationChanges;
    }

    /**
     * 计算行为对声望的影响
     */
    calculateActionReputation(action, context) {
        const changes = [];
        
        switch (action.type) {
            case 'help_innocent':
                changes.push({
                    category: 'righteous',
                    value: 10,
                    reason: '帮助无辜民众'
                });
                changes.push({
                    category: 'jianghu',
                    value: 5,
                    reason: '行侠仗义'
                });
                break;
                
            case 'defeat_villain':
                changes.push({
                    category: 'righteous',
                    value: 20,
                    reason: '击败邪恶之徒'
                });
                changes.push({
                    category: 'jianghu',
                    value: 15,
                    reason: '除暴安良'
                });
                break;
                
            case 'kill_innocent':
                changes.push({
                    category: 'evil',
                    value: 15,
                    reason: '滥杀无辜'
                });
                changes.push({
                    category: 'jianghu',
                    value: -10,
                    reason: '恶名昭彰'
                });
                break;
                
            case 'complete_sect_mission':
                if (context.sectId) {
                    changes.push({
                        category: 'sect',
                        value: 25,
                        reason: '完成门派任务'
                    });
                }
                break;
                
            case 'successful_trade':
                changes.push({
                    category: 'merchant',
                    value: 5,
                    reason: '成功的商业交易'
                });
                break;
                
            case 'scholarly_achievement':
                changes.push({
                    category: 'scholar',
                    value: 10,
                    reason: '学术成就'
                });
                break;
        }
        
        return changes;
    }

    /**
     * 获取声望影响的NPC态度
     */
    getNPCAttitudeModifier(npcType, npcAlignment = 'neutral') {
        let modifier = 0;
        
        switch (npcAlignment) {
            case 'righteous':
                modifier += this.playerReputation.righteous * 0.1;
                modifier -= this.playerReputation.evil * 0.15;
                break;
                
            case 'evil':
                modifier += this.playerReputation.evil * 0.1;
                modifier -= this.playerReputation.righteous * 0.15;
                break;
                
            case 'merchant':
                modifier += this.playerReputation.merchant * 0.2;
                break;
                
            case 'scholar':
                modifier += this.playerReputation.scholar * 0.2;
                break;
                
            default:
                modifier += this.playerReputation.jianghu * 0.05;
        }
        
        // 江湖声望对所有NPC都有轻微正面影响
        modifier += this.playerReputation.jianghu * 0.02;
        
        return Math.max(-50, Math.min(50, modifier)); // 限制在-50到50之间
    }

    /**
     * 获取声望带来的特殊机会
     */
    getReputationOpportunities() {
        const opportunities = [];
        
        Object.entries(this.playerReputation).forEach(([category, value]) => {
            const level = this.getReputationLevel(category, value);
            const categoryInfo = this.reputationCategories[category];
            
            if (value >= 200) { // 声名鹊起以上
                opportunities.push({
                    category: category,
                    type: 'special_npc_encounter',
                    description: `因为你在${categoryInfo.name}方面的名声，可能会遇到特殊NPC`,
                    probability: Math.min(0.3, value / 1000)
                });
            }
            
            if (value >= 500) { // 名动一方以上
                opportunities.push({
                    category: category,
                    type: 'reputation_mission',
                    description: `获得与${categoryInfo.name}相关的特殊任务`,
                    probability: Math.min(0.2, value / 1500)
                });
            }
        });
        
        return opportunities;
    }

    /**
     * 获取完整的声望状态
     */
    getReputationStatus() {
        const status = {};
        
        Object.entries(this.playerReputation).forEach(([category, value]) => {
            const categoryInfo = this.reputationCategories[category];
            const level = this.getReputationLevel(category, value);
            
            status[category] = {
                name: categoryInfo.name,
                value: value,
                maxValue: categoryInfo.maxValue,
                level: level,
                benefits: categoryInfo.benefits,
                progress: value / categoryInfo.maxValue
            };
        });
        
        return status;
    }

    /**
     * 获取声望历史记录
     */
    getReputationHistory(limit = 10) {
        return this.reputationEvents
            .slice(-limit)
            .reverse()
            .map(event => ({
                ...event,
                categoryName: this.reputationCategories[event.category]?.name || event.category,
                timeAgo: this.formatTimeAgo(event.timestamp)
            }));
    }

    /**
     * 格式化时间差
     */
    formatTimeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}天前`;
        if (hours > 0) return `${hours}小时前`;
        if (minutes > 0) return `${minutes}分钟前`;
        return '刚刚';
    }

    /**
     * 占位符方法 - 调用LLM生成声望事件
     */
    async callLLMForReputationEvent(prompt) {
        // 实际实现中应该调用后端API
        return {
            title: "声名远扬",
            description: "你的名声在江湖中传播开来，越来越多的人开始关注你的一举一动。",
            effects: {
                immediate: "获得更多关注",
                longTerm: "影响力持续扩大"
            },
            opportunities: [
                {
                    type: "npc_approach",
                    description: "有江湖前辈主动接触"
                }
            ],
            challenges: [
                {
                    type: "rivalry",
                    description: "可能招致嫉妒和挑战"
                }
            ]
        };
    }

    /**
     * 处理声望事件
     */
    processReputationEvent(event, category) {
        console.log(`🎭 声望事件: ${event.title}`);
        // 这里可以触发游戏中的具体事件
    }

    /**
     * 处理模板声望事件
     */
    processTemplateReputationEvent(category, oldLevel, newLevel) {
        const categoryInfo = this.reputationCategories[category];
        console.log(`🎉 ${categoryInfo.name}提升到${newLevel.name}！`);
    }
}

// 全局实例
window.ReputationSystem = ReputationSystem;
