/**
 * 角色类
 * 管理角色的属性、状态、人格和社会属性
 */
class Character {
    constructor(name, profession, attributes = {}, storyline = null) {
        this.name = name;
        this.profession = profession;
        
        // 如果没有指定剧情，则根据角色名字自动分配
        this.storyline = storyline || this.autoAssignStoryline(name);
        
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
     * 根据角色名字自动分配剧情类型
     */
    autoAssignStoryline(name) {
        // 中文名字特征检测
        const chinesePattern = /[\u4e00-\u9fa5]/;
        const isChineseName = chinesePattern.test(name);
        
        // 特定字符检测
        const nameFeatures = {
            // 仙侠修真关键字
            xianxia: ['仙', '道', '玄', '真', '灵', '天', '云', '剑', '风', '月', '星', '雪', '冰', '火', '雷', '龙', '凤'],
            // 玄幻关键字
            xuanhuan: ['魔', '神', '圣', '帝', '王', '皇', '尊', '主', '君', '霸', '战', '斗', '血', '影', '暗', '光'],
            // 武侠关键字
            wuxia: ['侠', '武', '刀', '枪', '棍', '拳', '掌', '腿', '功', '法', '招', '式', '江', '湖', '门', '派'],
            // 西幻关键字
            fantasy: ['艾', '莉', '安', '娜', '亚', '瑟', '拉', '尔', '丝', '特', '克', '斯', '德', '伦', '卡', '罗']
        };
        
        // 计算每种剧情的匹配分数
        const scores = {};
        for (const [storyline, keywords] of Object.entries(nameFeatures)) {
            scores[storyline] = 0;
            keywords.forEach(keyword => {
                if (name.includes(keyword)) {
                    scores[storyline] += 1;
                }
            });
        }
        
        // 找出最高分的剧情类型
        let maxScore = 0;
        let selectedStoryline = 'xianxia'; // 默认仙侠
        
        for (const [storyline, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                selectedStoryline = storyline;
            }
        }
        
        // 如果没有明显特征，根据名字长度和是否中文进行分配
        if (maxScore === 0) {
            if (isChineseName) {
                // 中文名字随机分配中式剧情
                const chineseStorylines = ['xianxia', 'xuanhuan', 'wuxia'];
                selectedStoryline = chineseStorylines[Math.floor(Math.random() * chineseStorylines.length)];
            } else {
                // 英文名字倾向于西幻或科幻
                const westernStorylines = ['fantasy', 'scifi'];
                selectedStoryline = westernStorylines[Math.floor(Math.random() * westernStorylines.length)];
            }
        }
        
        console.log(`🎭 根据角色名字"${name}"自动分配剧情: ${this.getStorylineName()} (匹配分数: ${maxScore})`);
        return selectedStoryline;
    }
    getProfessionName() {
        const names = {
            warrior: '战士',
            mage: '法师',
            rogue: '盗贼',
            priest: '牧师',
            ranger: '游侠',
            noble: '贵族'
        };
        return names[this.profession] || this.profession;
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
        if (!this.inventory) {
            this.inventory = [];
        }
        
        // 如果是字符串，转换为物品对象
        if (typeof item === 'string') {
            item = {
                name: item,
                type: 'misc',
                description: '获得的物品',
                quantity: 1,
                obtainedAt: Date.now()
            };
        }
        
        // 检查是否已有相同物品
        const existingItem = this.inventory.find(inv => inv.name === item.name);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
        } else {
            this.inventory.push(item);
        }
        
        console.log(`🎒 ${this.name}获得物品: ${item.name}`);
        
        // 如果物品有即时效果，立即应用
        if (item.effect) {
            this.applyItemEffect(item.effect);
        }
    }

