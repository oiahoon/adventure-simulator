/**
 * 事件模板管理器
 * 定义各种事件类型的模板和生成规则
 */

class EventTemplates {
    constructor() {
        this.templates = this.initializeTemplates();
    }

    /**
     * 初始化所有事件模板
     */
    initializeTemplates() {
        return [
            // 历史文化类事件
            {
                category: '历史文化',
                type: 'cultural',
                setting: '历史场景',
                rarity: 'common',
                specialRequirements: '事件应该基于真实的历史文化背景，可以是中国古代、欧洲中世纪、古埃及、古希腊等任何历史时期。'
            },
            {
                category: '神话传说',
                type: 'mythological',
                setting: '神话世界',
                rarity: 'rare',
                specialRequirements: '事件应该涉及各种神话传说，如中国神话、希腊神话、北欧神话、日本神话等。可以包含神祇、神兽、法宝等元素。'
            },
            
            // 现代都市类事件
            {
                category: '现代都市',
                type: 'modern',
                setting: '现代城市',
                rarity: 'common',
                specialRequirements: '事件发生在现代都市环境中，可以涉及科技、商业、社交媒体、都市生活等现代元素。'
            },
            {
                category: '科幻未来',
                type: 'sci-fi',
                setting: '未来世界',
                rarity: 'rare',
                specialRequirements: '事件设定在未来或科幻背景下，可以包含高科技、太空、人工智能、基因工程等科幻元素。'
            },
            
            // 奇幻冒险类事件
            {
                category: '奇幻冒险',
                type: 'fantasy',
                setting: '奇幻世界',
                rarity: 'common',
                specialRequirements: '经典的奇幻冒险事件，包含魔法、怪物、宝藏、法师、骑士等奇幻元素。'
            },
            {
                category: '暗黑恐怖',
                type: 'horror',
                setting: '恐怖环境',
                rarity: 'uncommon',
                specialRequirements: '带有恐怖或悬疑色彩的事件，但要适度，不要过于血腥或恐怖。重点在于营造紧张氛围。'
            },
            
            // 东方文化类事件
            {
                category: '东方武侠',
                type: 'wuxia',
                setting: '武侠世界',
                rarity: 'uncommon',
                specialRequirements: '基于中国武侠文化的事件，包含江湖、武功、侠客、门派、武林大会等元素。'
            },
            {
                category: '仙侠修真',
                type: 'xianxia',
                setting: '修真界',
                rarity: 'rare',
                specialRequirements: '中国仙侠修真背景，包含修炼、法宝、仙人、妖魔、天劫等元素。'
            },
            
            // 日常生活类事件
            {
                category: '日常生活',
                type: 'slice-of-life',
                setting: '日常环境',
                rarity: 'common',
                specialRequirements: '平凡的日常生活事件，但要有趣味性。可以是工作、学习、家庭、友情等日常场景。'
            },
            {
                category: '商业经营',
                type: 'business',
                setting: '商业环境',
                rarity: 'uncommon',
                specialRequirements: '涉及商业、贸易、经营、投资等商业活动的事件。可以是古代商队、现代公司等。'
            },
            
            // 自然探险类事件
            {
                category: '自然探险',
                type: 'exploration',
                setting: '自然环境',
                rarity: 'common',
                specialRequirements: '在自然环境中的探险事件，如森林、山脉、海洋、沙漠等。可以遇到野生动物、自然现象等。'
            },
            {
                category: '海洋冒险',
                type: 'maritime',
                setting: '海洋',
                rarity: 'uncommon',
                specialRequirements: '海洋相关的冒险事件，可以包含海盗、海怪、沉船、岛屿探索等元素。'
            },
            
            // 社交政治类事件
            {
                category: '宫廷政治',
                type: 'political',
                setting: '宫廷',
                rarity: 'rare',
                specialRequirements: '宫廷政治斗争事件，涉及权谋、外交、联姻、叛乱等政治元素。可以是任何历史时期的宫廷。'
            },
            {
                category: '社交聚会',
                type: 'social',
                setting: '社交场合',
                rarity: 'common',
                specialRequirements: '各种社交场合的事件，如宴会、舞会、聚会、庆典等。重点在于人际交往。'
            },
            
            // 艺术文化类事件
            {
                category: '艺术创作',
                type: 'artistic',
                setting: '艺术环境',
                rarity: 'uncommon',
                specialRequirements: '与艺术创作相关的事件，如绘画、音乐、诗歌、雕塑、戏剧等艺术形式。'
            },
            {
                category: '学术研究',
                type: 'academic',
                setting: '学术环境',
                rarity: 'uncommon',
                specialRequirements: '学术研究相关的事件，如图书馆、学院、实验室、考古发掘等学术场景。'
            },
            
            // 特殊奇遇类事件
            {
                category: '时空穿越',
                type: 'time-travel',
                setting: '时空裂缝',
                rarity: 'legendary',
                specialRequirements: '涉及时间旅行或空间穿越的特殊事件。角色可能穿越到不同的时代或世界。'
            },
            {
                category: '平行世界',
                type: 'parallel',
                setting: '平行空间',
                rarity: 'legendary',
                specialRequirements: '平行世界或多元宇宙相关的事件。角色可能遇到另一个版本的自己或完全不同的世界规则。'
            },
            
            // 生存挑战类事件
            {
                category: '生存挑战',
                type: 'survival',
                setting: '恶劣环境',
                rarity: 'uncommon',
                specialRequirements: '在恶劣环境中的生存挑战，如荒岛、沙漠、雪山、末世等。重点在于资源管理和生存技能。'
            },
            {
                category: '竞技比赛',
                type: 'competition',
                setting: '竞技场',
                rarity: 'uncommon',
                specialRequirements: '各种竞技比赛事件，如武术比赛、智力竞赛、体育竞技、艺术比赛等。'
            }
        ];
    }

    /**
     * 获取随机模板
     */
    getRandomTemplate() {
        // 根据稀有度加权随机选择
        const weightedTemplates = [];
        
        this.templates.forEach(template => {
            let weight = 1;
            switch (template.rarity) {
                case 'common': weight = 10; break;
                case 'uncommon': weight = 5; break;
                case 'rare': weight = 2; break;
                case 'legendary': weight = 1; break;
                default: weight = 5;
            }
            
            for (let i = 0; i < weight; i++) {
                weightedTemplates.push(template);
            }
        });
        
        return weightedTemplates[Math.floor(Math.random() * weightedTemplates.length)];
    }

    /**
     * 根据类别获取模板
     */
    getTemplatesByCategory(category) {
        return this.templates.filter(template => template.category === category);
    }

    /**
     * 根据稀有度获取模板
     */
    getTemplatesByRarity(rarity) {
        return this.templates.filter(template => template.rarity === rarity);
    }

    /**
     * 获取所有类别
     */
    getAllCategories() {
        return [...new Set(this.templates.map(template => template.category))];
    }

    /**
     * 获取所有稀有度
     */
    getAllRarities() {
        return [...new Set(this.templates.map(template => template.rarity))];
    }

    /**
     * 获取模板统计信息
     */
    getStats() {
        const stats = {
            total: this.templates.length,
            byCategory: {},
            byRarity: {},
            byType: {}
        };

        this.templates.forEach(template => {
            // 按类别统计
            stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1;
            
            // 按稀有度统计
            stats.byRarity[template.rarity] = (stats.byRarity[template.rarity] || 0) + 1;
            
            // 按类型统计
            stats.byType[template.type] = (stats.byType[template.type] || 0) + 1;
        });

        return stats;
    }
}

module.exports = EventTemplates;
