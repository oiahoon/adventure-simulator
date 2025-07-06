/**
 * 扩展事件数据库
 * 包含更多样化和丰富的游戏事件
 */
class ExtendedEvents {
    static getEventDatabase() {
        return {
            // 城镇事件
            town_events: [
                {
                    id: 'market_day',
                    title: '集市日',
                    description: '今天是集市日，街道上熙熙攘攘，商贩们大声叫卖着各种商品。你注意到一个神秘的摊位。',
                    type: 'social',
                    choices: [
                        { text: '前往神秘摊位', requirement: 'charisma', difficulty: 25, effect: { wealth: -20, equipment: 'mystery_item' } },
                        { text: '购买日常用品', cost: { wealth: 30 }, effect: { hp: 20, mp: 10 } },
                        { text: '观察人群', requirement: 'intelligence', difficulty: 20, effect: { reputation: 3, experience: 8 } },
                        { text: '离开集市', effect: { fatigue: -5 } }
                    ]
                },
                {
                    id: 'tavern_rumors',
                    title: '酒馆传言',
                    description: '在热闹的酒馆里，你听到了各种传言和故事。一个老冒险者似乎知道一些有趣的秘密。',
                    type: 'social',
                    choices: [
                        { text: '请老冒险者喝酒', cost: { wealth: 15 }, effect: { reputation: 2, experience: 10 } },
                        { text: '仔细倾听传言', requirement: 'intelligence', difficulty: 30, effect: { experience: 15 } },
                        { text: '分享自己的故事', requirement: 'charisma', difficulty: 25, effect: { reputation: 5 } },
                        { text: '安静地喝酒', effect: { hp: 10, fatigue: -10 } }
                    ]
                }
            ],

            // 野外冒险事件
            wilderness_events: [
                {
                    id: 'ancient_shrine',
                    title: '古老神殿',
                    description: '在荒野中，你发现了一座被藤蔓覆盖的古老神殿。神殿前有一个石制祭坛，上面刻着古老的符文。',
                    type: 'mystery',
                    choices: [
                        { text: '研究符文', requirement: 'intelligence', difficulty: 40, effect: { experience: 20, mp: 15 } },
                        { text: '在祭坛上祈祷', requirement: 'charisma', difficulty: 30, effect: { hp: 25, reputation: 3 } },
                        { text: '搜索神殿', requirement: 'exploration', difficulty: 35, effect: { wealth: 50, equipment: 'ancient_relic' } },
                        { text: '尊敬地离开', effect: { reputation: 1, experience: 5 } }
                    ]
                },
                {
                    id: 'weather_storm',
                    title: '突然的暴风雨',
                    description: '天空突然乌云密布，狂风大作。你需要找个地方避雨，但周围只有一个看起来不太安全的洞穴。',
                    type: 'survival',
                    choices: [
                        { text: '进入洞穴避雨', requirement: 'survival', difficulty: 25, risk: true },
                        { text: '寻找其他庇护所', requirement: 'exploration', difficulty: 35, effect: { fatigue: 10 } },
                        { text: '在雨中前行', effect: { hp: -15, fatigue: 15, experience: 8 } },
                        { text: '用魔法保护自己', requirement: 'magic', difficulty: 30, cost: { mp: 20 }, effect: { experience: 12 } }
                    ]
                }
            ],

            // 地下城事件
            dungeon_events: [
                {
                    id: 'trapped_corridor',
                    title: '机关走廊',
                    description: '你来到一条狭长的走廊，地面上有明显的压力板痕迹。墙壁上的小孔暗示着这里布满了陷阱。',
                    type: 'challenge',
                    choices: [
                        { text: '小心地绕过陷阱', requirement: 'dexterity', difficulty: 45, effect: { experience: 15 } },
                        { text: '用魔法探测陷阱', requirement: 'magic', difficulty: 40, cost: { mp: 15 }, effect: { experience: 18 } },
                        { text: '快速冲过去', requirement: 'dexterity', difficulty: 60, risk: true },
                        { text: '寻找其他路径', requirement: 'intelligence', difficulty: 35, effect: { fatigue: 10, experience: 10 } }
                    ]
                },
                {
                    id: 'treasure_guardian',
                    title: '宝藏守护者',
                    description: '在一个宽敞的房间里，你看到了闪闪发光的宝箱。但是，一个石制的守护者雕像突然活了过来，挡在宝箱前面。',
                    type: 'combat',
                    choices: [
                        { text: '与守护者战斗', requirement: 'combat', difficulty: 50, effect: { wealth: 100, experience: 25 } },
                        { text: '尝试与它沟通', requirement: 'charisma', difficulty: 45, effect: { wealth: 50, reputation: 5 } },
                        { text: '寻找机关解除它', requirement: 'intelligence', difficulty: 40, effect: { wealth: 75, experience: 20 } },
                        { text: '悄悄离开', effect: { experience: 5 } }
                    ]
                }
            ],

            // 魔法相关事件
            magical_events: [
                {
                    id: 'magic_fountain',
                    title: '魔法喷泉',
                    description: '你发现了一个散发着淡蓝色光芒的魔法喷泉。泉水看起来很诱人，但你感觉到其中蕴含着强大的魔法力量。',
                    type: 'magic',
                    choices: [
                        { text: '喝下泉水', risk: true, effect: { mp: 50, experience: 15 } },
                        { text: '用容器收集泉水', requirement: 'intelligence', difficulty: 25, effect: { equipment: 'magic_water' } },
                        { text: '研究魔法阵', requirement: 'magic', difficulty: 35, effect: { experience: 20, mp: 10 } },
                        { text: '不碰任何东西', effect: { experience: 3 } }
                    ]
                },
                {
                    id: 'spell_scroll',
                    title: '神秘卷轴',
                    description: '在一个废弃的法师塔里，你找到了一卷古老的法术卷轴。卷轴上的文字在微微发光，似乎蕴含着强大的魔法。',
                    type: 'magic',
                    choices: [
                        { text: '尝试学习法术', requirement: 'magic', difficulty: 40, effect: { experience: 25, skill: 'new_spell' } },
                        { text: '小心地保存卷轴', effect: { equipment: 'spell_scroll' } },
                        { text: '研究卷轴的来历', requirement: 'intelligence', difficulty: 30, effect: { experience: 15, reputation: 2 } },
                        { text: '将卷轴留在原地', effect: { reputation: 1 } }
                    ]
                }
            ],

            // 社交和政治事件
            political_events: [
                {
                    id: 'noble_dispute',
                    title: '贵族纠纷',
                    description: '你无意中卷入了两个贵族家族之间的纠纷。他们都希望你能站在自己这一边，并承诺给予丰厚的报酬。',
                    type: 'political',
                    choices: [
                        { text: '支持第一个家族', effect: { wealth: 100, reputation: 10, enemy: 'noble_family_2' } },
                        { text: '支持第二个家族', effect: { wealth: 80, reputation: 8, enemy: 'noble_family_1' } },
                        { text: '尝试调解纠纷', requirement: 'charisma', difficulty: 50, effect: { reputation: 15, experience: 20 } },
                        { text: '保持中立', effect: { reputation: -2 } }
                    ]
                },
                {
                    id: 'royal_summons',
                    title: '王室召见',
                    description: '你收到了来自王室的召见令。国王希望见见这位在民间颇有声望的冒险者，但你不确定这是好事还是坏事。',
                    type: 'political',
                    choices: [
                        { text: '立即前往王宫', effect: { reputation: 5, experience: 15 } },
                        { text: '准备充分后再去', requirement: 'charisma', difficulty: 30, effect: { reputation: 8, wealth: 50 } },
                        { text: '派人打听消息', requirement: 'intelligence', difficulty: 25, cost: { wealth: 20 }, effect: { experience: 10 } },
                        { text: '暂时避开', effect: { reputation: -5, fatigue: 10 } }
                    ]
                }
            ],

            // 神秘和超自然事件
            supernatural_events: [
                {
                    id: 'ghost_encounter',
                    title: '幽灵邂逅',
                    description: '在一个月黑风高的夜晚，你遇到了一个透明的身影。这个幽灵似乎想要告诉你什么，但它的话语断断续续。',
                    type: 'supernatural',
                    choices: [
                        { text: '尝试与幽灵沟通', requirement: 'charisma', difficulty: 35, effect: { experience: 18, reputation: 3 } },
                        { text: '用魔法帮助幽灵', requirement: 'magic', difficulty: 40, cost: { mp: 25 }, effect: { experience: 22, reputation: 5 } },
                        { text: '驱散幽灵', requirement: 'magic', difficulty: 30, cost: { mp: 15 }, effect: { experience: 12 } },
                        { text: '快速离开', effect: { fatigue: 5, experience: 3 } }
                    ]
                },
                {
                    id: 'time_anomaly',
                    title: '时间异常',
                    description: '你走进了一个奇怪的区域，这里的时间似乎流逝得很慢。你看到自己的动作变得缓慢，但思维依然清晰。',
                    type: 'supernatural',
                    choices: [
                        { text: '研究这个现象', requirement: 'intelligence', difficulty: 45, effect: { experience: 25, mp: 20 } },
                        { text: '尝试用魔法稳定时间', requirement: 'magic', difficulty: 50, cost: { mp: 30 }, effect: { experience: 30 } },
                        { text: '快速穿过这个区域', requirement: 'dexterity', difficulty: 35, effect: { fatigue: 15, experience: 15 } },
                        { text: '在这里冥想', effect: { mp: 25, experience: 10, fatigue: -20 } }
                    ]
                }
            ],

            // 商业和贸易事件
            trade_events: [
                {
                    id: 'caravan_escort',
                    title: '护送商队',
                    description: '一个商人请求你护送他的商队通过危险的山路。他承诺会给你丰厚的报酬，但旅程可能会很危险。',
                    type: 'quest',
                    choices: [
                        { text: '接受护送任务', effect: { wealth: 150, experience: 20, fatigue: 20 } },
                        { text: '要求更高的报酬', requirement: 'charisma', difficulty: 30, effect: { wealth: 200, experience: 20, fatigue: 20 } },
                        { text: '只护送一段路程', effect: { wealth: 75, experience: 10, fatigue: 10 } },
                        { text: '礼貌地拒绝', effect: { reputation: 1 } }
                    ]
                },
                {
                    id: 'rare_goods',
                    title: '稀有商品',
                    description: '你遇到了一个销售稀有商品的商人。他有一些非常珍贵的物品，但价格也相当昂贵。',
                    type: 'trade',
                    choices: [
                        { text: '购买魔法物品', cost: { wealth: 200 }, effect: { equipment: 'magic_item' } },
                        { text: '购买稀有药水', cost: { wealth: 100 }, effect: { equipment: 'rare_potion' } },
                        { text: '尝试讨价还价', requirement: 'charisma', difficulty: 35, effect: { wealth: -150, equipment: 'magic_item' } },
                        { text: '只是看看', effect: { experience: 5 } }
                    ]
                }
            ]
        };
    }

