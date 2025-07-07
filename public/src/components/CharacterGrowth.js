/**
 * 角色成长系统 - 完整的RPG成长机制
 */
class CharacterGrowth {
    constructor() {
        this.growthConfig = this.initializeGrowthConfig();
        this.skillTrees = this.initializeSkillTrees();
        this.equipmentSystem = this.initializeEquipmentSystem();
        
        console.log('🌱 角色成长系统初始化完成');
    }

    /**
     * 初始化成长配置
     */
    initializeGrowthConfig() {
        return {
            // 等级经验需求
            levelExperience: {
                1: 0, 2: 100, 3: 250, 4: 450, 5: 700,
                6: 1000, 7: 1350, 8: 1750, 9: 2200, 10: 2700,
                11: 3250, 12: 3850, 13: 4500, 14: 5200, 15: 5950,
                16: 6750, 17: 7600, 18: 8500, 19: 9450, 20: 10450,
                21: 11500, 22: 12600, 23: 13750, 24: 14950, 25: 16200,
                26: 17500, 27: 18850, 28: 20250, 29: 21700, 30: 23200
            },
            
            // 属性成长系数
            attributeGrowth: {
                warrior: { strength: 3, constitution: 2, dexterity: 1, intelligence: 1, charisma: 1, luck: 1 },
                mage: { strength: 1, constitution: 1, dexterity: 1, intelligence: 3, charisma: 2, luck: 1 },
                rogue: { strength: 1, constitution: 1, dexterity: 3, intelligence: 2, charisma: 1, luck: 2 },
                monk: { strength: 2, constitution: 2, dexterity: 2, intelligence: 1, charisma: 2, luck: 1 },
                hunter: { strength: 2, constitution: 2, dexterity: 2, intelligence: 1, charisma: 1, luck: 2 },
                scholar: { strength: 1, constitution: 1, dexterity: 1, intelligence: 2, charisma: 3, luck: 2 }
            },

            // 技能点获得
            skillPointsPerLevel: 2,
            
            // 属性点获得
            attributePointsPerLevel: 1
        };
    }

    /**
     * 初始化技能树
     */
    initializeSkillTrees() {
        return {
            // 武功技能树
            martial: {
                name: '武功修炼',
                skills: {
                    basic_combat: {
                        name: '基础武功',
                        description: '提升基础战斗能力',
                        maxLevel: 10,
                        effects: { attack: 2, defense: 1 },
                        requirements: {}
                    },
                    advanced_combat: {
                        name: '高级武功',
                        description: '掌握高深武学',
                        maxLevel: 10,
                        effects: { attack: 4, defense: 2, critical: 1 },
                        requirements: { basic_combat: 5 }
                    },
                    master_combat: {
                        name: '绝世武功',
                        description: '武学宗师境界',
                        maxLevel: 5,
                        effects: { attack: 8, defense: 4, critical: 3 },
                        requirements: { advanced_combat: 8, level: 20 }
                    }
                }
            },

            // 内功技能树
            internal: {
                name: '内功修炼',
                skills: {
                    basic_qi: {
                        name: '基础内功',
                        description: '修炼内力，增强体质',
                        maxLevel: 10,
                        effects: { hp: 20, mp: 10, constitution: 1 },
                        requirements: {}
                    },
                    advanced_qi: {
                        name: '高深内功',
                        description: '内力深厚，气息悠长',
                        maxLevel: 10,
                        effects: { hp: 40, mp: 20, constitution: 2, strength: 1 },
                        requirements: { basic_qi: 5 }
                    },
                    master_qi: {
                        name: '绝世内功',
                        description: '内功大成，返璞归真',
                        maxLevel: 5,
                        effects: { hp: 80, mp: 40, constitution: 4, strength: 2, regeneration: 2 },
                        requirements: { advanced_qi: 8, level: 25 }
                    }
                }
            },

            // 轻功技能树
            agility: {
                name: '轻功身法',
                skills: {
                    basic_movement: {
                        name: '基础轻功',
                        description: '提升移动和闪避能力',
                        maxLevel: 10,
                        effects: { dodge: 2, speed: 1 },
                        requirements: {}
                    },
                    advanced_movement: {
                        name: '高级身法',
                        description: '身轻如燕，来去如风',
                        maxLevel: 10,
                        effects: { dodge: 4, speed: 2, dexterity: 1 },
                        requirements: { basic_movement: 5 }
                    },
                    master_movement: {
                        name: '绝世轻功',
                        description: '踏雪无痕，凌波微步',
                        maxLevel: 5,
                        effects: { dodge: 8, speed: 4, dexterity: 2, luck: 1 },
                        requirements: { advanced_movement: 8, level: 20 }
                    }
                }
            },

            // 江湖技能树
            social: {
                name: '江湖阅历',
                skills: {
                    reputation: {
                        name: '江湖声望',
                        description: '提升在江湖中的名声',
                        maxLevel: 10,
                        effects: { charisma: 1, reputation_gain: 0.1 },
                        requirements: {}
                    },
                    negotiation: {
                        name: '谈判技巧',
                        description: '善于与人交涉',
                        maxLevel: 10,
                        effects: { charisma: 2, wealth_gain: 0.1 },
                        requirements: { reputation: 3 }
                    },
                    leadership: {
                        name: '领导才能',
                        description: '天生的领袖气质',
                        maxLevel: 5,
                        effects: { charisma: 4, influence: 2 },
                        requirements: { negotiation: 5, level: 15 }
                    }
                }
            }
        };
    }

