/**
 * 角色类 - 增强版，支持完整的RPG成长系统
 */
class Character {
    constructor(name, profession) {
        this.id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = name;
        this.profession = profession;
        this.level = 1;
        this.experience = 0;
        
        // 基础属性
        this.attributes = this.initializeAttributes(profession);
        
        // 人格属性 (0-100)
        this.personality = {
            courage: Math.floor(Math.random() * 30) + 40,      // 勇气 40-70
            wisdom: Math.floor(Math.random() * 30) + 40,       // 智慧 40-70
            compassion: Math.floor(Math.random() * 30) + 40,   // 慈悲 40-70
            ambition: Math.floor(Math.random() * 30) + 40,     // 野心 40-70
            curiosity: Math.floor(Math.random() * 30) + 40,    // 好奇心 40-70
            patience: Math.floor(Math.random() * 30) + 40,     // 耐心 40-70
            pride: Math.floor(Math.random() * 30) + 40,        // 骄傲 40-70
            loyalty: Math.floor(Math.random() * 30) + 40       // 忠诚 40-70
        };
        
        // 状态
        this.status = {
            hp: this.getMaxHP(),
            mp: this.getMaxMP(),
            fatigue: 0,
            hunger: 100,
            thirst: 100
        };

        // 最大状态值
        this.maxStats = {
            hp: this.getMaxHP(),
            mp: this.getMaxMP()
        };

        // 战斗属性
        this.combatStats = {
            attack: this.attributes.strength,
            defense: this.attributes.constitution,
            critical: 0,
            dodge: this.attributes.dexterity,
            speed: this.attributes.dexterity
        };

        // 成长相关
        this.availableAttributePoints = 0;
        this.availableSkillPoints = 0;
        this.skills = []; // 修复：应该是数组而不是对象
        this.skillLevels = {}; // 新增：技能等级对象
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null,
            boots: null
        };

        // 游戏进度
        this.location = '新手村';
        this.wealth = 100;
        this.inventory = [];
        
        // 社交和声望
        this.reputation = {
            righteous: 0,
            evil: 0,
            jianghu: 0,
            sect: 0,
            merchant: 0,
            scholar: 0
        };

        // 社会属性
        this.social = {
            reputation: 0,          // 总声望 (-1000 到 1000)
            influence: 0,           // 影响力 (0-1000)
            connections: [],        // 人脉关系
            enemies: [],            // 敌对关系
            organizations: [],      // 所属组织
            titles: [],            // 称号
            socialStatus: 'commoner', // 社会地位
            karma: 0               // 因果业力 (-1000 到 1000)
        };

        // 门派状态
        this.sectStatus = null;
        
        // 特殊效果
        this.specialEffects = {};
        this.equipmentEffects = {};
        
        // 成就和统计
        this.achievements = [];
        this.statistics = {
            eventsCompleted: 0,
            monstersDefeated: 0,
            questsCompleted: 0,
            itemsFound: 0,
            timePlayedMinutes: 0
        };

        // 创建时间
        this.createdAt = Date.now();
        this.lastActiveAt = Date.now();

