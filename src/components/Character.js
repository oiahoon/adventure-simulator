/**
 * 角色类
 * 管理角色的属性、状态、人格和社会属性
 */
class Character {
    constructor(name, profession, attributes = {}, storyline = 'xianxia') {
        this.name = name;
        this.profession = profession;
        this.storyline = storyline; // 主线剧情类型
        this.level = 1;
        this.experience = 0;
        
        // 基础属性
        this.attributes = {
            strength: attributes.strength || 10,
            intelligence: attributes.intelligence || 10,
            dexterity: attributes.dexterity || 10,
            constitution: attributes.constitution || 10,
            charisma: attributes.charisma || 10,
            luck: attributes.luck || 10
        };
        
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
        
        // 社会属性
        this.social = {
            reputation: 0,          // 声望 (-1000 到 1000)
            influence: 0,           // 影响力 (0-1000)
            connections: [],        // 人脉关系
            enemies: [],            // 敌对关系
            organizations: [],      // 所属组织
            titles: [],            // 称号
            socialStatus: 'commoner', // 社会地位
            karma: 0               // 因果业力 (-1000 到 1000)
        };
        
        // 当前状态
        this.status = {
            hp: this.getMaxHP(),
            mp: this.getMaxMP(),
            fatigue: 0,
            wealth: this.getInitialWealth(),
            cultivation: this.getInitialCultivation(), // 修为境界
            mentalState: 'normal'   // 心理状态
        };
        
        // 装备和物品
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null,
            treasure: null  // 法宝/神器
        };
        
        this.inventory = [];
        this.skills = this.getInitialSkills();
        this.achievements = [];
        this.relationships = new Map(); // 人际关系网络
        
        // 根据职业调整人格
        this.adjustPersonalityByProfession();
        
