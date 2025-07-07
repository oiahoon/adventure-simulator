/**
 * 生成事件加载器
 * 负责加载和管理LLM生成的事件
 */
class GeneratedEventLoader {
    constructor() {
        this.generatedEvents = [];
        this.eventStats = null;
        this.isLoaded = false;
        this.loadPromise = null;
        this.lastLoadTime = 0;
        this.cacheTimeout = 30 * 60 * 1000; // 30分钟缓存，避免频繁加载
        
        console.log('📚 生成事件加载器初始化完成');
    }

    /**
     * 获取随机生成事件
     */
    async getRandomEvent(gameState) {
        try {
            await this.loadGeneratedEvents();
            
            if (this.generatedEvents.length === 0) {
                console.warn('⚠️ 没有可用的生成事件');
                return null;
            }
            
            // 随机选择一个事件
            var randomIndex = Math.floor(Math.random() * this.generatedEvents.length);
            var event = this.generatedEvents[randomIndex];
            
            console.log('📚 获取生成事件:', event.title);
            return event;
            
        } catch (error) {
            console.error('获取随机生成事件失败:', error);
            return null;
        }
    }

    /**
     * 异步加载生成的事件
     */
    async loadGeneratedEvents() {
        // 如果已经加载过且缓存有效，直接返回
        if (this.isLoaded && this.generatedEvents.length > 0) {
            const now = Date.now();
            if ((now - this.lastLoadTime) < this.cacheTimeout) {
                return this.generatedEvents;
            }
        }

        // 如果正在加载，等待加载完成
        if (this.loadPromise) {
            return await this.loadPromise;
        }

        // 开始加载
        this.loadPromise = this.performLoad();
        
        try {
            await this.loadPromise;
            return this.generatedEvents;
        } finally {
            this.loadPromise = null;
        }
    }