    /**
     * 应用物品效果
     */
    applyItemEffect(effect) {
        if (effect.hp) {
            this.status.hp = Math.min(this.getMaxHP(), this.status.hp + effect.hp);
            console.log(`💚 生命值恢复: +${effect.hp}`);
        }
        if (effect.mp) {
            this.status.mp = Math.min(this.getMaxMP(), this.status.mp + effect.mp);
            console.log(`💙 魔法值恢复: +${effect.mp}`);
        }
        if (effect.strength) {
            this.attributes.strength += effect.strength;
            console.log(`💪 力量提升: +${effect.strength}`);
        }
        if (effect.intelligence) {
            this.attributes.intelligence += effect.intelligence;
            console.log(`🧠 智力提升: +${effect.intelligence}`);
        }
        if (effect.dexterity) {
            this.attributes.dexterity += effect.dexterity;
            console.log(`🏃 敏捷提升: +${effect.dexterity}`);
        }
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

    /**
     * 根据属性和等级获取可访问的地点
     */
    getAvailableLocations() {
        const locations = [
            { name: '新手村', minLevel: 1, description: '安全的起始地点' },
            { name: '森林边缘', minLevel: 2, description: '充满机遇的森林' },
            { name: '古老废墟', minLevel: 5, description: '神秘的古代遗迹' },
            { name: '山脉小径', minLevel: 8, description: '险峻的山路' },
            { name: '魔法学院', minLevel: 10, description: '知识的殿堂', requireIntelligence: 15 },
            { name: '竞技场', minLevel: 12, description: '战士的试炼场', requireStrength: 15 },
            { name: '盗贼公会', minLevel: 15, description: '阴影中的组织', requireDexterity: 18 },
            { name: '神殿', minLevel: 18, description: '神圣的祈祷之地', requireCharisma: 16 },
            { name: '龙穴', minLevel: 25, description: '传说中的龙族栖息地' },
            { name: '异次元裂缝', minLevel: 30, description: '通往未知世界的门户' }
        ];
        
        return locations.filter(location => {
            if (this.level < location.minLevel) return false;
            if (location.requireStrength && this.attributes.strength < location.requireStrength) return false;
            if (location.requireIntelligence && this.attributes.intelligence < location.requireIntelligence) return false;
            if (location.requireDexterity && this.attributes.dexterity < location.requireDexterity) return false;
            if (location.requireCharisma && this.attributes.charisma < location.requireCharisma) return false;
            return true;
        });
    }

    /**
     * 根据属性影响事件结果
     */
    getAttributeInfluence(eventType) {
        const influences = {};
        
        // 根据不同事件类型，不同属性有不同影响
        switch (eventType) {
            case 'combat':
                influences.strength = this.attributes.strength / 20;
                influences.dexterity = this.attributes.dexterity / 25;
                influences.constitution = this.attributes.constitution / 30;
                break;
            case 'social':
                influences.charisma = this.attributes.charisma / 20;
                influences.intelligence = this.attributes.intelligence / 25;
                break;
            case 'exploration':
                influences.dexterity = this.attributes.dexterity / 20;
                influences.luck = this.attributes.luck / 15;
                influences.intelligence = this.attributes.intelligence / 30;
                break;
            case 'magic':
                influences.intelligence = this.attributes.intelligence / 15;
                influences.charisma = this.attributes.charisma / 25;
                break;
            case 'survival':
                influences.constitution = this.attributes.constitution / 20;
                influences.strength = this.attributes.strength / 25;
                influences.intelligence = this.attributes.intelligence / 30;
                break;
            default:
                Object.keys(this.attributes).forEach(attr => {
                    influences[attr] = this.attributes[attr] / 30;
                });
        }
        
        return influences;
    }

    /**
     * 检查是否应该改变地点
     */
    shouldChangeLocation(currentLocation, gameTime) {
        const levelFactor = this.level / 5;  // 增加等级影响
        const timeFactor = gameTime / 50;     // 增加时间影响
        const randomFactor = Math.random() * 0.3; // 增加随机因素
        
        const changeChance = Math.min(0.6, levelFactor * 0.2 + timeFactor * 0.1 + randomFactor);
        
        console.log(`🗺️ 地点变化检查: 等级${this.level}, 时间${gameTime}, 概率${(changeChance * 100).toFixed(1)}%`);
        
        const shouldChange = Math.random() < changeChance;
        if (shouldChange) {
            console.log(`✅ 决定改变地点！当前: ${currentLocation}`);
        }
        
        return shouldChange;
    }

    /**
     * 获取下一个推荐地点
     */
    getNextRecommendedLocation(currentLocation) {
        const available = this.getAvailableLocations();
        const current = available.find(loc => loc.name === currentLocation);
        
        if (!current) return available[0]?.name || '新手村';
        
        const currentIndex = available.indexOf(current);
        
        if (Math.random() < 0.7 && currentIndex < available.length - 1) {
            return available[currentIndex + 1].name;
        } else {
            const otherLocations = available.filter(loc => loc.name !== currentLocation);
            return otherLocations[Math.floor(Math.random() * otherLocations.length)]?.name || currentLocation;
        }
    }
}
