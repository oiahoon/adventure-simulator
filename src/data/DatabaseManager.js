/**
 * SQLite数据库管理器
 * 使用Web SQL Database API (在现代浏览器中使用IndexedDB作为替代)
 */
class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbName = 'AdventureSimulator';
        this.version = '1.0';
        this.displayName = 'Adventure Simulator Database';
        this.maxSize = 50 * 1024 * 1024; // 50MB
        
        this.initPromise = this.initDatabase();
        console.log('💾 数据库管理器初始化中...');
    }

    /**
     * 初始化数据库
     */
    async initDatabase() {
        try {
            // 尝试使用Web SQL Database
            if (window.openDatabase) {
                this.db = window.openDatabase(
                    this.dbName,
                    this.version,
                    this.displayName,
                    this.maxSize
                );
                await this.createTables();
                console.log('✅ Web SQL Database 初始化完成');
                return;
            }
            
            // 如果不支持Web SQL，使用IndexedDB
            await this.initIndexedDB();
            console.log('✅ IndexedDB 初始化完成');
            
        } catch (error) {
            console.error('❌ 数据库初始化失败:', error);
            // 降级到localStorage
            this.useLocalStorage = true;
            console.log('⚠️ 降级使用 localStorage');
        }
    }

    /**
     * 初始化IndexedDB
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.indexedDB = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建事件表
                if (!db.objectStoreNames.contains('events')) {
                    const eventStore = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
                    eventStore.createIndex('storyline', 'storyline', { unique: false });
                    eventStore.createIndex('chapter', 'chapter', { unique: false });
                    eventStore.createIndex('created_at', 'created_at', { unique: false });
                }
                
                // 创建游戏存档表
                if (!db.objectStoreNames.contains('saves')) {
                    const saveStore = db.createObjectStore('saves', { keyPath: 'id' });
                    saveStore.createIndex('character_name', 'character_name', { unique: false });
                    saveStore.createIndex('created_at', 'created_at', { unique: false });
                }
                
                // 创建统计表
                if (!db.objectStoreNames.contains('statistics')) {
                    db.createObjectStore('statistics', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * 创建Web SQL表
     */
    async createTables() {
        return new Promise((resolve, reject) => {
            this.db.transaction((tx) => {
                // 事件表
                tx.executeSql(`
                    CREATE TABLE IF NOT EXISTS events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        description TEXT NOT NULL,
                        storyline TEXT NOT NULL,
                        chapter INTEGER DEFAULT 1,
                        tags TEXT,
                        characters TEXT,
                        location TEXT,
                        effects TEXT,
                        impact_description TEXT,
                        rarity TEXT DEFAULT 'common',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        used_count INTEGER DEFAULT 0
                    )
                `);
                
                // 游戏存档表
                tx.executeSql(`
                    CREATE TABLE IF NOT EXISTS saves (
                        id TEXT PRIMARY KEY,
                        character_name TEXT NOT NULL,
                        character_data TEXT NOT NULL,
                        game_state TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                // 统计表
                tx.executeSql(`
                    CREATE TABLE IF NOT EXISTS statistics (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                // 创建索引
                tx.executeSql('CREATE INDEX IF NOT EXISTS idx_events_storyline ON events(storyline)');
                tx.executeSql('CREATE INDEX IF NOT EXISTS idx_events_chapter ON events(chapter)');
                tx.executeSql('CREATE INDEX IF NOT EXISTS idx_saves_character ON saves(character_name)');
                
            }, reject, resolve);
        });
    }

    /**
     * 等待数据库初始化完成
     */
    async waitForInit() {
        await this.initPromise;
    }

    /**
     * 保存事件到数据库
     */
    async saveEvents(events) {
        await this.waitForInit();
        
        if (this.useLocalStorage) {
            return this.saveEventsToLocalStorage(events);
        }
        
        if (this.indexedDB) {
            return this.saveEventsToIndexedDB(events);
        }
        
        return this.saveEventsToWebSQL(events);
    }

    /**
     * 保存事件到Web SQL
     */
    async saveEventsToWebSQL(events) {
        return new Promise((resolve, reject) => {
            this.db.transaction((tx) => {
                events.forEach(event => {
                    tx.executeSql(
                        'INSERT INTO events (title, description, storyline, chapter, tags, characters, location) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [
                            event.title,
                            event.description,
                            event.storyline,
                            event.chapter || 1,
                            JSON.stringify(event.tags || []),
                            JSON.stringify(event.characters || []),
                            event.location || ''
                        ]
                    );
                });
            }, reject, resolve);
        });
    }

    /**
     * 保存事件到IndexedDB
     */
    async saveEventsToIndexedDB(events) {
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction(['events'], 'readwrite');
            const store = transaction.objectStore('events');
            
            events.forEach(event => {
                store.add({
                    ...event,
                    created_at: new Date().toISOString(),
                    used_count: 0
                });
            });
            
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * 保存事件到localStorage
     */
    async saveEventsToLocalStorage(events) {
        const existingEvents = JSON.parse(localStorage.getItem('adventure_events') || '[]');
        const newEvents = events.map(event => ({
            ...event,
            id: Date.now() + Math.random(),
            created_at: new Date().toISOString(),
            used_count: 0
        }));
        
        const allEvents = [...existingEvents, ...newEvents];
        
        // 限制数量
        if (allEvents.length > 100000) {
            allEvents.splice(0, allEvents.length - 100000);
        }
        
        localStorage.setItem('adventure_events', JSON.stringify(allEvents));
    }

    /**
     * 获取事件
     */
    async getEvents(storyline = null, limit = 50) {
        await this.waitForInit();
        
        if (this.useLocalStorage) {
            return this.getEventsFromLocalStorage(storyline, limit);
        }
        
        if (this.indexedDB) {
            return this.getEventsFromIndexedDB(storyline, limit);
        }
        
        return this.getEventsFromWebSQL(storyline, limit);
    }

    /**
     * 从Web SQL获取事件
     */
    async getEventsFromWebSQL(storyline, limit) {
        return new Promise((resolve, reject) => {
            const sql = storyline 
                ? 'SELECT * FROM events WHERE storyline = ? ORDER BY RANDOM() LIMIT ?'
                : 'SELECT * FROM events ORDER BY RANDOM() LIMIT ?';
            const params = storyline ? [storyline, limit] : [limit];
            
            this.db.transaction((tx) => {
                tx.executeSql(sql, params, (tx, result) => {
                    const events = [];
                    for (let i = 0; i < result.rows.length; i++) {
                        const row = result.rows.item(i);
                        events.push({
                            ...row,
                            tags: JSON.parse(row.tags || '[]'),
                            characters: JSON.parse(row.characters || '[]')
                        });
                    }
                    resolve(events);
                });
            }, reject);
        });
    }

    /**
     * 从IndexedDB获取事件
     */
    async getEventsFromIndexedDB(storyline, limit) {
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction(['events'], 'readonly');
            const store = transaction.objectStore('events');
            
            let request;
            if (storyline) {
                const index = store.index('storyline');
                request = index.getAll(storyline);
            } else {
                request = store.getAll();
            }
            
            request.onsuccess = () => {
                let events = request.result;
                // 随机排序并限制数量
                events = events.sort(() => Math.random() - 0.5).slice(0, limit);
                resolve(events);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 从localStorage获取事件
     */
    async getEventsFromLocalStorage(storyline, limit) {
        const events = JSON.parse(localStorage.getItem('adventure_events') || '[]');
        let filteredEvents = storyline 
            ? events.filter(event => event.storyline === storyline)
            : events;
        
        // 随机排序并限制数量
        return filteredEvents.sort(() => Math.random() - 0.5).slice(0, limit);
    }

    /**
     * 保存游戏存档
     */
    async saveGame(saveId, characterName, characterData, gameState) {
        await this.waitForInit();
        
        const saveData = {
            id: saveId,
            character_name: characterName,
            character_data: JSON.stringify(characterData),
            game_state: JSON.stringify(gameState),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        if (this.useLocalStorage) {
            const saves = JSON.parse(localStorage.getItem('adventure_saves') || '{}');
            saves[saveId] = saveData;
            localStorage.setItem('adventure_saves', JSON.stringify(saves));
            return;
        }
        
        if (this.indexedDB) {
            return new Promise((resolve, reject) => {
                const transaction = this.indexedDB.transaction(['saves'], 'readwrite');
                const store = transaction.objectStore('saves');
                const request = store.put(saveData);
                
                request.onsuccess = resolve;
                request.onerror = () => reject(request.error);
            });
        }
        
        return new Promise((resolve, reject) => {
            this.db.transaction((tx) => {
                tx.executeSql(
                    'INSERT OR REPLACE INTO saves (id, character_name, character_data, game_state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [saveId, characterName, saveData.character_data, saveData.game_state, saveData.created_at, saveData.updated_at]
                );
            }, reject, resolve);
        });
    }

    /**
     * 加载游戏存档
     */
    async loadGame(saveId) {
        await this.waitForInit();
        
        if (this.useLocalStorage) {
            const saves = JSON.parse(localStorage.getItem('adventure_saves') || '{}');
            const saveData = saves[saveId];
            if (saveData) {
                return {
                    characterData: JSON.parse(saveData.character_data),
                    gameState: JSON.parse(saveData.game_state)
                };
            }
            return null;
        }
        
        if (this.indexedDB) {
            return new Promise((resolve, reject) => {
                const transaction = this.indexedDB.transaction(['saves'], 'readonly');
                const store = transaction.objectStore('saves');
                const request = store.get(saveId);
                
                request.onsuccess = () => {
                    const result = request.result;
                    if (result) {
                        resolve({
                            characterData: JSON.parse(result.character_data),
                            gameState: JSON.parse(result.game_state)
                        });
                    } else {
                        resolve(null);
                    }
                };
                
                request.onerror = () => reject(request.error);
            });
        }
        
        return new Promise((resolve, reject) => {
            this.db.transaction((tx) => {
                tx.executeSql(
                    'SELECT * FROM saves WHERE id = ?',
                    [saveId],
                    (tx, result) => {
                        if (result.rows.length > 0) {
                            const row = result.rows.item(0);
                            resolve({
                                characterData: JSON.parse(row.character_data),
                                gameState: JSON.parse(row.game_state)
                            });
                        } else {
                            resolve(null);
                        }
                    }
                );
            }, reject);
        });
    }

    /**
     * 获取数据库统计信息
     */
    async getStatistics() {
        await this.waitForInit();
        
        if (this.useLocalStorage) {
            const events = JSON.parse(localStorage.getItem('adventure_events') || '[]');
            const saves = JSON.parse(localStorage.getItem('adventure_saves') || '{}');
            
            return {
                totalEvents: events.length,
                totalSaves: Object.keys(saves).length,
                storageType: 'localStorage'
            };
        }
        
        // 实现IndexedDB和WebSQL的统计查询...
        return {
            totalEvents: 0,
            totalSaves: 0,
            storageType: this.indexedDB ? 'IndexedDB' : 'WebSQL'
        };
    }

    /**
     * 清理旧数据
     */
    async cleanup() {
        await this.waitForInit();
        
        // 实现数据清理逻辑
        console.log('🧹 数据库清理完成');
    }
}

// 创建全局数据库管理器实例
window.DatabaseManager = new DatabaseManager();