    /**
     * 执行实际的加载操作
     */
    async performLoad() {
        try {
            console.log('🔄 加载生成的事件...');
            
            // 首先尝试从数据库加载
            if (await this.loadFromDatabase()) {
                this.isLoaded = true;
                this.lastLoadTime = Date.now();
                return;
            }
            
            // 然后尝试加载JSON文件
            const response = await fetch('./src/data/generated-events.json');
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.events && Array.isArray(data.events)) {
                    this.generatedEvents = data.events;
                    console.log(`✅ 成功加载 ${this.generatedEvents.length} 个生成的事件`);
                    
                    // 加载统计信息
                    await this.loadEventStats();
                } else {
                    console.warn('⚠️ 生成事件文件格式不正确');
                    this.generatedEvents = [];
                }
            } else {
                console.log('📝 未找到生成事件文件');
                this.generatedEvents = [];
            }
            
        } catch (error) {
            console.error('❌ 加载生成事件失败:', error);
            this.generatedEvents = [];
        } finally {
            this.isLoaded = true;
            this.lastLoadTime = Date.now();
        }
    }

    /**
     * 尝试从数据库加载事件
     */
    async loadFromDatabase() {
        try {
            // 检查是否有数据库管理器
            if (!window.DatabaseManager) {
                return false;
            }
            
            // 等待数据库初始化
            await window.DatabaseManager.waitForInit();
            
            // 尝试获取事件
            const events = await window.DatabaseManager.getRandomEvents(null, 1000);
            
            if (events && events.length > 0) {
                this.generatedEvents = events;
                console.log(`✅ 从数据库加载了 ${events.length} 个事件`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.log('📊 数据库加载失败，尝试其他方式:', error.message);
            return false;
        }
    }

    /**
     * 加载事件统计信息
     */
    async loadEventStats() {
        try {
            const response = await fetch('./src/data/event-stats.json');
            if (response.ok) {
                this.eventStats = await response.json();
                console.log('📊 事件统计信息加载完成');
            }
        } catch (error) {
            console.warn('⚠️ 加载事件统计信息失败:', error);
        }
    }

    /**
     * 根据条件获取事件
     */
    async getEventsByCondition(condition = {}) {
        // 只在第一次或缓存过期时加载
        if (!this.isLoaded) {
            await this.loadGeneratedEvents();
        }
        
        // 如果没有生成的事件，直接返回空数组
        if (this.generatedEvents.length === 0) {
            return [];
        }
        
        let filteredEvents = [...this.generatedEvents];
        
        // 按剧情类型过滤
        if (condition.storyline) {
            filteredEvents = filteredEvents.filter(event => event.storyline === condition.storyline);
        }
        
        // 按类型过滤
        if (condition.type) {
            filteredEvents = filteredEvents.filter(event => event.type === condition.type);
        }
        
        // 按类别过滤
        if (condition.category) {
            filteredEvents = filteredEvents.filter(event => event.category === condition.category);
        }
        
        // 按稀有度过滤
        if (condition.rarity) {
            filteredEvents = filteredEvents.filter(event => event.rarity === condition.rarity);
        }
        
        // 按标签过滤
        if (condition.tags && condition.tags.length > 0) {
            filteredEvents = filteredEvents.filter(event => 
                event.tags && event.tags.some(tag => condition.tags.includes(tag))
            );
        }
        
        // 按角色等级过滤（基于事件难度）
        if (condition.characterLevel) {
            filteredEvents = filteredEvents.filter(event => {
                if (!event.choices || event.choices.length === 0) return true;
                
                const avgDifficulty = event.choices.reduce((sum, choice) => 
                    sum + (choice.difficulty || 30), 0) / event.choices.length;
                
                const levelRange = condition.characterLevel * 10;
                return Math.abs(avgDifficulty - levelRange) <= 30;
            });
        }
        
        return filteredEvents;
    }

    /**
     * 获取随机生成事件
     */
    async getRandomGeneratedEvent(condition = {}) {
        const events = await this.getEventsByCondition(condition);
        
        if (events.length === 0) {
            return null;
        }
        
        // 根据稀有度加权随机选择
        const weightedEvents = [];
        
        events.forEach(event => {
            let weight = 1;
            switch (event.rarity) {
                case 'common': weight = 10; break;
                case 'uncommon': weight = 5; break;
                case 'rare': weight = 2; break;
                case 'legendary': weight = 1; break;
                default: weight = 5;
            }
            
            for (let i = 0; i < weight; i++) {
                weightedEvents.push(event);
            }
        });
        
        const selectedEvent = weightedEvents[Math.floor(Math.random() * weightedEvents.length)];
        
        // 记录事件使用
        this.recordEventUsage(selectedEvent);
        
        return selectedEvent;
    }

    /**
     * 记录事件使用情况
     */
    recordEventUsage(event) {
        if (!event.usageCount) {
            event.usageCount = 0;
        }
        event.usageCount++;
        event.lastUsed = Date.now();
    }

    /**
     * 获取事件统计信息
     */
    getEventStats() {
        return {
            totalEvents: this.generatedEvents.length,
            byCategory: this.countByField('category'),
            byType: this.countByField('type'),
            byRarity: this.countByField('rarity'),
            byGenerator: this.countByField('generator'),
            lastUpdate: this.eventStats?.lastGeneration || null,
            cacheStatus: {
                loaded: this.generatedEvents.length > 0,
                lastLoadTime: this.lastLoadTime,
                cacheValid: (Date.now() - this.lastLoadTime) < this.cacheTimeout
            }
        };
    }

    /**
     * 按字段统计数量
     */
    countByField(field) {
        const counts = {};
        this.generatedEvents.forEach(event => {
            const value = event[field] || 'unknown';
            counts[value] = (counts[value] || 0) + 1;
        });
        return counts;
    }

    /**
     * 获取推荐事件
     */
    async getRecommendedEvents(gameState, count = 5) {
        const character = gameState.character;
        const location = gameState.currentLocation;
        
        // 构建推荐条件
        const condition = {
            characterLevel: character.level
        };
        
        // 根据职业推荐特定类型的事件
        const professionPreferences = {
            warrior: ['fantasy', 'competition', 'survival'],
            mage: ['mythological', 'academic', 'sci-fi'],
            rogue: ['modern', 'business', 'exploration'],
            priest: ['cultural', 'social', 'artistic'],
            ranger: ['exploration', 'maritime', 'survival'],
            noble: ['political', 'social', 'cultural']
        };
        
        const preferredTypes = professionPreferences[character.profession] || [];
        
        // 获取多种类型的事件
        const recommendedEvents = [];
        
        for (const type of preferredTypes) {
            const events = await this.getEventsByCondition({ ...condition, type });
            if (events.length > 0) {
                recommendedEvents.push(...events.slice(0, 2));
            }
        }
        
        // 如果推荐事件不够，添加一些随机事件
        if (recommendedEvents.length < count) {
            const randomEvents = await this.getEventsByCondition(condition);
            const additionalEvents = randomEvents
                .filter(event => !recommendedEvents.includes(event))
                .slice(0, count - recommendedEvents.length);
            
            recommendedEvents.push(...additionalEvents);
        }
        
        // 随机打乱并返回指定数量
        return this.shuffleArray(recommendedEvents).slice(0, count);
    }

    /**
     * 打乱数组
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.generatedEvents = [];
        this.eventStats = null;
        this.lastLoadTime = 0;
        this.loadPromise = null;
        console.log('🗑️ 生成事件缓存已清除');
    }

    /**
     * 预加载事件（在游戏启动时调用）
     */
    async preloadEvents() {
        console.log('🚀 预加载生成事件...');
        await this.loadGeneratedEvents();
        console.log('✅ 生成事件预加载完成');
    }
}

// 创建全局实例
window.GeneratedEventLoader = new GeneratedEventLoader();