        console.log(`👤 角色创建: ${name} (${this.getProfessionName()}) - ${this.getStorylineName()}`);
    }

    /**
     * 获取剧情类型名称
     */
    getStorylineName() {
        const names = {
            xianxia: '仙侠修真',
            xuanhuan: '玄幻奇缘',
            scifi: '科幻未来',
            wuxia: '武侠江湖',
            fantasy: '西幻冒险'
        };
        return names[this.storyline] || '未知剧情';
    }

    /**
     * 根据职业调整人格特征
     */
    adjustPersonalityByProfession() {
        const adjustments = {
            warrior: {
                courage: 20,
                pride: 15,
                loyalty: 10,
                patience: -10
            },
            mage: {
                wisdom: 20,
                curiosity: 15,
                patience: 10,
                pride: 10
            },
            rogue: {
                curiosity: 15,
                ambition: 10,
                patience: -5,
                loyalty: -10
            },
            priest: {
                compassion: 20,
                wisdom: 10,
                patience: 15,
                pride: -10
            },
            ranger: {
                patience: 15,
                wisdom: 10,
                curiosity: 5,
                ambition: -5
            },
            noble: {
                pride: 20,
                ambition: 15,
                influence: 10,
                compassion: -5
            }
        };

        const adjustment = adjustments[this.profession];
        if (adjustment) {
            Object.keys(adjustment).forEach(trait => {
                if (this.personality[trait] !== undefined) {
                    this.personality[trait] = Math.max(0, Math.min(100, 
                        this.personality[trait] + adjustment[trait]
                    ));
                }
            });
        }
    }

    /**
     * 获取初始修为境界
     */
    getInitialCultivation() {
        const cultivationLevels = {
            xianxia: ['练气期', '筑基期', '金丹期', '元婴期', '化神期'],
            xuanhuan: ['斗者', '斗师', '大斗师', '斗灵', '斗王'],
            scifi: ['普通人', '基因改造者', '超能力者', '机械改造人', '数字生命'],
            wuxia: ['不入流', '三流', '二流', '一流', '宗师'],
            fantasy: ['学徒', '见习', '正式', '专家', '大师']
        };
        
        const levels = cultivationLevels[this.storyline] || cultivationLevels.xianxia;
        return levels[0];
    }

    /**
     * 获取最大生命值
     */
    getMaxHP() {
        const base = 80;
        const constitutionBonus = this.attributes.constitution * 5;
        const levelBonus = (this.level - 1) * 10;
        return base + constitutionBonus + levelBonus;
    }

    /**
     * 获取最大魔法值
     */
    getMaxMP() {
        const base = 30;
        const intelligenceBonus = this.attributes.intelligence * 3;
        const levelBonus = (this.level - 1) * 5;
        return base + intelligenceBonus + levelBonus;
    }

    /**
     * 获取初始财富
     */
    getInitialWealth() {
        const base = 100;
        const professionBonus = {
            warrior: 50,
            mage: 30,
            rogue: 80,
            priest: 40,
            ranger: 60,
            noble: 500
        };
        return base + (professionBonus[this.profession] || 0);
    }

    /**
     * 获取初始技能
     */
    getInitialSkills() {
        const skillSets = {
            warrior: ['剑术', '盾牌防御', '战斗怒吼'],
            mage: ['火球术', '治疗术', '魔法护盾'],
            rogue: ['潜行', '开锁', '偷窃'],
            priest: ['治疗术', '祝福', '驱邪'],
            ranger: ['射击', '追踪', '野外生存'],
            noble: ['说服', '贿赂', '社交']
        };
        return skillSets[this.profession] || [];
    }

    /**
     * 获取战斗力
     */
    getCombatPower() {
        const str = this.attributes.strength;
        const dex = this.attributes.dexterity;
        const level = this.level;
        
        let base = str * 2 + dex + level * 3;
        
        // 职业加成
        const professionMultiplier = {
            warrior: 1.3,
            mage: 0.8,
            rogue: 1.1,
            priest: 0.9,
            ranger: 1.2,
            noble: 0.7
        };
        
        base *= (professionMultiplier[this.profession] || 1.0);
        
        // 装备加成
        if (this.equipment.weapon) {
            base += this.equipment.weapon.attack || 0;
        }
        
        return Math.floor(base);
    }

    /**
     * 获取魔法力
     */
    getMagicPower() {
        const int = this.attributes.intelligence;
        const level = this.level;
        
        let base = int * 2 + level * 2;
        
        // 职业加成
        const professionMultiplier = {
            warrior: 0.5,
            mage: 1.5,
            rogue: 0.7,
            priest: 1.3,
            ranger: 0.8,
            noble: 0.9
        };
        
        base *= (professionMultiplier[this.profession] || 1.0);
        
        return Math.floor(base);
    }

    /**
     * 获取社交能力
     */
    getSocialPower() {
        const cha = this.attributes.charisma;
        const rep = this.status.reputation;
        const wealth = this.status.wealth;
        
        let base = cha * 2 + rep * 0.1 + Math.log(wealth + 1) * 5;
        
        // 职业加成
        const professionMultiplier = {
            warrior: 0.8,
            mage: 0.9,
            rogue: 0.7,
            priest: 1.2,
            ranger: 0.8,
            noble: 1.5
        };
        
        base *= (professionMultiplier[this.profession] || 1.0);
        
        return Math.floor(base);
    }

    /**
     * 获取探索能力
     */
    getExplorationPower() {
        const dex = this.attributes.dexterity;
        const int = this.attributes.intelligence;
        const luck = this.attributes.luck;
        
        let base = dex + int + luck * 1.5;
        
        // 职业加成
        const professionMultiplier = {
            warrior: 0.9,
            mage: 1.1,
            rogue: 1.4,
            priest: 1.0,
            ranger: 1.3,
            noble: 0.8
        };
        
        base *= (professionMultiplier[this.profession] || 1.0);
        
        return Math.floor(base);
    }

    /**
     * 获取生存能力
     */
    getSurvivalPower() {
        const con = this.attributes.constitution;
        const luck = this.attributes.luck;
        const level = this.level;
        
        let base = con * 2 + luck + level;
        
        // 职业加成
        const professionMultiplier = {
            warrior: 1.2,
            mage: 0.8,
            rogue: 1.0,
            priest: 1.1,
            ranger: 1.4,
            noble: 0.9
        };
        
        base *= (professionMultiplier[this.profession] || 1.0);
        
        return Math.floor(base);
    }

    /**
     * 增加经验值
     */
    gainExperience(amount) {
        this.experience += amount;
        
        // 检查升级
        const requiredExp = this.getRequiredExperience();
        if (this.experience >= requiredExp) {
            this.levelUp();
        }
    }

    /**
     * 获取升级所需经验
     */
    getRequiredExperience() {
        return this.level * 100 + Math.pow(this.level, 2) * 10;
    }

    /**
     * 升级
     */
    levelUp() {
        const oldLevel = this.level;
        this.level++;
        
        // 升级时恢复HP和MP
        this.status.hp = this.getMaxHP();
        this.status.mp = this.getMaxMP();
        
        // 随机属性提升
        this.randomAttributeIncrease();
        
        console.log(`🎉 ${this.name} 升级到 ${this.level} 级！`);
        
        return {
            oldLevel,
            newLevel: this.level,
            attributeGains: this.getLastAttributeGains()
        };
    }

    /**
     * 随机属性提升
     */
    randomAttributeIncrease() {
        const attributes = Object.keys(this.attributes);
        const gains = {};
        
        // 每次升级获得2-4点属性
        const totalGains = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < totalGains; i++) {
            const attr = attributes[Math.floor(Math.random() * attributes.length)];
            gains[attr] = (gains[attr] || 0) + 1;
            this.attributes[attr]++;
        }
        
        this.lastAttributeGains = gains;
    }

    /**
     * 获取最后一次属性提升
     */
    getLastAttributeGains() {
        return this.lastAttributeGains || {};
    }

    /**
     * 受到伤害
     */
    takeDamage(amount) {
        this.status.hp = Math.max(0, this.status.hp - amount);
        return this.status.hp <= 0;
    }

    /**
     * 恢复生命值
     */
    heal(amount) {
        this.status.hp = Math.min(this.getMaxHP(), this.status.hp + amount);
    }

    /**
     * 消耗魔法值
     */
    consumeMP(amount) {
        if (this.status.mp >= amount) {
            this.status.mp -= amount;
            return true;
        }
        return false;
    }

    /**
     * 恢复魔法值
     */
    restoreMP(amount) {
        this.status.mp = Math.min(this.getMaxMP(), this.status.mp + amount);
    }

    /**
     * 增加疲劳
     */
    addFatigue(amount) {
        this.status.fatigue = Math.min(100, this.status.fatigue + amount);
    }

    /**
     * 减少疲劳
     */
    reduceFatigue(amount) {
        this.status.fatigue = Math.max(0, this.status.fatigue - amount);
    }

    /**
     * 改变财富
     */
    changeWealth(amount) {
        this.status.wealth = Math.max(0, this.status.wealth + amount);
    }

    /**
     * 改变声望
     */
    changeReputation(amount) {
        this.status.reputation += amount;
    }

    /**
     * 添加物品到背包
     */
    addItem(item) {
        this.inventory.push(item);
    }

    /**
     * 从背包移除物品
     */
    removeItem(itemName) {
        const index = this.inventory.findIndex(item => item.name === itemName);
        if (index !== -1) {
            return this.inventory.splice(index, 1)[0];
        }
        return null;
    }

    /**
     * 装备物品
     */
    equipItem(item) {
        if (item.type === 'weapon') {
            this.equipment.weapon = item;
        } else if (item.type === 'armor') {
            this.equipment.armor = item;
        } else if (item.type === 'accessory') {
            this.equipment.accessory = item;
        }
    }

    /**
     * 学习技能
     */
    learnSkill(skillName) {
        if (!this.skills.includes(skillName)) {
            this.skills.push(skillName);
            return true;
        }
        return false;
    }

    /**
     * 获得称号
     */
    gainTitle(title) {
        if (!this.titles.includes(title)) {
            this.titles.push(title);
            return true;
        }
        return false;
    }

    /**
     * 检查是否有足够的能力进行某个行动
     */
    canPerformAction(actionType, difficulty = 50) {
        let power = 0;
        
        switch (actionType) {
            case 'combat':
                power = this.getCombatPower();
                break;
            case 'magic':
                power = this.getMagicPower();
                break;
            case 'social':
                power = this.getSocialPower();
                break;
            case 'exploration':
                power = this.getExplorationPower();
                break;
            case 'survival':
                power = this.getSurvivalPower();
                break;
            default:
                power = this.level * 10;
        }
        
        // 添加随机因素
        const randomFactor = Math.random() * 20 - 10; // -10 到 +10
        const finalPower = power + randomFactor;
        
        return finalPower >= difficulty;
    }

    /**
     * 获取角色状态描述
     */
    getStatusDescription() {
        const hpPercent = (this.status.hp / this.getMaxHP()) * 100;
        const mpPercent = (this.status.mp / this.getMaxMP()) * 100;
        
        let status = '良好';
        
        if (hpPercent < 25) {
            status = '濒死';
        } else if (hpPercent < 50) {
            status = '受伤';
        } else if (this.status.fatigue > 75) {
            status = '疲惫';
        } else if (mpPercent < 25) {
            status = '魔力枯竭';
        }
        
        return status;
    }

    /**
     * 获取角色完整信息
     */
    getFullInfo() {
        return {
            name: this.name,
            profession: this.getProfessionName(),
            level: this.level,
            experience: this.experience,
            requiredExp: this.getRequiredExperience(),
            attributes: { ...this.attributes },
            status: { ...this.status },
            maxHP: this.getMaxHP(),
            maxMP: this.getMaxMP(),
            combatPower: this.getCombatPower(),
            magicPower: this.getMagicPower(),
            socialPower: this.getSocialPower(),
            explorationPower: this.getExplorationPower(),
            survivalPower: this.getSurvivalPower(),
            statusDescription: this.getStatusDescription(),
            skills: [...this.skills],
            titles: [...this.titles],
            equipment: { ...this.equipment },
            inventoryCount: this.inventory.length
        };
    }
}