    /**
     * 初始化装备系统
     */
    initializeEquipmentSystem() {
        return {
            slots: {
                weapon: { name: '武器', equipped: null },
                armor: { name: '护甲', equipped: null },
                accessory: { name: '饰品', equipped: null },
                boots: { name: '靴子', equipped: null }
            },
            
            equipmentTypes: {
                weapons: {
                    wooden_sword: {
                        name: '木剑',
                        type: 'weapon',
                        rarity: 'common',
                        effects: { attack: 5 },
                        requirements: { level: 1 },
                        description: '初学者使用的木制练习剑'
                    },
                    iron_sword: {
                        name: '铁剑',
                        type: 'weapon',
                        rarity: 'common',
                        effects: { attack: 12 },
                        requirements: { level: 5 },
                        description: '普通的铁制长剑'
                    },
                    steel_sword: {
                        name: '精钢剑',
                        type: 'weapon',
                        rarity: 'uncommon',
                        effects: { attack: 25, critical: 2 },
                        requirements: { level: 10 },
                        description: '精钢打造的利剑，锋利无比'
                    },
                    legendary_sword: {
                        name: '倚天剑',
                        type: 'weapon',
                        rarity: 'legendary',
                        effects: { attack: 50, critical: 8, strength: 3 },
                        requirements: { level: 20, advanced_combat: 5 },
                        description: '传说中的神兵利器，削铁如泥'
                    }
                },
                
                armors: {
                    cloth_robe: {
                        name: '布袍',
                        type: 'armor',
                        rarity: 'common',
                        effects: { defense: 3 },
                        requirements: { level: 1 },
                        description: '普通的布制长袍'
                    },
                    leather_armor: {
                        name: '皮甲',
                        type: 'armor',
                        rarity: 'common',
                        effects: { defense: 8, hp: 20 },
                        requirements: { level: 5 },
                        description: '兽皮制作的轻甲'
                    },
                    chain_mail: {
                        name: '锁子甲',
                        type: 'armor',
                        rarity: 'uncommon',
                        effects: { defense: 18, hp: 50, constitution: 1 },
                        requirements: { level: 10 },
                        description: '精工制作的锁子甲，防护力强'
                    },
                    dragon_scale: {
                        name: '龙鳞甲',
                        type: 'armor',
                        rarity: 'legendary',
                        effects: { defense: 40, hp: 120, constitution: 3, fire_resist: 50 },
                        requirements: { level: 25, master_qi: 3 },
                        description: '传说中的龙鳞制成的神甲'
                    }
                }
            }
        };
    }

