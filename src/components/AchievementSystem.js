/**
 * 成就系统
 * 基于角色属性和行为触发成就和社会地位变化
 */
class AchievementSystem {
    constructor() {
        this.achievements = this.loadAchievements();
        this.socialRanks = this.loadSocialRanks();
        this.unlockedAchievements = new Set();
        
        console.log('🏆 成就系统初始化完成');
    }

    /**
     * 加载成就定义
     */
    loadAchievements() {
        return {
            // 属性相关成就
            strength_master: {
                id: 'strength_master',
                name: '力量大师',
                description: '力量属性达到80点',
                icon: '💪',
                condition: (character) => character.attributes.strength >= 80,
                rewards: { reputation: 50, title: '力量大师' },
                rarity: 'rare'
            },
            
            wisdom_sage: {
                id: 'wisdom_sage',
                name: '智慧贤者',
                description: '智力属性达到90点',
                icon: '🧠',
                condition: (character) => character.attributes.intelligence >= 90,
                rewards: { reputation: 60, title: '智慧贤者' },
                rarity: 'rare'
            },
            
            // 人格相关成就
            brave_heart: {
                id: 'brave_heart',
                name: '勇者之心',
                description: '勇气达到95点',
                icon: '❤️',
                condition: (character) => character.personality.courage >= 95,
                rewards: { reputation: 40, title: '无畏勇者' },
                rarity: 'uncommon'
            },
            
            compassionate_soul: {
                id: 'compassionate_soul',
                name: '慈悲之魂',
                description: '慈悲心达到90点',
                icon: '🕊️',
                condition: (character) => character.personality.compassion >= 90,
                rewards: { karma: 100, title: '慈悲圣者' },
                rarity: 'rare'
            },
            
            // 社会地位相关成就
            renowned_hero: {
                id: 'renowned_hero',
                name: '声名远扬',
                description: '声望达到500点',
                icon: '⭐',
                condition: (character) => character.social.reputation >= 500,
                rewards: { influence: 100, socialStatus: 'celebrity' },
                rarity: 'rare'
            },
            
            influential_figure: {
                id: 'influential_figure',
                name: '权势人物',
                description: '影响力达到300点',
                icon: '👑',
                condition: (character) => character.social.influence >= 300,
                rewards: { reputation: 100, socialStatus: 'noble' },
                rarity: 'rare'
            },
            
            // 财富相关成就
            wealthy_merchant: {
                id: 'wealthy_merchant',
                name: '富甲一方',
                description: '财富达到10000',
                icon: '💰',
                condition: (character) => character.status.wealth >= 10000,
                rewards: { influence: 50, title: '富商' },
                rarity: 'uncommon'
            },
            
            // 修为相关成就（根据剧情类型）
            cultivation_master: {
                id: 'cultivation_master',
                name: '修为大成',
                description: '达到高级修为境界',
                icon: '⚡',
                condition: (character) => {
                    const highLevelCultivations = ['元婴期', '斗王', '数字生命', '宗师', '大师'];
                    return highLevelCultivations.includes(character.status.cultivation);
                },
                rewards: { reputation: 200, influence: 100, title: '修行大师' },
                rarity: 'legendary'
            },
            
            // 特殊成就
            karma_saint: {
                id: 'karma_saint',
                name: '功德圆满',
                description: '因果业力达到500点',
                icon: '🌟',
                condition: (character) => character.social.karma >= 500,
                rewards: { reputation: 300, title: '功德圣者', socialStatus: 'saint' },
                rarity: 'legendary'
            },
            
            karma_demon: {
                id: 'karma_demon',
                name: '业障深重',
                description: '因果业力低于-500点',
                icon: '😈',
                condition: (character) => character.social.karma <= -500,
                rewards: { influence: 200, title: '魔道中人', socialStatus: 'outlaw' },
                rarity: 'legendary'
            }
        };
    }

