/**
 * 游戏进度持久化管理器
 * 确保用户在同设备同浏览器重新打开页面能继续游戏
 */
class ProgressManager {
    constructor() {
        this.autoSaveKey = 'adventure_auto_save';
        this.settingsKey = 'adventure_settings';
        this.autoSaveInterval = 30000; // 30秒自动保存
        this.autoSaveTimer = null;
        this.lastSaveTime = 0;
        
        console.log('💾 进度管理器初始化完成');
    }

    /**
     * 开始自动保存
     */
    startAutoSave(gameEngine) {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            if (gameEngine && gameEngine.gameState && gameEngine.isRunning) {
                this.autoSave(gameEngine);
            }
        }, this.autoSaveInterval);
        
        console.log('🔄 自动保存已启动');
    }

    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        
        console.log('⏹️ 自动保存已停止');
    }

    /**
     * 自动保存游戏状态
     */
    async autoSave(gameEngine) {
        try {
            const now = Date.now();
            
            // 避免过于频繁的保存
            if (now - this.lastSaveTime < 10000) {
                return;
            }
            
            const saveData = this.createSaveData(gameEngine);
            
            // 保存到localStorage
            localStorage.setItem(this.autoSaveKey, JSON.stringify(saveData));
            
            // 保存到数据库
            if (window.DatabaseManager) {
                await window.DatabaseManager.saveGame(
                    'auto_save',
                    gameEngine.gameState.character.name,
                    gameEngine.gameState.character,
                    gameEngine.gameState
                );
            }
            
            this.lastSaveTime = now;
            
            // 在UI中显示保存提示
            if (window.gameEngine && window.gameEngine.uiManager) {
                await window.gameEngine.uiManager.addLogEntry('system', '💾 游戏已自动保存');
            }
            
            console.log('💾 游戏已自动保存');
            
        } catch (error) {
            console.error('❌ 自动保存失败:', error);
        }
    }

    /**
     * 创建保存数据
     */
    createSaveData(gameEngine) {
        const gameState = gameEngine.gameState;
        
        return {
            version: '1.0',
            timestamp: Date.now(),
            character: {
                name: gameState.character.name,
                profession: gameState.character.profession,
                storyline: gameState.character.storyline,
                level: gameState.character.level,
                experience: gameState.character.experience,
                attributes: { ...gameState.character.attributes },
                personality: { ...gameState.character.personality },
                social: { ...gameState.character.social },
                status: { ...gameState.character.status },
                equipment: { ...gameState.character.equipment },
                inventory: [...gameState.character.inventory],
                skills: [...gameState.character.skills],
                achievements: [...gameState.character.achievements],
                relationships: Object.fromEntries(gameState.character.relationships)
            },
            gameState: {
                currentLocation: gameState.currentLocation,
                gameTime: gameState.gameTime,
                eventHistory: [...gameState.eventHistory],
                achievements: [...gameState.achievements],
                statistics: { ...gameState.statistics },
                currentChapter: gameState.currentChapter || 1,
                storyProgress: gameState.storyProgress || {}
            },
            gameSettings: {
                useAIGeneration: gameEngine.eventSystem.useAIGeneration,
                aiGenerationRate: gameEngine.eventSystem.aiGenerationRate,
                useGeneratedEvents: gameEngine.eventSystem.useGeneratedEvents,
                generatedEventRate: gameEngine.eventSystem.generatedEventRate,
                gameSpeed: gameEngine.gameSpeed
            }
        };
    }

    /**
     * 检查是否有自动保存的游戏
     */
    hasAutoSave() {
        try {
            const saveData = localStorage.getItem(this.autoSaveKey);
            return saveData !== null;
        } catch (error) {
            console.error('检查自动保存失败:', error);
            return false;
        }
    }

    /**
     * 加载自动保存的游戏
     */
    async loadAutoSave() {
        try {
            const saveData = localStorage.getItem(this.autoSaveKey);
            if (!saveData) {
                return null;
            }
            
            const data = JSON.parse(saveData);
            
            // 验证保存数据的完整性
            if (!this.validateSaveData(data)) {
                console.warn('⚠️ 自动保存数据不完整，忽略');
                return null;
            }
            
            console.log('📂 加载自动保存的游戏');
            return data;
            
        } catch (error) {
            console.error('❌ 加载自动保存失败:', error);
            return null;
        }
    }

    /**
     * 验证保存数据的完整性
     */
    validateSaveData(data) {
        if (!data || !data.character || !data.gameState) {
            return false;
        }
        
        const character = data.character;
        const requiredFields = ['name', 'profession', 'level', 'attributes', 'status'];
        
        for (const field of requiredFields) {
            if (!character[field]) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * 从保存数据恢复游戏
     */
    async restoreGame(gameEngine, saveData) {
        try {
            // 重建角色对象
            const characterData = saveData.character;
            const character = new Character(
                characterData.name,
                characterData.profession,
                characterData.attributes,
                characterData.storyline
            );
            
            // 恢复角色状态
            character.level = characterData.level;
            character.experience = characterData.experience;
            Object.assign(character.personality, characterData.personality);
            Object.assign(character.social, characterData.social);
            Object.assign(character.status, characterData.status);
            Object.assign(character.equipment, characterData.equipment);
            character.inventory = [...characterData.inventory];
            character.skills = [...characterData.skills];
            character.achievements = [...characterData.achievements];
            
            // 恢复人际关系
            if (characterData.relationships) {
                character.relationships = new Map(Object.entries(characterData.relationships));
            }
            
            // 重建游戏状态
            const gameState = new GameState(character);
            Object.assign(gameState, saveData.gameState);
            gameState.character = character;
            
            // 恢复游戏引擎状态
            gameEngine.gameState = gameState;
            
            // 恢复游戏设置
            if (saveData.gameSettings) {
                const settings = saveData.gameSettings;
                gameEngine.eventSystem.useAIGeneration = settings.useAIGeneration;
                gameEngine.eventSystem.aiGenerationRate = settings.aiGenerationRate;
                gameEngine.eventSystem.useGeneratedEvents = settings.useGeneratedEvents;
                gameEngine.eventSystem.generatedEventRate = settings.generatedEventRate;
                gameEngine.gameSpeed = settings.gameSpeed;
            }
            
            // 更新UI
            gameEngine.uiManager.updateAll(gameState);
            gameEngine.uiManager.addLogEntry('system', `欢迎回来，${character.name}！游戏进度已恢复。`);
            
            // 显示游戏界面
            document.getElementById('game-interface').classList.remove('hidden');
            gameEngine.enableGameControls();
            
            console.log('✅ 游戏进度恢复成功');
            return true;
            
        } catch (error) {
            console.error('❌ 恢复游戏失败:', error);
            return false;
        }
    }

    /**
     * 手动保存游戏
     */
    async manualSave(gameEngine, saveName = null) {
        try {
            if (!gameEngine || !gameEngine.gameState) {
                throw new Error('没有可保存的游戏状态');
            }
            
            const saveData = this.createSaveData(gameEngine);
            const saveId = saveName || `manual_${Date.now()}`;
            
            // 保存到localStorage
            const manualSaves = JSON.parse(localStorage.getItem('adventure_manual_saves') || '{}');
            manualSaves[saveId] = {
                ...saveData,
                saveName: saveName || `手动存档_${new Date().toLocaleString()}`
            };
            localStorage.setItem('adventure_manual_saves', JSON.stringify(manualSaves));
            
            // 保存到数据库
            if (window.DatabaseManager) {
                await window.DatabaseManager.saveGame(
                    saveId,
                    gameEngine.gameState.character.name,
                    gameEngine.gameState.character,
                    gameEngine.gameState
                );
            }
            
            await gameEngine.uiManager.addLogEntry('system', '💾 游戏已保存');
            console.log('💾 手动保存完成:', saveId);
            
            return saveId;
            
        } catch (error) {
            console.error('❌ 手动保存失败:', error);
            if (gameEngine && gameEngine.uiManager) {
                await gameEngine.uiManager.addLogEntry('system', '❌ 保存失败');
            }
            throw error;
        }
    }

    /**
     * 获取所有手动保存
     */
    getManualSaves() {
        try {
            const saves = JSON.parse(localStorage.getItem('adventure_manual_saves') || '{}');
            return Object.entries(saves).map(([id, data]) => ({
                id,
                name: data.saveName,
                characterName: data.character.name,
                level: data.character.level,
                storyline: data.character.storyline,
                timestamp: data.timestamp,
                gameTime: data.gameState.gameTime
            }));
        } catch (error) {
            console.error('获取手动保存列表失败:', error);
            return [];
        }
    }

    /**
     * 加载手动保存
     */
    async loadManualSave(saveId) {
        try {
            const saves = JSON.parse(localStorage.getItem('adventure_manual_saves') || '{}');
            const saveData = saves[saveId];
            
            if (!saveData) {
                throw new Error('存档不存在');
            }
            
            return saveData;
            
        } catch (error) {
            console.error('加载手动保存失败:', error);
            throw error;
        }
    }

    /**
     * 删除存档
     */
    deleteSave(saveId) {
        try {
            const saves = JSON.parse(localStorage.getItem('adventure_manual_saves') || '{}');
            delete saves[saveId];
            localStorage.setItem('adventure_manual_saves', JSON.stringify(saves));
            
            console.log('🗑️ 存档已删除:', saveId);
            
        } catch (error) {
            console.error('删除存档失败:', error);
            throw error;
        }
    }

    /**
     * 清除自动保存
     */
    clearAutoSave() {
        try {
            localStorage.removeItem(this.autoSaveKey);
            console.log('🗑️ 自动保存已清除');
        } catch (error) {
            console.error('清除自动保存失败:', error);
        }
    }

    /**
     * 保存游戏设置
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            console.log('⚙️ 游戏设置已保存');
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }

    /**
     * 加载游戏设置
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('加载设置失败:', error);
            return null;
        }
    }

    /**
     * 获取存储使用情况
     */
    getStorageUsage() {
        try {
            let totalSize = 0;
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith('adventure_')) {
                    totalSize += localStorage[key].length;
                }
            }
            
            return {
                used: totalSize,
                usedMB: (totalSize / 1024 / 1024).toFixed(2),
                keys: Object.keys(localStorage).filter(key => key.startsWith('adventure_')).length
            };
            
        } catch (error) {
            console.error('获取存储使用情况失败:', error);
            return { used: 0, usedMB: '0.00', keys: 0 };
        }
    }
}

// 创建全局进度管理器实例
window.ProgressManager = new ProgressManager();