    /**
     * 角色升级
     */
    levelUp(character) {
        const currentLevel = character.level;
        const currentExp = character.experience;
        const requiredExp = this.growthConfig.levelExperience[currentLevel + 1];

        if (!requiredExp || currentExp < requiredExp) {
            return { success: false, message: '经验不足，无法升级' };
        }

        // 升级
        character.level += 1;
        character.experience -= requiredExp;

        // 获得属性点和技能点
        character.availableAttributePoints += this.growthConfig.attributePointsPerLevel;
        character.availableSkillPoints += this.growthConfig.skillPointsPerLevel;

        // 职业成长加成
        const growth = this.growthConfig.attributeGrowth[character.profession];
        Object.entries(growth).forEach(([attr, bonus]) => {
            character.attributes[attr] += bonus;
        });

        // 更新生命值和法力值上限
        this.updateCharacterStats(character);

        console.log(`🎉 ${character.name} 升级到 ${character.level} 级！`);

        return {
            success: true,
            message: `恭喜！${character.name} 升级到 ${character.level} 级！`,
            newLevel: character.level,
            attributePoints: this.growthConfig.attributePointsPerLevel,
            skillPoints: this.growthConfig.skillPointsPerLevel
        };
    }

    /**
     * 学习技能
     */
    learnSkill(character, skillTreeName, skillName) {
        const skillTree = this.skillTrees[skillTreeName];
        if (!skillTree) {
            return { success: false, message: '未知的技能树' };
        }

        const skill = skillTree.skills[skillName];
        if (!skill) {
            return { success: false, message: '未知的技能' };
        }

        // 检查技能点
        if (character.availableSkillPoints < 1) {
            return { success: false, message: '技能点不足' };
        }

        // 检查前置条件
        const meetsRequirements = this.checkSkillRequirements(character, skill.requirements);
        if (!meetsRequirements.success) {
            return meetsRequirements;
        }

        // 初始化技能等级
        if (!character.skills[skillName]) {
            character.skills[skillName] = 0;
        }

        // 检查技能等级上限
        if (character.skills[skillName] >= skill.maxLevel) {
            return { success: false, message: '技能已达到最高等级' };
        }

        // 学习技能
        character.skills[skillName] += 1;
        character.availableSkillPoints -= 1;

        // 应用技能效果
        this.applySkillEffects(character, skill.effects);
        this.updateCharacterStats(character);

        console.log(`📚 ${character.name} 学习了 ${skill.name} (等级 ${character.skills[skillName]})`);

        return {
            success: true,
            message: `学会了 ${skill.name} (等级 ${character.skills[skillName]})！`,
            skillName: skill.name,
            skillLevel: character.skills[skillName]
        };
    }

    /**
     * 检查技能学习条件
     */
    checkSkillRequirements(character, requirements) {
        // 检查等级要求
        if (requirements.level && character.level < requirements.level) {
            return { success: false, message: `需要达到 ${requirements.level} 级` };
        }

        // 检查前置技能
        for (const [reqSkill, reqLevel] of Object.entries(requirements)) {
            if (reqSkill === 'level') continue;
            
            const currentLevel = character.skills[reqSkill] || 0;
            if (currentLevel < reqLevel) {
                return { success: false, message: `需要 ${reqSkill} 达到 ${reqLevel} 级` };
            }
        }

        return { success: true };
    }

    /**
     * 应用技能效果
     */
    applySkillEffects(character, effects) {
        Object.entries(effects).forEach(([effect, value]) => {
            switch (effect) {
                case 'attack':
                case 'defense':
                case 'critical':
                case 'dodge':
                case 'speed':
                    if (!character.combatStats) character.combatStats = {};
                    character.combatStats[effect] = (character.combatStats[effect] || 0) + value;
                    break;
                    
                case 'hp':
                case 'mp':
                    character.maxStats[effect] = (character.maxStats[effect] || 0) + value;
                    break;
                    
                case 'strength':
                case 'constitution':
                case 'dexterity':
                case 'intelligence':
                case 'charisma':
                case 'luck':
                    character.attributes[effect] += value;
                    break;
                    
                default:
                    if (!character.specialEffects) character.specialEffects = {};
                    character.specialEffects[effect] = (character.specialEffects[effect] || 0) + value;
            }
        });
    }