    /**
     * 加载社会地位系统
     */
    loadSocialRanks() {
        return {
            commoner: {
                name: '平民',
                description: '普通的平民百姓',
                requirements: { reputation: 0, influence: 0 },
                benefits: {}
            },
            
            celebrity: {
                name: '名人',
                description: '小有名气的人物',
                requirements: { reputation: 200, influence: 50 },
                benefits: { wealthMultiplier: 1.2, eventBonus: 0.1 }
            },
            
            noble: {
                name: '贵族',
                description: '有权势的贵族',
                requirements: { reputation: 300, influence: 200 },
                benefits: { wealthMultiplier: 1.5, eventBonus: 0.2, specialEvents: true }
            },
            
            hero: {
                name: '英雄',
                description: '受人敬仰的英雄',
                requirements: { reputation: 800, karma: 200 },
                benefits: { wealthMultiplier: 1.3, eventBonus: 0.3, heroEvents: true }
            },
            
            saint: {
                name: '圣者',
                description: '德高望重的圣人',
                requirements: { reputation: 1000, karma: 500, compassion: 90 },
                benefits: { wealthMultiplier: 1.1, eventBonus: 0.4, saintEvents: true }
            },
            
            outlaw: {
                name: '魔道中人',
                description: '行走在黑暗中的人',
                requirements: { karma: -300, reputation: 100 },
                benefits: { wealthMultiplier: 1.4, eventBonus: 0.2, darkEvents: true }
            }
        };
    }

    /**
     * 检查并触发成就
     */
    checkAchievements(character) {
        const newAchievements = [];
        
        for (const [id, achievement] of Object.entries(this.achievements)) {
            if (!this.unlockedAchievements.has(id) && achievement.condition(character)) {
                this.unlockAchievement(character, achievement);
                newAchievements.push(achievement);
            }
        }
        
        return newAchievements;
    }

    /**
     * 解锁成就
     */
    unlockAchievement(character, achievement) {
        this.unlockedAchievements.add(achievement.id);
        character.achievements.push(achievement.id);
        
        // 应用成就奖励
        if (achievement.rewards) {
            this.applyRewards(character, achievement.rewards);
        }
        
        console.log(`🏆 解锁成就: ${achievement.name}`);
        
        // 通知UI
        if (window.gameEngine && window.gameEngine.uiManager) {
            window.gameEngine.uiManager.showAchievementUnlocked(achievement);
            window.gameEngine.uiManager.addLogEntry('achievement', 
                `🏆 解锁成就：${achievement.name} - ${achievement.description}`);
        }
    }

    /**
     * 应用成就奖励
     */
    applyRewards(character, rewards) {
        if (rewards.reputation) {
            character.social.reputation += rewards.reputation;
        }
        
        if (rewards.influence) {
            character.social.influence += rewards.influence;
        }
        
        if (rewards.karma) {
            character.social.karma += rewards.karma;
        }
        
        if (rewards.title) {
            character.social.titles.push(rewards.title);
        }
        
        if (rewards.socialStatus) {
            character.social.socialStatus = rewards.socialStatus;
        }
        
        // 记录奖励获得
        if (window.gameEngine && window.gameEngine.uiManager) {
            const rewardText = this.formatRewards(rewards);
            window.gameEngine.uiManager.addLogEntry('reward', 
                `💎 获得奖励：${rewardText}`);
        }
    }

    /**
     * 格式化奖励文本
     */
    formatRewards(rewards) {
        const parts = [];
        
        if (rewards.reputation) parts.push(`声望+${rewards.reputation}`);
        if (rewards.influence) parts.push(`影响力+${rewards.influence}`);
        if (rewards.karma) parts.push(`业力+${rewards.karma}`);
        if (rewards.title) parts.push(`称号"${rewards.title}"`);
        if (rewards.socialStatus) parts.push(`社会地位"${this.socialRanks[rewards.socialStatus]?.name}"`);
        
        return parts.join(', ');
    }

