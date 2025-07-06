#!/usr/bin/env node

/**
 * 事件生成器测试脚本
 * 用于本地测试事件生成功能
 */

const EventGenerator = require('./generate-events');
const EventTemplates = require('./event-templates');
const EventValidator = require('./event-validator');

async function testTemplates() {
    console.log('🧪 测试事件模板...');
    
    const templates = new EventTemplates();
    const stats = templates.getStats();
    
    console.log('📊 模板统计:');
    console.log(`  总数: ${stats.total}`);
    console.log(`  类别: ${Object.keys(stats.byCategory).length}`);
    console.log(`  稀有度: ${Object.keys(stats.byRarity).length}`);
    
    // 测试随机模板生成
    console.log('\n🎲 随机模板示例:');
    for (let i = 0; i < 5; i++) {
        const template = templates.getRandomTemplate();
        console.log(`  ${i + 1}. ${template.category} (${template.rarity})`);
    }
}

async function testValidator() {
    console.log('\n🔍 测试事件验证器...');
    
    const validator = new EventValidator();
    
    // 测试有效事件
    const validEvent = {
        id: 'test-001',
        title: '测试事件',
        description: '这是一个用于测试的事件描述，包含足够的文字来满足长度要求。',
        type: 'fantasy',
        category: '奇幻冒险',
        choices: [
            {
                text: '选择一',
                difficulty: 30,
                effects: { experience: 10, wealth: 5 }
            },
            {
                text: '选择二',
                requirement: 'combat',
                difficulty: 45,
                effects: { hp: -10, experience: 15 }
            }
        ],
        rarity: 'common',
        tags: ['测试', '示例']
    };
    
    const isValid = validator.validateEvent(validEvent);
    console.log(`✅ 有效事件验证: ${isValid ? '通过' : '失败'}`);
    
    // 测试无效事件
    const invalidEvent = {
        id: 'test-002',
        title: '短',
        description: '太短',
        choices: []
    };
    
    const isInvalid = validator.validateEvent(invalidEvent);
    console.log(`❌ 无效事件验证: ${isInvalid ? '意外通过' : '正确拒绝'}`);
}

async function testMockGeneration() {
    console.log('\n🎭 测试模拟事件生成...');
    
    // 模拟LLM响应
    const mockResponse = `{
        "title": "神秘商人的邀请",
        "description": "在繁华的集市上，一位穿着华丽长袍的神秘商人向你走来。他的眼中闪烁着智慧的光芒，手中拿着一个精美的小盒子。'年轻的冒险者，'他说道，'我有一个特殊的提议给你。这个盒子里装着一件能改变命运的物品，但获得它需要付出代价。你愿意听听我的条件吗？'",
        "type": "social",
        "category": "商业贸易",
        "setting": "集市",
        "choices": [
            {
                "text": "好奇地询问详情",
                "requirement": "charisma",
                "difficulty": 25,
                "effects": {
                    "experience": 8,
                    "reputation": 2
                },
                "consequences": "商人会详细解释交易条件"
            },
            {
                "text": "直接购买神秘物品",
                "difficulty": 20,
                "effects": {
                    "wealth": -100,
                    "experience": 15
                },
                "consequences": "获得神秘物品但花费不菲"
            },
            {
                "text": "礼貌地拒绝",
                "effects": {
                    "reputation": 1
                },
                "consequences": "商人会尊重你的选择"
            }
        ],
        "rarity": "uncommon",
        "tags": ["商人", "交易", "神秘"]
    }`;
    
    try {
        const eventData = JSON.parse(mockResponse);
        const validator = new EventValidator();
        
        // 添加必需的元数据
        eventData.id = 'mock-test-001';
        eventData.generated = true;
        eventData.generator = 'mock';
        eventData.timestamp = Date.now();
        
        const isValid = validator.validateEvent(eventData);
        console.log(`🎯 模拟事件验证: ${isValid ? '通过' : '失败'}`);
        
        if (isValid) {
            console.log('📝 生成的事件:');
            console.log(`  标题: ${eventData.title}`);
            console.log(`  类型: ${eventData.type} / ${eventData.category}`);
            console.log(`  选择数量: ${eventData.choices.length}`);
            console.log(`  稀有度: ${eventData.rarity}`);
        }
        
    } catch (error) {
        console.error('❌ 模拟事件解析失败:', error);
    }
}

async function main() {
    console.log('🚀 开始测试事件生成器组件...\n');
    
    try {
        await testTemplates();
        await testValidator();
        await testMockGeneration();
        
        console.log('\n✅ 所有测试完成！');
        
        // 如果设置了API密钥，可以测试真实的生成
        if (process.env.DEEPSEEK_TOKEN) {
            console.log('\n🔑 检测到API密钥，可以运行真实生成测试');
            console.log('运行 npm run generate 来测试真实的事件生成');
        } else {
            console.log('\n💡 提示: 设置 DEEPSEEK_TOKEN 环境变量来测试真实的事件生成');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出错:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    testTemplates,
    testValidator,
    testMockGeneration
};