    /**
     * 根据条件获取合适的事件
     */
    static getEventsForContext(location, characterLevel, profession) {
        const allEvents = this.getEventDatabase();
        let availableEvents = [];

        // 根据地点添加事件
        switch (location) {
            case 'newbie_village':
            case 'town':
                availableEvents.push(...allEvents.town_events);
                availableEvents.push(...allEvents.trade_events);
                break;
            case 'forest':
            case 'mountain':
                availableEvents.push(...allEvents.wilderness_events);
                break;
            case 'dungeon':
            case 'ruins':
                availableEvents.push(...allEvents.dungeon_events);
                break;
        }

        // 根据角色等级添加事件
        if (characterLevel >= 5) {
            availableEvents.push(...allEvents.magical_events);
        }

        if (characterLevel >= 10) {
            availableEvents.push(...allEvents.political_events);
            availableEvents.push(...allEvents.supernatural_events);
        }

        // 根据职业添加特定事件
        if (profession === 'mage') {
            availableEvents.push(...allEvents.magical_events);
        } else if (profession === 'noble') {
            availableEvents.push(...allEvents.political_events);
        }

        return availableEvents;
    }

    /**
     * 获取随机事件
     */
    static getRandomEvent(location, characterLevel, profession) {
        const events = this.getEventsForContext(location, characterLevel, profession);
        if (events.length === 0) return null;
        
        return events[Math.floor(Math.random() * events.length)];
    }
}
