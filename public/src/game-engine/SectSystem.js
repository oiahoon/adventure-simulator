/**
 * 门派系统 - 参考北大侠客行的门派设计
 * 结合LLM生成动态门派事件和关系
 */
class SectSystem {
    constructor() {
        this.sects = this.initializeSects();
        this.sectRelations = this.initializeSectRelations();
        this.playerSectStatus = null; // 玩家的门派状态
        this.sectEvents = []; // 门派事件历史
        
        console.log('🏛️ 门派系统初始化完成');
    }

    /**
     * 初始化门派（参考经典武侠门派）
     */
    initializeSects() {
        return {
            // 正派门派
            shaolin: {
                name: '少林寺',
                type: 'righteous',
                description: '天下武功出少林，以慈悲为怀，武功深厚著称',
                location: '嵩山少林寺',
                specialty: ['佛门武学', '内功心法', '棍法'],
                requirements: {
                    minLevel: 5,
                    attributes: { constitution: 12, charisma: 10 },
                    alignment: 'good'
                },
                benefits: {
                    skills: ['易筋经', '罗汉拳', '达摩剑法'],
                    attributes: { constitution: 5, strength: 3 },
                    special: ['内功加成', '抗毒能力', '治疗术']
                },
                ranks: [
                    '俗家弟子', '外门弟子', '内门弟子', 
                    '执事僧', '首座', '方丈'
                ],
                currentLeader: '玄慈方丈',
                reputation: 95,
                power: 90
            },

            wudang: {
                name: '武当派',
                type: 'righteous',
                description: '以太极著称，道法自然，内外兼修',
                location: '武当山',
                specialty: ['太极拳法', '道家内功', '剑法'],
                requirements: {
                    minLevel: 8,
                    attributes: { intelligence: 12, dexterity: 10 },
                    alignment: 'good'
                },
                benefits: {
                    skills: ['太极拳', '太极剑法', '纯阳无极功'],
                    attributes: { intelligence: 4, dexterity: 4 },
                    special: ['内力深厚', '剑法精妙', '道法加成']
                },
                ranks: [
                    '记名弟子', '入门弟子', '真传弟子',
                    '执事', '长老', '掌门'
                ],
                currentLeader: '张三丰真人',
                reputation: 92,
                power: 88
            },

            // 邪派门派
            mingjiao: {
                name: '明教',
                type: 'neutral',
                description: '光明圣火，驱除黑暗，行侠仗义却被正派误解',
                location: '光明顶',
                specialty: ['圣火令武功', '乾坤大挪移', '明教心法'],
                requirements: {
                    minLevel: 10,
                    attributes: { charisma: 15, strength: 12 },
                    alignment: 'neutral'
                },
                benefits: {
                    skills: ['乾坤大挪移', '圣火令神功', '明教心法'],
                    attributes: { charisma: 5, strength: 4 },
                    special: ['领导力加成', '火系抗性', '群体技能']
                },
                ranks: [
                    '教众', '香主', '舵主', '护法', '长老', '教主'
                ],
                currentLeader: '阳顶天',
                reputation: 60,
                power: 85
            },

            // 中性门派
            beggar: {
                name: '丐帮',
                type: 'neutral',
                description: '天下第一大帮，行走江湖，消息灵通',
                location: '四海为家',
                specialty: ['打狗棒法', '降龙十八掌', '情报网络'],
                requirements: {
                    minLevel: 3,
                    attributes: { dexterity: 10, charisma: 8 },
                    alignment: 'any'
                },
                benefits: {
                    skills: ['打狗棒法', '降龙十八掌', '叫花鸡神功'],
                    attributes: { dexterity: 3, luck: 5 },
                    special: ['情报加成', '生存能力', '江湖人脉']
                },
                ranks: [
                    '一袋弟子', '二袋弟子', '三袋弟子',
                    '四袋弟子', '长老', '帮主'
                ],
                currentLeader: '洪七公',
                reputation: 75,
                power: 70
            }
        };
    }

    /**
     * 初始化门派关系
     */
    initializeSectRelations() {
        return {
            // 正派联盟
            'shaolin_wudang': { type: 'ally', strength: 80, history: '正派盟友，共抗邪魔' },
            'shaolin_beggar': { type: 'friendly', strength: 60, history: '互相尊重，偶有合作' },
            'wudang_beggar': { type: 'friendly', strength: 65, history: '道义相投，关系良好' },
            
            // 正邪对立
            'shaolin_mingjiao': { type: 'enemy', strength: -70, history: '正邪不两立，多有冲突' },
            'wudang_mingjiao': { type: 'enemy', strength: -60, history: '理念不合，时有争斗' },
            
            // 复杂关系
            'beggar_mingjiao': { type: 'neutral', strength: 10, history: '关系复杂，时敌时友' }
        };
    }

