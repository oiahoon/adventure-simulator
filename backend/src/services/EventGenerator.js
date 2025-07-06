class EventGenerator {
    constructor(llmService) {
        this.llmService = llmService;
        this.eventCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
        
        console.log('🎭 事件生成器初始化完成');
    }

    /**
     * 生成事件
     */
    async generateEvents(params) {
        const { character, location, context } = params;
        
        // 检查缓存
        const cacheKey = this.getCacheKey(character, location);
        const cached = this.eventCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            console.log('📚 使用缓存的事件');
            return cached.events;
        }

        try {
            // 使用LLM生成事件
            const events = await this.llmService.generateWuxiaEvent(character, location, context);
            
            // 缓存结果
            this.eventCache.set(cacheKey, {
                events: events,
                timestamp: Date.now()
            });
            
            return events;
            
        } catch (error) {
            console.error('LLM事件生成失败，使用备用方案:', error);
            
            // 备用：生成模板事件
            return this.generateTemplateEvent(character, location);
        }
    }

    /**
     * 生成模板事件（备用方案）
     */
    generateTemplateEvent(character, location) {
        const templates = {
            '新手村': [
                {
                    title: '村中奇遇',
                    description: `${character.name}在${location}中遇到了一位神秘的老者，老者看出了${character.name}的不凡之处，传授了一些江湖经验。`,
                    effects: {
                        status: { experience: 25, wealth: 10 },
                        attributes: {},
                        items: [],
                        skills: [],
                        social: { reputation: 5 }
                    },
                    rarity: 'common',
                    impact_description: '获得25点经验值和10两银子'
                }
            ],
            '森林': [
                {
                    title: '林中遇险',
                    description: `${character.name}在${location}中遭遇了野兽，经过一番搏斗，终于化险为夷，武艺也有所精进。`,
                    effects: {
                        status: { experience: 35, hp: -10 },
                        attributes: { strength: 1 },
                        items: [],
                        skills: [],
                        social: {}
                    },
                    rarity: 'common',
                    impact_description: '获得35点经验值，力量+1，损失10点生命值'
                }
            ]
        };

        const locationTemplates = templates[location] || templates['新手村'];
        const template = locationTemplates[Math.floor(Math.random() * locationTemplates.length)];
        
        return [{
            ...template,
            id: `template_${Date.now()}`,
            type: 'template',
            source: '模板事件',
            generated_at: new Date().toISOString()
        }];
    }

    /**
     * 获取随机事件（从数据库）
     */
    async getRandomEvent(conditions) {
        // 这里应该从数据库查询事件
        // 目前返回模板事件
        return this.generateTemplateEvent(
            { name: '测试角色', profession: 'warrior' },
            conditions.location || '新手村'
        )[0];
    }

    /**
     * 批量生成事件
     */
    async batchGenerateEvents(params) {
        const { count, characters, locations } = params;
        const results = [];
        
        for (let i = 0; i < count; i++) {
            const character = characters[i % characters.length];
            const location = locations[i % locations.length];
            
            try {
                const events = await this.generateEvents({ character, location });
                results.push(...events);
                
                // 避免API限制
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`批量生成第${i+1}个事件失败:`, error);
            }
        }
        
        return results;
    }

    /**
     * 获取事件统计
     */
    async getEventStats() {
        return {
            total_events: 0,
            llm_generated: 0,
            template_events: 0,
            cache_size: this.eventCache.size,
            last_generated: new Date().toISOString()
        };
    }

    /**
     * 生成缓存键
     */
    getCacheKey(character, location) {
        return `${character.profession}_${character.level}_${location}`;
    }
}

module.exports = EventGenerator;
