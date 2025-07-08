#!/usr/bin/env node

/**
 * 手动触发LLM事件生成脚本
 * 用于测试和手动生成事件数据
 */

const fs = require('fs');
const path = require('path');

// 模拟DeepSeek API调用生成事件
async function generateMockLLMEvents() {
    console.log('🤖 开始生成模拟LLM事件...');
    
    const mockEvents = [
        {
            id: 'llm_001',
            title: '神秘的古卷',
            description: '你在一座废弃的藏书楼中发现了一卷古老的武功秘籍。卷轴上记载着失传已久的"凌波微步"轻功心法。虽然字迹模糊，但你隐约能感受到其中蕴含的深奥武学原理。经过一番研读，你对身法有了新的领悟。',
            location: '废弃藏书楼',
            effects: {
                attributes: {
                    dexterity: 2,
                    intelligence: 1
                },
                status: {
                    experience: 45,
                    mp: 10
                },
                skills: ['凌波微步'],
                personality: {
                    wisdom: 3,
                    curiosity: 2
                }
            },
            rarity: 'rare',
            category: 'skill_training',
            impact_description: '通过研读古卷，你的身法和智慧都有所提升，并学会了传说中的轻功。',
            source: 'DeepSeek LLM',
            generated_at: new Date().toISOString()
        },
        {
            id: 'llm_002',
            title: '江湖恩怨',
            description: '在繁华的客栈中，你无意间听到了两个江湖人士的对话。原来多年前有一桩血案至今未破，受害者的后人一直在寻找真凶。你想起曾经见过的一些线索，决定暗中调查此事。经过一番明察暗访，你发现了关键证据，帮助受害者家属找到了真相。',
            location: '繁华客栈',
            effects: {
                status: {
                    experience: 35,
                    wealth: 80
                },
                reputation: {
                    righteous: 8,
                    jianghu: 5
                },
                personality: {
                    compassion: 4,
                    wisdom: 2
                }
            },
            rarity: 'uncommon',
            category: 'social',
            impact_description: '你的正义行为赢得了江湖人士的尊敬，声望和财富都有所增加。',
            source: 'DeepSeek LLM',
            generated_at: new Date().toISOString()
        },
        {
            id: 'llm_003',
            title: '雪山奇遇',
            description: '在攀登雪山的过程中，你遭遇了暴风雪，迷失了方向。就在体力即将耗尽时，你发现了一个隐蔽的山洞。洞中居住着一位隐居的老者，他不仅救了你，还传授给你一套抗寒的内功心法。经过数日的修炼，你的体质得到了显著提升。',
            location: '雪山洞穴',
            effects: {
                attributes: {
                    constitution: 3,
                    strength: 1
                },
                status: {
                    experience: 60,
                    hp: 20
                },
                skills: ['寒冰内功'],
                personality: {
                    patience: 5,
                    courage: 3
                }
            },
            rarity: 'rare',
            category: 'training',
            impact_description: '雪山的严酷环境和老者的指导让你的体质和意志都得到了锻炼。',
            source: 'DeepSeek LLM',
            generated_at: new Date().toISOString()
        },
        {
            id: 'llm_004',
            title: '魔教袭击',
            description: '夜深人静时，一群黑衣人突然袭击了你所在的村庄。他们自称魔教弟子，要在此地进行邪恶仪式。你挺身而出，与村民们一起抵抗。激战中，你展现出了惊人的战斗天赋，但也受了不轻的伤。最终魔教弟子被击退，村民们对你感激不尽。',
            location: '宁静村庄',
            effects: {
                attributes: {
                    strength: 2,
                    courage: 4
                },
                status: {
                    experience: 70,
                    hp: -25,
                    wealth: 60
                },
                reputation: {
                    righteous: 10,
                    evil: -5
                },
                personality: {
                    courage: 6,
                    compassion: 3
                }
            },
            rarity: 'epic',
            category: 'martial_combat',
            impact_description: '与魔教的战斗让你变得更加强大，但也付出了血的代价。',
            source: 'DeepSeek LLM',
            generated_at: new Date().toISOString()
        },
        {
            id: 'llm_005',
            title: '古墓探险',
            description: '你发现了一座隐藏在山林中的古墓。墓中机关重重，但也藏着无数珍宝。你小心翼翼地破解了各种机关，最终来到了墓室深处。在那里，你不仅找到了大量金银财宝，还发现了一本记录着古代炼丹术的典籍。虽然过程惊险，但收获颇丰。',
            location: '神秘古墓',
            effects: {
                attributes: {
                    intelligence: 2,
                    luck: 3
                },
                status: {
                    experience: 55,
                    wealth: 200,
                    mp: -10
                },
                skills: ['古代炼丹术'],
                personality: {
                    curiosity: 4,
                    courage: 2
                }
            },
            rarity: 'legendary',
            category: 'treasure_hunt',
            impact_description: '古墓探险让你获得了丰厚的财富和珍贵的知识，但也消耗了不少精力。',
            source: 'DeepSeek LLM',
            generated_at: new Date().toISOString()
        }
    ];
    
    // 更新事件数据文件
    const eventsPath = path.join(__dirname, '../public/src/data/generated-events.json');
    const statsPath = path.join(__dirname, '../public/src/data/event-stats.json');
    
    // 读取现有数据
    let eventsData = { events: [], metadata: {} };
    let statsData = { totalGenerated: 0, generationHistory: [], providerStats: {} };
    
    try {
        if (fs.existsSync(eventsPath)) {
            eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
        }
        if (fs.existsSync(statsPath)) {
            statsData = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        }
    } catch (error) {
        console.warn('读取现有数据失败，将创建新数据:', error.message);
    }
    
    // 添加新事件
    eventsData.events = eventsData.events || [];
    eventsData.events.push(...mockEvents);
    
    // 更新元数据
    eventsData.metadata = {
        totalEvents: eventsData.events.length,
        lastUpdated: new Date().toISOString(),
        version: '1.0',
        maxEvents: 100000,
        description: 'This file contains events generated by various LLM providers including DeepSeek, OpenAI, Claude, and Gemini.'
    };
    
    // 更新统计数据
    statsData.totalGenerated += mockEvents.length;
    statsData.lastGeneration = new Date().toISOString();
    statsData.generationHistory.push({
        timestamp: new Date().toISOString(),
        count: mockEvents.length,
        provider: 'DeepSeek (Mock)'
    });
    
    statsData.providerStats = statsData.providerStats || {};
    statsData.providerStats['DeepSeek'] = (statsData.providerStats['DeepSeek'] || 0) + mockEvents.length;
    
    // 写入文件
    fs.writeFileSync(eventsPath, JSON.stringify(eventsData, null, 2));
    fs.writeFileSync(statsPath, JSON.stringify(statsData, null, 2));
    
    console.log(`✅ 成功生成 ${mockEvents.length} 个LLM事件`);
    console.log(`📊 总事件数: ${eventsData.events.length}`);
    console.log(`📁 事件文件: ${eventsPath}`);
    console.log(`📈 统计文件: ${statsPath}`);
}

// 运行生成
generateMockLLMEvents().catch(console.error);