    /**
     * 玩家申请加入门派
     */
    async applyToJoinSect(sectId, playerState) {
        const sect = this.sects[sectId];
        if (!sect) {
            return { success: false, message: '门派不存在' };
        }

        // 检查加入条件
        const canJoin = this.checkJoinRequirements(sect, playerState);
        if (!canJoin.success) {
            return canJoin;
        }

        // 基于LLM生成入门试炼
        const trial = await this.generateJoinTrial(sect, playerState);
        
        return {
            success: true,
            message: `${sect.name}愿意考虑你的申请`,
            trial: trial
        };
    }

    /**
     * 检查加入门派的条件
     */
    checkJoinRequirements(sect, playerState) {
        const character = playerState.character;
        const req = sect.requirements;

        // 等级要求
        if (character.level < req.minLevel) {
            return {
                success: false,
                message: `需要达到${req.minLevel}级才能申请加入${sect.name}`
            };
        }

        // 属性要求
        for (const [attr, minValue] of Object.entries(req.attributes)) {
            if (character.attributes[attr] < minValue) {
                return {
                    success: false,
                    message: `${attr}属性不足，需要至少${minValue}点`
                };
            }
        }

        // 阵营要求
        if (req.alignment !== 'any' && character.alignment !== req.alignment) {
            return {
                success: false,
                message: `阵营不符合${sect.name}的要求`
            };
        }

        // 已有门派检查
        if (this.playerSectStatus && this.playerSectStatus.sectId !== sectId) {
            return {
                success: false,
                message: `你已经是${this.sects[this.playerSectStatus.sectId].name}的弟子`
            };
        }

        return { success: true };
    }

    /**
     * 基于LLM生成入门试炼
     */
    async generateJoinTrial(sect, playerState) {
        const prompt = `为武侠MUD游戏生成一个门派入门试炼。

【门派信息】
- 门派：${sect.name}
- 类型：${sect.type}
- 特色：${sect.specialty.join('、')}
- 描述：${sect.description}

【申请者信息】
- 姓名：${playerState.character.name}
- 等级：${playerState.character.level}
- 职业：${playerState.character.getProfessionName()}
- 主要属性：力量${playerState.character.attributes.strength}，智力${playerState.character.attributes.intelligence}

【试炼要求】
1. 符合门派的理念和传统
2. 考验申请者的品格和能力
3. 有一定挑战性但不会太难
4. 体现门派的特色和文化

请生成JSON格式的试炼：
{
  "title": "试炼名称",
  "description": "试炼详细描述（200-300字）",
  "objectives": [
    {
      "type": "combat",
      "description": "战斗目标描述",
      "requirements": "具体要求"
    },
    {
      "type": "moral",
      "description": "品德考验描述", 
      "requirements": "具体要求"
    }
  ],
  "rewards": {
    "sect_rank": "入门弟子",
    "skills": ["获得的门派技能"],
    "items": ["获得的物品"],
    "attributes": {"strength": 1}
  },
  "time_limit": "完成时限",
  "examiner": "考官信息"
}`;

        try {
            // 这里应该调用LLM API
            // 暂时返回模板试炼
            return this.generateTemplateTrial(sect);
        } catch (error) {
            console.warn('试炼生成失败，使用模板:', error);
            return this.generateTemplateTrial(sect);
        }
    }

    /**
     * 生成模板试炼
     */
    generateTemplateTrial(sect) {
        const trials = {
            shaolin: {
                title: "少林入门试炼",
                description: "少林寺向来以慈悲为怀，武功为辅。你需要在寺中修行七日，每日诵经打坐，同时学习基础拳法。期间会有师父考验你的佛性和武学天赋。",
                objectives: [
                    {
                        type: "meditation",
                        description: "每日打坐修行，领悟佛法真谛",
                        requirements: "连续7天完成打坐任务"
                    },
                    {
                        type: "combat",
                        description: "学习罗汉拳基础招式",
                        requirements: "掌握3个基础拳法招式"
                    }
                ],
                rewards: {
                    sect_rank: "俗家弟子",
                    skills: ["罗汉拳入门", "基础内功"],
                    items: ["僧袍", "木鱼"],
                    attributes: { constitution: 2, charisma: 1 }
                },
                time_limit: "7天",
                examiner: "玄苦大师"
            },
            
            wudang: {
                title: "武当入门试炼",
                description: "武当派讲究道法自然，内外兼修。你需要在山中静修，学习太极基础，同时要通过品德考验，证明你有道者风范。",
                objectives: [
                    {
                        type: "study",
                        description: "学习道德经和太极理论",
                        requirements: "理解太极阴阳之道"
                    },
                    {
                        type: "skill",
                        description: "练习太极拳基础套路",
                        requirements: "掌握太极拳基础24式"
                    }
                ],
                rewards: {
                    sect_rank: "记名弟子",
                    skills: ["太极拳入门", "道家内功"],
                    items: ["道袍", "太极图"],
                    attributes: { intelligence: 2, dexterity: 1 }
                },
                time_limit: "10天",
                examiner: "宋远桥"
            }
        };

        return trials[sect.name.toLowerCase()] || trials.shaolin;
    }