        console.log(`👤 创建角色: ${this.name} (${this.getProfessionName()})`);
    }

    /**
     * 初始化属性
     */
    initializeAttributes(profession) {
        const baseAttributes = {
            strength: 10,
            constitution: 10,
            dexterity: 10,
            intelligence: 10,
            charisma: 10,
            luck: 10
        };

        // 职业特化加成
        const professionBonus = {
            warrior: { strength: 5, constitution: 3, dexterity: 2 },
            mage: { intelligence: 5, charisma: 3, constitution: 2 },
            rogue: { dexterity: 5, luck: 3, intelligence: 2 },
            monk: { constitution: 3, strength: 3, charisma: 3, dexterity: 1 },
            hunter: { dexterity: 3, strength: 3, constitution: 2, luck: 2 },
            scholar: { intelligence: 3, charisma: 4, luck: 2, constitution: 1 }
        };

        const bonus = professionBonus[profession] || {};
        Object.entries(bonus).forEach(([attr, value]) => {
            baseAttributes[attr] += value;
        });

        return baseAttributes;
    }

    /**
     * 获取职业中文名
     */
    getProfessionName() {
        const professionNames = {
            warrior: '武者',
            mage: '术士', 
            rogue: '游侠',
            monk: '僧侣',
            hunter: '猎户',
            scholar: '文士'
        };
        return professionNames[this.profession] || '未知';
    }

    /**
     * 获取剧情线名称
     */
    getStorylineName() {
        // 根据角色名字或职业返回剧情线
        const storylines = {
            warrior: '武侠江湖',
            mage: '仙侠修真',
            rogue: '江湖浪子',
            monk: '佛门修行',
            hunter: '山林传奇',
            scholar: '书香门第'
        };
        return storylines[this.profession] || '江湖奇缘';
    }

    /**
     * 获取升级所需经验
     */
    getRequiredExperience(level) {
        if (!level) level = this.level + 1;
        return level * 100 + (level - 1) * 50;
    }

    /**
     * 获得经验值
     */
    gainExperience(amount) {
        this.experience += amount;
        console.log('✨ ' + this.name + ' 获得了 ' + amount + ' 点经验');
        
        // 检查升级
        this.checkLevelUp();
    }

    /**
     * 检查升级
     */
    checkLevelUp() {
        var expRequired = this.getRequiredExperience();
        if (this.experience >= expRequired) {
            this.levelUp();
        }
    }

    /**
     * 升级
     */
    levelUp() {
        this.level++;
        
        // 属性成长
        var growth = this.getProfessionGrowth();
        for (var attr in growth) {
            if (this.attributes[attr] !== undefined) {
                this.attributes[attr] += growth[attr];
            }
        }

        // 恢复状态
        this.status.hp = this.getMaxHP();
        this.status.mp = this.getMaxMP();

        console.log('🎉 ' + this.name + ' 升级到 ' + this.level + ' 级！');
    }

    /**
     * 获取职业成长加成
     */
    getProfessionGrowth() {
        var growthPatterns = {
            warrior: { strength: 3, constitution: 2, dexterity: 1 },
            mage: { intelligence: 3, charisma: 2, constitution: 1 },
            rogue: { dexterity: 3, luck: 2, intelligence: 1 },
            monk: { constitution: 2, strength: 2, charisma: 2 },
            hunter: { dexterity: 2, strength: 2, luck: 2 },
            scholar: { intelligence: 2, charisma: 3, luck: 1 }
        };
        
        return growthPatterns[this.profession] || { strength: 1, constitution: 1, dexterity: 1 };
    }

    /**
     * 检查是否应该改变位置
     */
    shouldChangeLocation() {
        // 基于角色属性和随机因素决定是否改变位置
        var baseChance = 0.1; // 基础10%概率
        
        // 游侠职业更容易移动
        if (this.profession === 'rogue' || this.profession === 'hunter') {
            baseChance += 0.05;
        }
        
        // 高敏捷角色更容易移动
        if (this.attributes.dexterity > 15) {
            baseChance += 0.03;
        }
        
        return Math.random() < baseChance;
    }

    /**
     * 学习技能
     */
    learnSkill(skillName) {
        if (!this.skills.includes(skillName)) {
            this.skills.push(skillName);
            if (!this.skillLevels[skillName]) {
                this.skillLevels[skillName] = 1;
            } else {
                this.skillLevels[skillName]++;
            }
            console.log('📚 ' + this.name + ' 学会了技能: ' + skillName);
        }
    }

    /**
     * 检查是否拥有技能
     */
    hasSkill(skillName) {
        return this.skills.includes(skillName);
    }

    /**
     * 获取技能等级
     */
    getSkillLevel(skillName) {
        return this.skillLevels[skillName] || 0;
    }

    /**
     * 获取最大生命值
     */
    getMaxHP() {
        const base = 100 + (this.attributes.constitution * 10);
        const equipment = (this.equipmentEffects && this.equipmentEffects.hp) || 0;
        const skills = (this.maxStats && this.maxStats.hp) || 0;
        return Math.max(base, base + equipment + skills);
    }

    /**
     * 获取最大法力值
     */
    getMaxMP() {
        const base = 50 + (this.attributes.intelligence * 5);
        const equipment = (this.equipmentEffects && this.equipmentEffects.mp) || 0;
        const skills = (this.maxStats && this.maxStats.mp) || 0;
        return Math.max(base, base + equipment + skills);
    }

    /**
     * 获取总攻击力
     */
    getTotalAttack() {
        const base = (this.combatStats && this.combatStats.attack) || this.attributes.strength;
        const equipment = (this.equipmentEffects && this.equipmentEffects.attack) || 0;
        const weapon = (this.equipment.weapon && this.equipment.weapon.effects && this.equipment.weapon.effects.attack) || 0;
        return base + equipment + weapon;
    }

    /**
     * 获取总防御力
     */
    getTotalDefense() {
        const base = (this.combatStats && this.combatStats.defense) || this.attributes.constitution;
        const equipment = (this.equipmentEffects && this.equipmentEffects.defense) || 0;
        const armor = (this.equipment.armor && this.equipment.armor.effects && this.equipment.armor.effects.defense) || 0;
        return base + equipment + armor;
    }

    /**
     * 获取暴击率
     */
    getCriticalRate() {
        const base = (this.combatStats && this.combatStats.critical) || 0;
        const equipment = (this.equipmentEffects && this.equipmentEffects.critical) || 0;
        const weapon = (this.equipment.weapon && this.equipment.weapon.effects && this.equipment.weapon.effects.critical) || 0;
        return Math.min(50, base + equipment + weapon); // 最高50%暴击率
    }

    /**
     * 获取闪避率
     */
    getDodgeRate() {
        const base = (this.combatStats && this.combatStats.dodge) || this.attributes.dexterity;
        const equipment = (this.equipmentEffects && this.equipmentEffects.dodge) || 0;
        return Math.min(30, Math.floor((base + equipment) / 2)); // 最高30%闪避率
    }

    /**
     * 恢复生命值
     */
    heal(amount) {
        const maxHP = this.getMaxHP();
        const oldHP = this.status.hp;
        this.status.hp = Math.min(maxHP, this.status.hp + amount);
        const actualHeal = this.status.hp - oldHP;
        
        if (actualHeal > 0) {
            console.log(`💚 ${this.name} 恢复了 ${actualHeal} 点生命值`);
        }
        
        return actualHeal;
    }

    /**
     * 恢复法力值
     */
    restoreMana(amount) {
        const maxMP = this.getMaxMP();
        const oldMP = this.status.mp;
        this.status.mp = Math.min(maxMP, this.status.mp + amount);
        const actualRestore = this.status.mp - oldMP;
        
        if (actualRestore > 0) {
            console.log(`💙 ${this.name} 恢复了 ${actualRestore} 点法力值`);
        }
        
        return actualRestore;
    }

    /**
     * 受到伤害
     */
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.getTotalDefense());
        this.status.hp = Math.max(0, this.status.hp - actualDamage);
        
        console.log(`💔 ${this.name} 受到了 ${actualDamage} 点伤害`);
        
        return {
            damage: actualDamage,
            isDead: this.status.hp <= 0
        };
    }

    /**
     * 获得财富
     */
    gainWealth(amount) {
        this.wealth += amount;
        console.log(`💰 ${this.name} 获得了 ${amount} 金币`);
    }

    /**
     * 消费财富
     */
    spendWealth(amount) {
        if (this.wealth >= amount) {
            this.wealth -= amount;
            console.log(`💸 ${this.name} 花费了 ${amount} 金币`);
            return true;
        }
        return false;
    }

    /**
     * 添加物品到背包
     */
    addItem(item) {
        this.inventory.push({
            ...item,
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            obtainedAt: Date.now()
        });
        
        this.statistics.itemsFound++;
        console.log(`🎒 ${this.name} 获得了物品: ${item.name}`);
    }

    /**
     * 使用物品
     */
    useItem(itemId) {
        const itemIndex = this.inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return { success: false, message: '物品不存在' };
        }

        const item = this.inventory[itemIndex];
        let result = { success: true, message: `使用了 ${item.name}` };

        // 根据物品类型执行效果
        switch (item.type) {
            case 'healing_potion':
                const healAmount = item.effects?.heal || 50;
                this.heal(healAmount);
                result.message = `使用了 ${item.name}，恢复了 ${healAmount} 点生命值`;
                break;
                
            case 'mana_potion':
                const manaAmount = item.effects?.mana || 30;
                this.restoreMana(manaAmount);
                result.message = `使用了 ${item.name}，恢复了 ${manaAmount} 点法力值`;
                break;
                
            case 'experience_pill':
                const expAmount = item.effects?.experience || 100;
                // 这里需要调用成长系统的获得经验方法
                result.message = `使用了 ${item.name}，获得了 ${expAmount} 点经验`;
                break;
                
            default:
                result = { success: false, message: '无法使用此物品' };
                return result;
        }

        // 移除已使用的物品（如果是消耗品）
        if (item.consumable !== false) {
            this.inventory.splice(itemIndex, 1);
        }

        return result;
    }

    /**
     * 更新活跃时间
     */
    updateActivity() {
        this.lastActiveAt = Date.now();
    }

    /**
     * 获取角色详细信息
     */
    getDetailedInfo() {
        return {
            basic: {
                id: this.id,
                name: this.name,
                profession: this.profession,
                professionName: this.getProfessionName(),
                level: this.level,
                experience: this.experience
            },
            attributes: this.attributes,
            status: {
                ...this.status,
                maxHP: this.getMaxHP(),
                maxMP: this.getMaxMP()
            },
            combat: {
                attack: this.getTotalAttack(),
                defense: this.getTotalDefense(),
                critical: this.getCriticalRate(),
                dodge: this.getDodgeRate()
            },
            growth: {
                availableAttributePoints: this.availableAttributePoints,
                availableSkillPoints: this.availableSkillPoints,
                skills: this.skills
            },
            equipment: this.equipment,
            inventory: this.inventory,
            wealth: this.wealth,
            location: this.location,
            reputation: this.reputation,
            sectStatus: this.sectStatus,
            achievements: this.achievements,
            statistics: this.statistics
        };
    }

    /**
     * 保存角色数据
     */
    save() {
        const saveData = {
            ...this.getDetailedInfo(),
            savedAt: Date.now()
        };
        
        localStorage.setItem(`character_${this.id}`, JSON.stringify(saveData));
        console.log(`💾 角色 ${this.name} 数据已保存`);
        
        return saveData;
    }

    /**
     * 从保存数据加载角色
     */
    static load(characterId) {
        const saveData = localStorage.getItem(`character_${characterId}`);
        if (!saveData) {
            return null;
        }

        try {
            const data = JSON.parse(saveData);
            const character = new Character(data.basic.name, data.basic.profession);
            
            // 恢复所有数据
            Object.assign(character, data);
            character.id = data.basic.id;
            
            console.log(`📂 加载角色: ${character.name}`);
            return character;
        } catch (error) {
            console.error('加载角色数据失败:', error);
            return null;
        }
    }

    /**
     * 获取所有保存的角色
     */
    static getAllSavedCharacters() {
        const characters = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('character_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    characters.push({
                        id: data.basic.id,
                        name: data.basic.name,
                        profession: data.basic.professionName,
                        level: data.basic.level,
                        location: data.location,
                        savedAt: data.savedAt
                    });
                } catch (error) {
                    console.warn(`无法加载角色数据: ${key}`, error);
                }
            }
        }
        
        return characters.sort((a, b) => b.savedAt - a.savedAt);
    }
}

// 全局导出
window.Character = Character;
