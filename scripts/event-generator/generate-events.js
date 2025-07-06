#!/usr/bin/env node

/**
 * 多LLM事件生成器
 * 使用多个大语言模型生成丰富多样的游戏事件
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const LLMProviders = require('./llm-providers');
const EventTemplates = require('./event-templates');
const EventValidator = require('./event-validator');

class EventGenerator {
    constructor() {
        this.providers = new LLMProviders();
        this.templates = new EventTemplates();
        this.validator = new EventValidator();
        
        this.dataDir = path.join(__dirname, '../../src/data');
        this.eventsFile = path.join(this.dataDir, 'generated-events.json');
        this.statsFile = path.join(this.dataDir, 'event-stats.json');
        
        this.maxEvents = 100000; // 最大事件数量
        this.batchSize = 50; // 每次生成的事件数量
        
        console.log('🎲 事件生成器初始化完成');
    }

    /**
     * 主生成流程
     */
    async generate() {
        try {
            console.log('🚀 开始生成事件...');
            
            // 加载现有事件
            const existingEvents = await this.loadExistingEvents();
            console.log(`📚 已加载 ${existingEvents.length} 个现有事件`);
            
            // 生成新事件
            const newEvents = await this.generateNewEvents();
            console.log(`✨ 生成了 ${newEvents.length} 个新事件`);
            
            // 合并和清理事件
            const allEvents = [...existingEvents, ...newEvents];
            const cleanedEvents = this.cleanupEvents(allEvents);
            
            // 保存事件
            await this.saveEvents(cleanedEvents);
            
            // 更新统计信息
            await this.updateStats(newEvents);
            
            console.log('✅ 事件生成完成！');
            
        } catch (error) {
            console.error('❌ 事件生成失败:', error);
            process.exit(1);
        }
    }

    /**
     * 加载现有事件
     */
    async loadExistingEvents() {
        try {
            if (await fs.pathExists(this.eventsFile)) {
                const data = await fs.readJson(this.eventsFile);
                return Array.isArray(data.events) ? data.events : [];
            }
        } catch (error) {
            console.warn('⚠️ 加载现有事件失败:', error.message);
        }
        return [];
    }

    /**
     * 生成新事件
     */
    async generateNewEvents() {
        const newEvents = [];
        const providers = this.providers.getAvailableProviders();
        
        if (providers.length === 0) {
            throw new Error('没有可用的LLM提供商');
        }
        
        console.log(`🤖 使用 ${providers.length} 个LLM提供商生成事件`);
        
        // 为每个提供商生成事件
        for (const provider of providers) {
            try {
                console.log(`🔄 使用 ${provider.name} 生成事件...`);
                const events = await this.generateEventsWithProvider(provider);
                newEvents.push(...events);
                
                // 添加延迟避免API限制
                await this.sleep(2000);
                
            } catch (error) {
                console.error(`❌ ${provider.name} 生成失败:`, error.message);
                continue;
            }
        }
        
        return newEvents;
    }

    /**
     * 使用特定提供商生成事件
     */
    async generateEventsWithProvider(provider) {
        const events = [];
        const eventsPerProvider = Math.ceil(this.batchSize / this.providers.getAvailableProviders().length);
        
        for (let i = 0; i < eventsPerProvider; i++) {
            try {
                const template = this.templates.getRandomTemplate();
                const prompt = this.buildPrompt(template);
                
                console.log(`  📝 生成事件 ${i + 1}/${eventsPerProvider} (${template.category})`);
                
                const response = await provider.generateEvent(prompt);
                const event = this.parseEventResponse(response, template, provider.name);
                
                if (this.validator.validateEvent(event)) {
                    events.push(event);
                } else {
                    console.warn(`⚠️ 事件验证失败，跳过`);
                }
                
                // 添加小延迟
                await this.sleep(500);
                
            } catch (error) {
                console.error(`❌ 生成单个事件失败:`, error.message);
                continue;
            }
        }
        
        return events;
    }

    /**
     * 构建提示词
     */
    buildPrompt(template) {
        const basePrompt = `你是一个创意丰富的游戏设计师，需要为文字冒险游戏生成一个${template.category}类型的事件。

要求：
1. 事件背景可以是任何时代、任何文化（古代、现代、中国、西方、神话、历史等）
2. 事件内容要有创意和随机性，避免套路化
3. 提供3-4个有意义的选择选项
4. 每个选择都要有合理的后果和影响
5. 事件要适合${template.setting}环境

请按以下JSON格式返回：
{
  "title": "事件标题",
  "description": "详细的事件描述（100-200字）",
  "type": "${template.type}",
  "category": "${template.category}",
  "setting": "${template.setting}",
  "choices": [
    {
      "text": "选择描述",
      "requirement": "需要的能力类型（可选）",
      "difficulty": 难度值(10-90),
      "effects": {
        "hp": 生命值变化,
        "mp": 魔法值变化,
        "wealth": 财富变化,
        "reputation": 声望变化,
        "experience": 经验值变化,
        "fatigue": 疲劳度变化
      },
      "consequences": "选择后果描述"
    }
  ],
  "rarity": "${template.rarity}",
  "tags": ["标签1", "标签2"]
}

特殊要求：
${template.specialRequirements}

现在请生成一个独特而有趣的事件：`;

        return basePrompt;
    }

    /**
     * 解析LLM响应
     */
    parseEventResponse(response, template, providerName) {
        try {
            // 尝试提取JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('未找到有效的JSON响应');
            }
            
            const eventData = JSON.parse(jsonMatch[0]);
            
            // 添加元数据
            const event = {
                id: uuidv4(),
                ...eventData,
                generated: true,
                generator: providerName,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            // 确保必要字段存在
            event.choices = event.choices || [];
            event.tags = event.tags || [];
            event.rarity = event.rarity || 'common';
            
            return event;
            
        } catch (error) {
            console.error('解析事件响应失败:', error.message);
            console.error('原始响应:', response.substring(0, 500));
            throw error;
        }
    }

    /**
     * 清理事件数据
     */
    cleanupEvents(events) {
        // 按时间戳排序，保留最新的事件
        const sortedEvents = events.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        // 如果超过最大数量，删除最老的事件
        if (sortedEvents.length > this.maxEvents) {
            const removedCount = sortedEvents.length - this.maxEvents;
            console.log(`🗑️ 删除 ${removedCount} 个最老的事件`);
            return sortedEvents.slice(0, this.maxEvents);
        }
        
        return sortedEvents;
    }

    /**
     * 保存事件到文件
     */
    async saveEvents(events) {
        await fs.ensureDir(this.dataDir);
        
        const data = {
            events: events,
            metadata: {
                totalEvents: events.length,
                lastUpdated: new Date().toISOString(),
                version: '1.0',
                maxEvents: this.maxEvents
            }
        };
        
        await fs.writeJson(this.eventsFile, data, { spaces: 2 });
        console.log(`💾 已保存 ${events.length} 个事件到 ${this.eventsFile}`);
    }

    /**
     * 更新统计信息
     */
    async updateStats(newEvents) {
        let stats = {
            totalGenerated: 0,
            lastGeneration: null,
            generationHistory: [],
            providerStats: {},
            categoryStats: {},
            rarityStats: {}
        };
        
        // 加载现有统计
        try {
            if (await fs.pathExists(this.statsFile)) {
                stats = await fs.readJson(this.statsFile);
            }
        } catch (error) {
            console.warn('加载统计信息失败:', error.message);
        }
        
        // 更新统计
        stats.totalGenerated += newEvents.length;
        stats.lastGeneration = new Date().toISOString();
        
        // 记录本次生成
        const generationRecord = {
            timestamp: Date.now(),
            count: newEvents.length,
            providers: [...new Set(newEvents.map(e => e.generator))],
            categories: this.countByField(newEvents, 'category'),
            rarities: this.countByField(newEvents, 'rarity')
        };
        
        stats.generationHistory.push(generationRecord);
        
        // 保留最近100次生成记录
        if (stats.generationHistory.length > 100) {
            stats.generationHistory = stats.generationHistory.slice(-100);
        }
        
        // 更新提供商统计
        newEvents.forEach(event => {
            const provider = event.generator || 'unknown';
            stats.providerStats[provider] = (stats.providerStats[provider] || 0) + 1;
        });
        
        // 更新分类统计
        newEvents.forEach(event => {
            const category = event.category || 'unknown';
            stats.categoryStats[category] = (stats.categoryStats[category] || 0) + 1;
        });
        
        // 更新稀有度统计
        newEvents.forEach(event => {
            const rarity = event.rarity || 'common';
            stats.rarityStats[rarity] = (stats.rarityStats[rarity] || 0) + 1;
        });
        
        await fs.writeJson(this.statsFile, stats, { spaces: 2 });
        console.log(`📊 已更新统计信息`);
    }

    /**
     * 按字段统计数量
     */
    countByField(events, field) {
        const counts = {};
        events.forEach(event => {
            const value = event[field] || 'unknown';
            counts[value] = (counts[value] || 0) + 1;
        });
        return counts;
    }

    /**
     * 延迟函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 主执行逻辑
async function main() {
    const generator = new EventGenerator();
    await generator.generate();
}

// 如果直接运行此文件
if (require.main === module) {
    main().catch(error => {
        console.error('💥 程序执行失败:', error);
        process.exit(1);
    });
}

module.exports = EventGenerator;