    /**
     * 完成门派试炼
     */
    completeSectTrial(sectId, playerState) {
        const sect = this.sects[sectId];
        
        // 设置玩家门派状态
        this.playerSectStatus = {
            sectId: sectId,
            rank: 0, // 最低等级
            contribution: 0,
            joinDate: Date.now(),
            reputation: 10 // 初始声望
        };

        // 应用门派福利
        this.applySectBenefits(sect, playerState);

        // 记录门派事件
        this.sectEvents.push({
            type: 'join',
            sectId: sectId,
            playerId: playerState.character.id,
            timestamp: Date.now(),
            description: `${playerState.character.name}加入了${sect.name}`
        });

        return {
            success: true,
            message: `恭喜！你已成为${sect.name}的${sect.ranks[0]}`,
            benefits: sect.benefits
        };
    }

    /**
     * 应用门派福利
     */
    applySectBenefits(sect, playerState) {
        const character = playerState.character;
        
        // 添加技能
        if (sect.benefits.skills) {
            sect.benefits.skills.forEach(skill => {
                if (!character.skills.includes(skill)) {
                    character.skills.push(skill);
                }
            });
        }

        // 增加属性
        if (sect.benefits.attributes) {
            Object.entries(sect.benefits.attributes).forEach(([attr, value]) => {
                character.attributes[attr] += value;
            });
        }
    }

    /**
     * 门派任务系统
     */
    async generateSectMission(playerState) {
        if (!this.playerSectStatus) {
            return null;
        }

        const sect = this.sects[this.playerSectStatus.sectId];
        const prompt = this.buildSectMissionPrompt(sect, playerState);

        try {
            // 调用LLM生成门派任务
            return await this.callLLMForSectMission(prompt);
        } catch (error) {
            return this.generateTemplateSectMission(sect);
        }
    }

    /**
     * 门派关系事件
     */
    async generateSectRelationEvent(playerState) {
        if (!this.playerSectStatus) return null;

        const playerSect = this.sects[this.playerSectStatus.sectId];
        const relations = Object.entries(this.sectRelations)
            .filter(([key, _]) => key.includes(this.playerSectStatus.sectId));

        if (relations.length === 0) return null;

        const [relationKey, relation] = relations[Math.floor(Math.random() * relations.length)];
        const otherSectId = relationKey.split('_').find(id => id !== this.playerSectStatus.sectId);
        const otherSect = this.sects[otherSectId];

        const prompt = `生成一个门派关系事件。

【玩家门派】${playerSect.name}
【相关门派】${otherSect.name}
【关系类型】${relation.type}
【关系强度】${relation.strength}
【历史背景】${relation.history}

请生成一个涉及两个门派关系的事件，玩家需要做出选择。`;

        try {
            return await this.callLLMForSectEvent(prompt);
        } catch (error) {
            return this.generateTemplateSectEvent(playerSect, otherSect, relation);
        }
    }

    /**
     * 获取玩家门派信息
     */
    getPlayerSectInfo() {
        if (!this.playerSectStatus) return null;

        const sect = this.sects[this.playerSectStatus.sectId];
        return {
            sect: sect,
            status: this.playerSectStatus,
            currentRank: sect.ranks[this.playerSectStatus.rank],
            nextRank: sect.ranks[this.playerSectStatus.rank + 1] || '已达最高等级'
        };
    }

    /**
     * 门派升级
     */
    promoteSectRank(contribution) {
        if (!this.playerSectStatus) return false;

        const sect = this.sects[this.playerSectStatus.sectId];
        const currentRank = this.playerSectStatus.rank;
        
        if (currentRank >= sect.ranks.length - 1) {
            return { success: false, message: '已达到最高等级' };
        }

        const requiredContribution = (currentRank + 1) * 100; // 升级所需贡献度
        
        if (this.playerSectStatus.contribution >= requiredContribution) {
            this.playerSectStatus.rank++;
            this.playerSectStatus.contribution -= requiredContribution;
            
            return {
                success: true,
                message: `恭喜升级为${sect.ranks[this.playerSectStatus.rank]}！`,
                newRank: sect.ranks[this.playerSectStatus.rank]
            };
        }

        return {
            success: false,
            message: `还需要${requiredContribution - this.playerSectStatus.contribution}点贡献度才能升级`
        };
    }

    /**
     * 占位符方法 - 调用LLM生成门派任务
     */
    async callLLMForSectMission(prompt) {
        // 实际实现中应该调用后端API
        return this.generateTemplateSectMission();
    }

    /**
     * 占位符方法 - 调用LLM生成门派事件
     */
    async callLLMForSectEvent(prompt) {
        // 实际实现中应该调用后端API
        return this.generateTemplateSectEvent();
    }
}

// 全局实例
window.SectSystem = SectSystem;
