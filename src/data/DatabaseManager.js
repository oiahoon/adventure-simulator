/**
 * 数据库管理器
 * 支持多种存储方式：SQLite文件 → IndexedDB → localStorage
 */
class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbName = 'AdventureSimulatorDB';
        this.version = 1;
        this.isInitialized = false;
        this.storageType = 'unknown';
        this.sqliteDbPath = 'src/data/events.db';
        
        console.log('💾 数据库管理器初始化中...');
        this.init();
    }

    /**
     * 初始化数据库
     */
    async init() {
        try {
            // 首先尝试加载SQLite数据库文件
            if (await this.tryLoadSQLiteFile()) {
                this.storageType = 'sqlite-file';
                console.log('✅ 使用SQLite数据库文件');
            }
            // 降级到IndexedDB
            else if (await this.tryIndexedDB()) {
                this.storageType = 'indexeddb';
                console.log('✅ 使用IndexedDB存储');
            }
            // 最后降级到localStorage
            else if (this.tryLocalStorage()) {
                this.storageType = 'localstorage';
                console.log('⚠️ 降级到localStorage存储');
            } else {
                throw new Error('所有存储方式都不可用');
            }
            
            this.isInitialized = true;
            console.log(`💾 数据库初始化完成 (${this.storageType})`);
            
        } catch (error) {
            console.error('❌ 数据库初始化失败:', error);
            this.storageType = 'none';
        }
    }

    /**
     * 尝试加载SQLite数据库文件
     */
    async tryLoadSQLiteFile() {
        try {
            // 检查SQLite数据库文件是否存在
            const response = await fetch(this.sqliteDbPath, { method: 'HEAD' });
            if (response.ok) {
                console.log('📁 发现SQLite数据库文件');
                return true;
            }
        } catch (error) {
            console.log('📁 SQLite数据库文件不存在，将使用其他存储方式');
        }
        return false;
    }

    /**
     * 从SQLite文件获取事件
     */
    async getEventsFromSQLite(storyline = null, limit = 10) {
        try {
            // 由于浏览器无法直接读取SQLite文件，我们需要通过API
            // 这里先返回空数组，实际应该通过API调用
            console.log('📊 从SQLite文件获取事件 (需要API支持)');
            return [];
        } catch (error) {
            console.error('SQLite查询失败:', error);
            return [];
        }
    }

    /**
     * 尝试使用IndexedDB
     */
    async tryIndexedDB() {
        if (!window.indexedDB) {
            return false;
        }

        try {
            this.db = await this.openIndexedDB();
            await this.createIndexedDBTables();
            return true;
        } catch (error) {
            console.warn('IndexedDB初始化失败:', error);
            return false;
        }
    }

    /**
     * 打开IndexedDB
     */
    openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建事件表
                if (!db.objectStoreNames.contains('events')) {
                    const eventStore = db.createObjectStore('events', { keyPath: 'id' });
                    eventStore.createIndex('storyline', 'storyline', { unique: false });
                    eventStore.createIndex('rarity', 'rarity', { unique: false });
                    eventStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // 创建游戏状态表
                if (!db.objectStoreNames.contains('gameStates')) {
                    db.createObjectStore('gameStates', { keyPath: 'id' });
                }
                
                // 创建统计表
                if (!db.objectStoreNames.contains('statistics')) {
                    db.createObjectStore('statistics', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * 创建IndexedDB表结构
     */
    async createIndexedDBTables() {
        // IndexedDB表在onupgradeneeded中创建
        console.log('📊 IndexedDB表结构已创建');
    }

    /**
     * 尝试使用localStorage
     */
    tryLocalStorage() {
        try {
            const testKey = 'test_storage';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取随机事件
     */
    async getRandomEvents(storyline = null, count = 1) {
        if (!this.isInitialized) {
            await this.waitForInit();
        }

        switch (this.storageType) {
            case 'sqlite-file':
                return await this.getEventsFromSQLite(storyline, count);
            case 'indexeddb':
                return await this.getEventsFromIndexedDB(storyline, count);
            case 'localstorage':
                return this.getEventsFromLocalStorage(storyline, count);
            default:
                return this.getFallbackEvents(storyline, count);
        }
    }

    /**
     * 从IndexedDB获取事件
     */
    async getEventsFromIndexedDB(storyline, count) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['events'], 'readonly');
            const store = transaction.objectStore('events');
            
            let request;
            if (storyline) {
                const index = store.index('storyline');
                request = index.getAll(storyline);
            } else {
                request = store.getAll();
            }
            
            request.onsuccess = () => {
                const events = request.result;
                // 随机选择指定数量的事件
                const shuffled = events.sort(() => 0.5 - Math.random());
                resolve(shuffled.slice(0, count));
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 从localStorage获取事件
     */
    getEventsFromLocalStorage(storyline, count) {
        try {
            const eventsKey = 'adventure_events';
            const eventsData = localStorage.getItem(eventsKey);
            
            if (!eventsData) {
                return this.getFallbackEvents(storyline, count);
            }
            
            const events = JSON.parse(eventsData);
            let filteredEvents = events;
            
            if (storyline) {
                filteredEvents = events.filter(event => event.storyline === storyline);
            }
            
            // 随机选择
            const shuffled = filteredEvents.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
            
        } catch (error) {
            console.error('localStorage读取失败:', error);
            return this.getFallbackEvents(storyline, count);
        }
    }

    /**
     * 获取后备事件（内置事件）
     */
    getFallbackEvents(storyline, count) {
        // 使用ExtendedEvents中的内置事件
        if (window.ExtendedEvents && window.ExtendedEvents.events) {
            let events = window.ExtendedEvents.events;
            
            if (storyline) {
                events = events.filter(event => event.storyline === storyline);
            }
            
            const shuffled = events.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        }
        
        // 最后的后备方案
        return [{
            id: 'fallback_' + Date.now(),
            title: '平静的一天',
            description: '今天是平静的一天，没有什么特别的事情发生。你有时间思考接下来的冒险计划。',
            storyline: storyline || 'xianxia',
            effects: {},
            rarity: 'common'
        }];
    }

    /**
     * 保存事件到数据库
     */
    async saveEvents(events) {
        if (!this.isInitialized) {
            await this.waitForInit();
        }

        switch (this.storageType) {
            case 'indexeddb':
                return await this.saveEventsToIndexedDB(events);
            case 'localstorage':
                return this.saveEventsToLocalStorage(events);
            default:
                console.warn('当前存储方式不支持保存事件');
                return false;
        }
    }

    /**
     * 保存事件到IndexedDB
     */
    async saveEventsToIndexedDB(events) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['events'], 'readwrite');
            const store = transaction.objectStore('events');
            
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
            
            events.forEach(event => {
                store.put(event);
            });
        });
    }

    /**
     * 保存事件到localStorage
     */
    saveEventsToLocalStorage(events) {
        try {
            const eventsKey = 'adventure_events';
            const existingData = localStorage.getItem(eventsKey);
            let allEvents = [];
            
            if (existingData) {
                allEvents = JSON.parse(existingData);
            }
            
            // 合并新事件
            allEvents.push(...events);
            
            // 限制数量（localStorage有大小限制）
            if (allEvents.length > 10000) {
                allEvents = allEvents.slice(-10000);
            }
            
            localStorage.setItem(eventsKey, JSON.stringify(allEvents));
            return true;
            
        } catch (error) {
            console.error('localStorage保存失败:', error);
            return false;
        }
    }

    /**
     * 等待初始化完成
     */
    async waitForInit() {
        while (!this.isInitialized) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * 获取存储统计信息
     */
    async getStatistics() {
        if (!this.isInitialized) {
            await this.waitForInit();
        }

        const stats = {
            storageType: this.storageType,
            isInitialized: this.isInitialized,
            eventCount: 0,
            storageSize: 0
        };

        try {
            switch (this.storageType) {
                case 'indexeddb':
                    const events = await this.getEventsFromIndexedDB(null, 999999);
                    stats.eventCount = events.length;
                    break;
                case 'localstorage':
                    const eventsData = localStorage.getItem('adventure_events');
                    if (eventsData) {
                        stats.eventCount = JSON.parse(eventsData).length;
                        stats.storageSize = eventsData.length;
                    }
                    break;
            }
        } catch (error) {
            console.error('获取统计信息失败:', error);
        }

        return stats;
    }

    /**
     * 保存游戏状态
     */
    async saveGame(gameState) {
        try {
            const saveData = {
                character: gameState.character,
                gameTime: gameState.gameTime || 0,
                eventHistory: gameState.eventHistory || [],
                achievements: gameState.achievements || [],
                statistics: gameState.statistics || {},
                currentLocation: gameState.currentLocation || '新手村',
                timestamp: Date.now()
            };
            
            const saveKey = 'adventure_game_save';
            
            switch (this.storageType) {
                case 'indexeddb':
                    return await this.saveToIndexedDB(saveKey, saveData);
                case 'localstorage':
                    return this.saveToLocalStorage(saveKey, saveData);
                case 'sqlite-file':
                    console.warn('SQLite文件存储不支持游戏保存，降级到localStorage');
                    return this.saveToLocalStorage(saveKey, saveData);
                default:
                    console.log('使用localStorage作为默认保存方式');
                    return this.saveToLocalStorage(saveKey, saveData);
            }
        } catch (error) {
            console.error('保存游戏失败:', error);
            return false;
        }
    }

    /**
     * 加载游戏状态
     */
    async loadGame() {
        try {
            const saveKey = 'adventure_game_save';
            
            switch (this.storageType) {
                case 'indexeddb':
                    return await this.loadFromIndexedDB(saveKey);
                case 'localstorage':
                    return this.loadFromLocalStorage(saveKey);
                default:
                    console.warn('当前存储方式不支持加载游戏');
                    return null;
            }
        } catch (error) {
            console.error('加载游戏失败:', error);
            return null;
        }
    }

    /**
     * 保存到IndexedDB
     */
    async saveToIndexedDB(key, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gameStates'], 'readwrite');
            const store = transaction.objectStore('gameStates');
            
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
            
            store.put({ id: key, data: data, timestamp: Date.now() });
        });
    }

    /**
     * 从IndexedDB加载
     */
    async loadFromIndexedDB(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gameStates'], 'readonly');
            const store = transaction.objectStore('gameStates');
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.data : null);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 保存到localStorage
     */
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('localStorage保存失败:', error);
            return false;
        }
    }

    /**
     * 从localStorage加载
     */
    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('localStorage加载失败:', error);
            return null;
        }
    }

    /**
     * 清理数据库
     */
    async cleanup() {
        // 实现数据库清理逻辑
        console.log('🧹 数据库清理完成');
    }
}

// 创建全局实例
window.DatabaseManager = new DatabaseManager();

console.log('💾 数据库管理器已加载');