    /**
     * 更新角色数据
     */
    updateCharacterStats(character) {
        // 确保必要的属性存在
        if (!character.maxStats) character.maxStats = {};
        if (!character.combatStats) character.combatStats = {};
        if (!character.status) character.status = { hp: 100, mp: 50 };

        // 更新最大生命值和法力值
        const baseHP = 100 + (character.attributes.constitution * 10);
        const baseMP = 50 + (character.attributes.intelligence * 5);
        
        character.maxStats.hp = baseHP + (character.maxStats.hp || 0);
        character.maxStats.mp = baseMP + (character.maxStats.mp || 0);

        // 确保当前值不超过最大值
        character.status.hp = Math.min(character.status.hp, character.maxStats.hp);
        character.status.mp = Math.min(character.status.mp, character.maxStats.mp);

        // 更新战斗数据
        character.combatStats.attack = (character.combatStats.attack || 0) + character.attributes.strength;
        character.combatStats.defense = (character.combatStats.defense || 0) + character.attributes.constitution;
    }

    /**
     * 装备物品
     */
    equipItem(character, itemId) {
        const item = this.findEquipmentById(itemId);
        if (!item) {
            return { success: false, message: '物品不存在' };
        }

        // 检查装备条件
        const canEquip = this.checkEquipRequirements(character, item.requirements);
        if (!canEquip.success) {
            return canEquip;
        }

        // 卸下当前装备
        const slot = item.type;
        const currentEquip = character.equipment[slot];
        if (currentEquip) {
            this.unequipItem(character, currentEquip);
        }

        // 装备新物品
        character.equipment[slot] = item;
        this.applyEquipmentEffects(character, item.effects, true);
        this.updateCharacterStats(character);

        console.log(`⚔️ ${character.name} 装备了 ${item.name}`);

        return {
            success: true,
            message: `装备了 ${item.name}！`,
            item: item
        };
    }

    /**
     * 获得经验值
     */
    gainExperience(character, amount, source = '未知') {
        character.experience += amount;
        
        console.log(`✨ ${character.name} 获得了 ${amount} 点经验 (来源: ${source})`);

        // 检查是否可以升级
        const levelUpResult = this.levelUp(character);
        
        return {
            experienceGained: amount,
            totalExperience: character.experience,
            levelUp: levelUpResult.success ? levelUpResult : null
        };
    }

    /**
     * 获取角色成长信息
     */
    getCharacterGrowthInfo(character) {
        const currentLevel = character.level;
        const nextLevel = currentLevel + 1;
        const currentExp = character.experience;
        const requiredExp = this.growthConfig.levelExperience[nextLevel];
        
        return {
            level: currentLevel,
            experience: {
                current: currentExp,
                required: requiredExp,
                progress: requiredExp ? (currentExp / requiredExp) : 1
            },
            availablePoints: {
                attribute: character.availableAttributePoints || 0,
                skill: character.availableSkillPoints || 0
            },
            skills: character.skills || {},
            equipment: character.equipment || {},
            combatStats: character.combatStats || {},
            maxStats: character.maxStats || {}
        };
    }

    /**
     * 查找装备
     */
    findEquipmentById(itemId) {
        for (const category of Object.values(this.equipmentSystem.equipmentTypes)) {
            if (category[itemId]) {
                return { id: itemId, ...category[itemId] };
            }
        }
        return null;
    }

    /**
     * 检查装备条件
     */
    checkEquipRequirements(character, requirements) {
        if (!requirements) return { success: true };

        for (const [req, value] of Object.entries(requirements)) {
            if (req === 'level' && character.level < value) {
                return { success: false, message: `需要达到 ${value} 级` };
            }
            if (req !== 'level' && (character.skills[req] || 0) < value) {
                return { success: false, message: `需要 ${req} 技能达到 ${value} 级` };
            }
        }

        return { success: true };
    }

    /**
     * 应用装备效果
     */
    applyEquipmentEffects(character, effects, isEquip = true) {
        const multiplier = isEquip ? 1 : -1;
        
        Object.entries(effects).forEach(([effect, value]) => {
            const actualValue = value * multiplier;
            
            if (character.attributes[effect] !== undefined) {
                character.attributes[effect] += actualValue;
            } else if (character.combatStats && character.combatStats[effect] !== undefined) {
                character.combatStats[effect] += actualValue;
            } else {
                if (!character.equipmentEffects) character.equipmentEffects = {};
                character.equipmentEffects[effect] = (character.equipmentEffects[effect] || 0) + actualValue;
            }
        });
    }
}

// 全局实例
window.CharacterGrowth = CharacterGrowth;
