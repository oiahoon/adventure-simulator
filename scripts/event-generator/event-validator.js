/**
 * 事件验证器
 * 验证生成的事件是否符合游戏规则和质量标准
 */

class EventValidator {
    constructor() {
        this.requiredFields = ['id', 'title', 'description', 'type', 'choices'];
        this.validTypes = [
            'cultural', 'mythological', 'modern', 'sci-fi', 'fantasy', 'horror',
            'wuxia', 'xianxia', 'slice-of-life', 'business', 'exploration',
            'maritime', 'political', 'social', 'artistic', 'academic',
            'time-travel', 'parallel', 'survival', 'competition'
        ];
        this.validRarities = ['common', 'uncommon', 'rare', 'legendary'];
        this.validRequirements = [
            'combat', 'magic', 'social', 'exploration', 'survival',
            'strength', 'intelligence', 'dexterity', 'constitution', 'charisma', 'luck'
        ];
    }

    /**
     * 验证事件
     */
    validateEvent(event) {
        try {
            // 基础字段验证
            if (!this.validateRequiredFields(event)) {
                return false;
            }

            // 内容质量验证
            if (!this.validateContent(event)) {
                return false;
            }

            // 选择验证
            if (!this.validateChoices(event.choices)) {
                return false;
            }

            // 效果验证
            if (!this.validateEffects(event)) {
                return false;
            }

            // 类型和稀有度验证
            if (!this.validateTypeAndRarity(event)) {
                return false;
            }

            return true;

        } catch (error) {
            console.error('事件验证过程中出错:', error);
            return false;
        }
    }

    /**
     * 验证必需字段
     */
    validateRequiredFields(event) {
        for (const field of this.requiredFields) {
            if (!event[field]) {
                console.warn(`缺少必需字段: ${field}`);
                return false;
            }
        }
        return true;
    }

    /**
     * 验证内容质量
     */
    validateContent(event) {
        // 标题验证
        if (!event.title || event.title.length < 2 || event.title.length > 50) {
            console.warn('标题长度不合适');
            return false;
        }

        // 描述验证
        if (!event.description || event.description.length < 20 || event.description.length > 500) {
            console.warn('描述长度不合适');
            return false;
        }

        // 检查是否包含不当内容
        if (this.containsInappropriateContent(event.title + ' ' + event.description)) {
            console.warn('包含不当内容');
            return false;
        }

        return true;
    }

    /**
     * 验证选择选项
     */
    validateChoices(choices) {
        if (!Array.isArray(choices) || choices.length < 2 || choices.length > 6) {
            console.warn('选择数量不合适');
            return false;
        }

        for (let i = 0; i < choices.length; i++) {
            const choice = choices[i];

            // 选择文本验证
            if (!choice.text || choice.text.length < 3 || choice.text.length > 100) {
                console.warn(`选择 ${i + 1} 文本长度不合适`);
                return false;
            }

            // 难度验证
            if (choice.difficulty !== undefined) {
                if (typeof choice.difficulty !== 'number' || choice.difficulty < 10 || choice.difficulty > 90) {
                    console.warn(`选择 ${i + 1} 难度值不合适`);
                    return false;
                }
            }

            // 需求验证
            if (choice.requirement && !this.validRequirements.includes(choice.requirement)) {
                console.warn(`选择 ${i + 1} 需求类型无效`);
                return false;
            }

            // 效果验证
            if (choice.effects && !this.validateChoiceEffects(choice.effects)) {
                console.warn(`选择 ${i + 1} 效果无效`);
                return false;
            }
        }

        return true;
    }

    /**
     * 验证选择效果
     */
    validateChoiceEffects(effects) {
        const validEffectKeys = ['hp', 'mp', 'wealth', 'reputation', 'experience', 'fatigue'];
        
        for (const [key, value] of Object.entries(effects)) {
            if (!validEffectKeys.includes(key)) {
                console.warn(`无效的效果键: ${key}`);
                return false;
            }

            if (typeof value !== 'number' || Math.abs(value) > 1000) {
                console.warn(`效果值超出范围: ${key} = ${value}`);
                return false;
            }
        }

        return true;
    }