    /**
     * 检查并更新社会地位
     */
    updateSocialStatus(character) {
        let newStatus = 'commoner';
        let highestScore = -1;
        
        for (const [statusId, status] of Object.entries(this.socialRanks)) {
            if (this.meetsRequirements(character, status.requirements)) {
                const score = this.calculateStatusScore(character, status.requirements);
                if (score > highestScore) {
                    highestScore = score;
                    newStatus = statusId;
                }
            }
        }
        
        if (newStatus !== character.social.socialStatus) {
            const oldStatus = this.socialRanks[character.social.socialStatus];
            const newStatusData = this.socialRanks[newStatus];
            
            character.social.socialStatus = newStatus;
            
            console.log(`👑 社会地位变化: ${oldStatus?.name || '无'} → ${newStatusData.name}`);
            
            if (window.gameEngine && window.gameEngine.uiManager) {
                window.gameEngine.uiManager.addLogEntry('status', 
                    `👑 社会地位提升：${newStatusData.name} - ${newStatusData.description}`);
            }
        }
    }

    /**
     * 检查是否满足要求
     */
    meetsRequirements(character, requirements) {
        for (const [key, value] of Object.entries(requirements)) {
            if (key === 'reputation' && character.social.reputation < value) return false;
            if (key === 'influence' && character.social.influence < value) return false;
            if (key === 'karma' && character.social.karma < value) return false;
            if (key === 'compassion' && character.personality.compassion < value) return false;
        }
        return true;
    }

    /**
     * 计算地位分数
     */
    calculateStatusScore(character, requirements) {
        let score = 0;
        for (const [key, value] of Object.entries(requirements)) {
            if (key === 'reputation') score += character.social.reputation - value;
            if (key === 'influence') score += character.social.influence - value;
            if (key === 'karma') score += Math.abs(character.social.karma) - Math.abs(value);
        }
        return score;
    }

    /**
     * 获取角色的社会地位信息
     */
    getSocialStatusInfo(character) {
        const status = this.socialRanks[character.social.socialStatus];
        return {
            current: status,
            benefits: status.benefits,
            nextRank: this.getNextRank(character),
            achievements: character.achievements.map(id => this.achievements[id]).filter(Boolean)
        };
    }

    /**
     * 获取下一个可达成的地位
     */
    getNextRank(character) {
        const currentRank = this.socialRanks[character.social.socialStatus];
        let nextRank = null;
        let minGap = Infinity;
        
        for (const [statusId, status] of Object.entries(this.socialRanks)) {
            if (statusId === character.social.socialStatus) continue;
            
            const gap = this.calculateRequirementGap(character, status.requirements);
            if (gap > 0 && gap < minGap) {
                minGap = gap;
                nextRank = { ...status, id: statusId, gap };
            }
        }
        
        return nextRank;
    }

    /**
     * 计算达成要求的差距
     */
    calculateRequirementGap(character, requirements) {
        let totalGap = 0;
        let hasGap = false;
        
        for (const [key, value] of Object.entries(requirements)) {
            let current = 0;
            if (key === 'reputation') current = character.social.reputation;
            if (key === 'influence') current = character.social.influence;
            if (key === 'karma') current = character.social.karma;
            if (key === 'compassion') current = character.personality.compassion;
            
            if (current < value) {
                totalGap += value - current;
                hasGap = true;
            }
        }
        
        return hasGap ? totalGap : -1;
    }

    /**
     * 获取可解锁的成就提示
     */
    getAchievementHints(character) {
        const hints = [];
        
        for (const [id, achievement] of Object.entries(this.achievements)) {
            if (!this.unlockedAchievements.has(id)) {
                const hint = this.getAchievementHint(character, achievement);
                if (hint) hints.push(hint);
            }
        }
        
        return hints.sort((a, b) => a.progress - b.progress).slice(0, 5);
    }

    /**
     * 获取单个成就的提示
     */
    getAchievementHint(character, achievement) {
        // 这里可以根据成就类型计算进度
        // 简化实现，返回基本信息
        return {
            achievement,
            progress: Math.random(), // 实际应该计算真实进度
            hint: `继续努力，即将解锁 ${achievement.name}！`
        };
    }
}

// 创建全局成就系统实例
window.AchievementSystem = new AchievementSystem();