    /**
     * 验证整体效果平衡性
     */
    validateEffects(event) {
        // 计算所有选择的平均效果
        let totalPositive = 0;
        let totalNegative = 0;
        let choiceCount = 0;

        event.choices.forEach(choice => {
            if (choice.effects) {
                choiceCount++;
                Object.values(choice.effects).forEach(value => {
                    if (value > 0) totalPositive += value;
                    if (value < 0) totalNegative += Math.abs(value);
                });
            }
        });

        // 检查效果平衡性
        if (choiceCount > 0) {
            const avgPositive = totalPositive / choiceCount;
            const avgNegative = totalNegative / choiceCount;

            // 如果正面效果过高或负面效果过高，可能不平衡
            if (avgPositive > 200 || avgNegative > 200) {
                console.warn('事件效果可能不平衡');
                return false;
            }
        }

        return true;
    }

    /**
     * 验证类型和稀有度
     */
    validateTypeAndRarity(event) {
        if (event.type && !this.validTypes.includes(event.type)) {
            console.warn(`无效的事件类型: ${event.type}`);
            return false;
        }

        if (event.rarity && !this.validRarities.includes(event.rarity)) {
            console.warn(`无效的稀有度: ${event.rarity}`);
            return false;
        }

        return true;
    }

    /**
     * 检查不当内容
     */
    containsInappropriateContent(text) {
        const inappropriateWords = [
            // 暴力相关
            '杀死', '谋杀', '血腥', '残忍',
            // 成人内容
            '色情', '裸体', '性行为',
            // 政治敏感
            '政治', '革命', '推翻',
            // 其他不当内容
            '自杀', '毒品', '赌博'
        ];

        const lowerText = text.toLowerCase();
        return inappropriateWords.some(word => lowerText.includes(word));
    }

    /**
     * 验证事件唯一性
     */
    validateUniqueness(event, existingEvents) {
        // 检查标题相似度
        const similarTitles = existingEvents.filter(existing => 
            this.calculateSimilarity(event.title, existing.title) > 0.8
        );

        if (similarTitles.length > 0) {
            console.warn('事件标题过于相似');
            return false;
        }

        // 检查描述相似度
        const similarDescriptions = existingEvents.filter(existing => 
            this.calculateSimilarity(event.description, existing.description) > 0.7
        );

        if (similarDescriptions.length > 0) {
            console.warn('事件描述过于相似');
            return false;
        }

        return true;
    }

    /**
     * 计算文本相似度
     */
    calculateSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        
        return intersection.length / union.length;
    }

    /**
     * 获取验证统计信息
     */
    getValidationStats() {
        return {
            requiredFields: this.requiredFields.length,
            validTypes: this.validTypes.length,
            validRarities: this.validRarities.length,
            validRequirements: this.validRequirements.length
        };
    }

    /**
     * 修复事件（尝试自动修复一些常见问题）
     */
    fixEvent(event) {
        const fixed = { ...event };

        // 修复标题
        if (fixed.title) {
            fixed.title = fixed.title.trim();
            if (fixed.title.length > 50) {
                fixed.title = fixed.title.substring(0, 47) + '...';
            }
        }

        // 修复描述
        if (fixed.description) {
            fixed.description = fixed.description.trim();
            if (fixed.description.length > 500) {
                fixed.description = fixed.description.substring(0, 497) + '...';
            }
        }

        // 修复选择
        if (fixed.choices) {
            fixed.choices = fixed.choices.map(choice => {
                const fixedChoice = { ...choice };
                
                // 修复选择文本
                if (fixedChoice.text) {
                    fixedChoice.text = fixedChoice.text.trim();
                    if (fixedChoice.text.length > 100) {
                        fixedChoice.text = fixedChoice.text.substring(0, 97) + '...';
                    }
                }

                // 修复难度值
                if (fixedChoice.difficulty !== undefined) {
                    fixedChoice.difficulty = Math.max(10, Math.min(90, fixedChoice.difficulty));
                }

                // 修复效果值
                if (fixedChoice.effects) {
                    Object.keys(fixedChoice.effects).forEach(key => {
                        fixedChoice.effects[key] = Math.max(-1000, Math.min(1000, fixedChoice.effects[key]));
                    });
                }

                return fixedChoice;
            });
        }

        // 设置默认值
        fixed.rarity = fixed.rarity || 'common';
        fixed.tags = fixed.tags || [];

        return fixed;
    }
}

module.exports = EventValidator;
