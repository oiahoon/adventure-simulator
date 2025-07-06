/**
 * 游戏主入口文件
 * 简化版本，专注于基本功能
 */

// 全局游戏引擎实例
let gameEngine = null;

/**
 * 页面加载完成后初始化游戏
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎮 冒险模拟器启动中...');
    
    try {
        // 等待脚本加载完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 检查必要的类是否存在，最多等待5秒
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            if (typeof GameEngine !== 'undefined' && 
                typeof Character !== 'undefined' && 
                typeof UIManager !== 'undefined') {
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // 检查核心类
        const missingClasses = [];
        if (typeof GameEngine === 'undefined') missingClasses.push('GameEngine');
        if (typeof Character === 'undefined') missingClasses.push('Character');
        if (typeof UIManager === 'undefined') missingClasses.push('UIManager');
        
        if (missingClasses.length > 0) {
            console.error('❌ 缺少必要的类:', missingClasses.join(', '));
            showErrorMessage(`缺少必要的类: ${missingClasses.join(', ')}`);
            return;
        }
        
        // 检查可选类
        const optionalClasses = [];
        if (typeof AIEventGenerator === 'undefined') optionalClasses.push('AIEventGenerator');
        if (typeof EventSystem === 'undefined') optionalClasses.push('EventSystem');
        
        if (optionalClasses.length > 0) {
            console.warn('⚠️ 可选类未加载:', optionalClasses.join(', '));
        }
        
        console.log('✅ 核心类检查完成');
        
        // 初始化游戏引擎
        gameEngine = new GameEngine();
        window.gameEngine = gameEngine; // 全局访问
        console.log('✅ 游戏引擎初始化完成');
        
        // 尝试自动加载游戏
        await tryAutoLoadGame();
        
        // 显示欢迎信息
        showWelcomeMessage();
        
        console.log('✅ 游戏初始化完成');
        
    } catch (error) {
        console.error('❌ 游戏初始化失败:', error);
        showErrorMessage('游戏初始化失败：' + error.message);
    }
});

/**
 * 显示欢迎信息
 */
function showWelcomeMessage() {
    const logContent = document.getElementById('log-content');
    if (logContent) {
        // 清空现有内容
        logContent.innerHTML = '';
        
        // 添加欢迎消息
        const welcomeMessages = [
            '🎮 欢迎来到冒险模拟器！',
            '这是一个AI驱动的文字冒险游戏。',
            '✨ 特色功能：',
            '• 5种主线剧情：仙侠修真、玄幻奇缘、科幻未来、武侠江湖、西幻冒险',
            '• 6种职业选择，每种都有独特体验',
            '• AI生成的无限事件内容',
            '• 智能的角色成长系统',
            '• 自动保存游戏进度',
            '🚀 点击"新游戏"开始你的冒险之旅！'
        ];
        
        welcomeMessages.forEach((message, index) => {
            setTimeout(() => {
                const entry = document.createElement('p');
                entry.className = 'log-entry system';
                entry.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span class="log-message">${message}</span>`;
                entry.style.opacity = '0';
                entry.style.transform = 'translateY(10px)';
                
                logContent.appendChild(entry);
                
                // 淡入动画
                setTimeout(() => {
                    entry.style.transition = 'all 0.5s ease';
                    entry.style.opacity = '1';
                    entry.style.transform = 'translateY(0)';
                }, 50);
                
                // 自动滚动
                setTimeout(() => {
                    logContent.scrollTop = logContent.scrollHeight;
                }, 100);
                
            }, index * 800);
        });
    }
}

/**
 * 显示错误信息
 */
function showErrorMessage(message) {
    const logContent = document.getElementById('log-content');
    if (logContent) {
        logContent.innerHTML = `<p class="log-entry error">❌ ${message}</p>`;
    } else {
        alert(message);
    }
}

/**
 * 页面卸载前保存游戏状态
 */
window.addEventListener('beforeunload', function(e) {
    if (gameEngine && gameEngine.gameState && gameEngine.isRunning) {
        // 尝试自动保存游戏
        try {
            if (window.ProgressManager) {
                window.ProgressManager.autoSave(gameEngine);
            }
            console.log('💾 游戏已自动保存');
        } catch (error) {
            console.error('自动保存失败:', error);
        }
    }
});

/**
 * 全局错误处理
 */
window.addEventListener('error', function(e) {
    console.error('🚨 全局错误:', e.error);
    console.error('📁 文件:', e.filename);
    console.error('📍 位置:', e.lineno + ':' + e.colno);
    
    // 显示用户友好的错误信息
    const errorMsg = `JavaScript错误: ${e.message}\n文件: ${e.filename}\n行号: ${e.lineno}`;
    showErrorMessage('游戏运行时发生错误，请查看控制台获取详细信息。');
});

/**
 * 导出全局函数供其他模块使用
 */
window.GameApp = {
    getGameEngine: () => gameEngine,
    restart: () => {
        if (gameEngine) {
            gameEngine.endGame();
            if (window.ProgressManager) {
                window.ProgressManager.clearAutoSave();
            }
            location.reload();
        }
    }
};

console.log('📜 主脚本加载完成');

/**
 * 尝试自动加载游戏
 */
async function tryAutoLoadGame() {
    try {
        if (window.DatabaseManager) {
            await window.DatabaseManager.waitForInit();
            const savedGame = await window.DatabaseManager.loadGame();
            if (savedGame && savedGame.character) {
                console.log('🔄 发现保存的游戏，尝试加载...');
                
                // 重建角色对象
                const character = new Character(
                    savedGame.character.name,
                    savedGame.character.profession,
                    savedGame.character.attributes,
                    savedGame.character.storyline
                );
                
                // 恢复角色状态
                Object.assign(character, savedGame.character);
                
                // 重建游戏状态 - 使用GameEngine中的GameState类
                const gameState = new gameEngine.constructor.GameState(character);
                gameState.gameTime = savedGame.gameTime || 0;
                gameState.eventHistory = savedGame.eventHistory || [];
                gameState.achievements = savedGame.achievements || [];
                gameState.statistics = savedGame.statistics || {};
                gameState.currentLocation = savedGame.currentLocation || '新手村';
                
                // 设置游戏状态
                gameEngine.gameState = gameState;
                
                // 显示游戏界面
                document.getElementById('character-creation').classList.add('hidden');
                document.getElementById('game-interface').classList.remove('hidden');
                
                // 启用控制按钮
                gameEngine.enableGameControls();
                
                // 重置UI管理器的游戏开始时间
                gameEngine.uiManager.gameStartTime = Date.now() - (gameState.gameTime * 1000);
                
                // 更新UI
                gameEngine.uiManager.updateAll(gameState);
                await gameEngine.uiManager.addLogEntry('system', '🔄 游戏已自动加载，欢迎回来！');
                
                // 恢复事件历史到日志
                if (gameState.eventHistory && gameState.eventHistory.length > 0) {
                    await gameEngine.uiManager.addLogEntry('system', `📚 恢复了 ${gameState.eventHistory.length} 个历史事件`);
                }
                
                console.log('✅ 游戏自动加载成功');
                return true;
            }
        }
    } catch (error) {
        console.warn('⚠️ 自动加载游戏失败:', error.message);
    }
    return false;
}

/**
 * 检查并恢复游戏进度
 */
async function checkAndRestoreProgress() {
    try {
        if (window.ProgressManager && window.ProgressManager.hasAutoSave()) {
            const shouldRestore = confirm('检测到之前的游戏进度，是否继续上次的游戏？');
            
            if (shouldRestore) {
                const saveData = await window.ProgressManager.loadAutoSave();
                if (saveData) {
                    const restored = await window.ProgressManager.restoreGame(gameEngine, saveData);
                    if (restored) {
                        // 开始自动保存
                        window.ProgressManager.startAutoSave(gameEngine);
                        
                        // 开始游戏循环
                        gameEngine.isRunning = true;
                        gameEngine.startGameLoop();
                        
                        console.log('✅ 游戏进度恢复成功');
                        return;
                    }
                }
            } else {
                // 用户选择不恢复，清除自动保存
                window.ProgressManager.clearAutoSave();
            }
        }
    } catch (error) {
        console.error('恢复游戏进度失败:', error);
    }
}

/**
 * 显示欢迎信息
 */
function showWelcomeMessage() {
    const logContent = document.getElementById('log-content');
    if (logContent) {
        // 清空现有内容
        logContent.innerHTML = '';
        
        // 添加欢迎消息
        const welcomeMessages = [
            '🎮 欢迎来到冒险模拟器！',
            '这是一个AI驱动的文字冒险游戏。',
            '✨ 特色功能：',
            '• 5种主线剧情：仙侠修真、玄幻奇缘、科幻未来、武侠江湖、西幻冒险',
            '• 6种职业选择，每种都有独特体验',
            '• AI生成的无限事件内容',
            '• 智能的角色成长系统',
            '• 自动保存游戏进度',
            '🚀 点击"新游戏"开始你的冒险之旅！'
        ];
        
        welcomeMessages.forEach((message, index) => {
            setTimeout(() => {
                const entry = document.createElement('p');
                entry.className = 'log-entry system';
                entry.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span class="log-message">${message}</span>`;
                entry.style.opacity = '0';
                entry.style.transform = 'translateY(10px)';
                
                logContent.appendChild(entry);
                
                // 淡入动画
                setTimeout(() => {
                    entry.style.transition = 'all 0.5s ease';
                    entry.style.opacity = '1';
                    entry.style.transform = 'translateY(0)';
                }, 50);
                
                // 自动滚动
                setTimeout(() => {
                    logContent.scrollTop = logContent.scrollHeight;
                }, 100);
                
            }, index * 800);
        });
    }
}

/**
 * 显示错误信息
 */
function showErrorMessage(message) {
    const logContent = document.getElementById('log-content');
    if (logContent) {
        logContent.innerHTML = `<p class="log-entry error">❌ ${message}</p>`;
    } else {
        alert(message);
    }
}

/**
 * 页面卸载前保存游戏状态
 */
window.addEventListener('beforeunload', function(e) {
    if (gameEngine && gameEngine.gameState && gameEngine.isRunning) {
        // 自动保存游戏
        try {
            if (window.ProgressManager) {
                window.ProgressManager.autoSave(gameEngine);
            }
            console.log('💾 游戏已自动保存');
        } catch (error) {
            console.error('自动保存失败:', error);
        }
    }
});

/**
 * 处理页面可见性变化
 */
document.addEventListener('visibilitychange', function() {
    if (gameEngine && gameEngine.isRunning) {
        if (document.hidden) {
            // 页面隐藏时暂停游戏
            if (!gameEngine.isPaused) {
                gameEngine.togglePause();
                console.log('⏸️ 页面隐藏，游戏已暂停');
            }
        } else {
            // 页面显示时可以选择继续游戏
            if (gameEngine.isPaused) {
                setTimeout(() => {
                    if (confirm('页面重新激活，是否继续游戏？')) {
                        gameEngine.togglePause();
                        console.log('▶️ 游戏已继续');
                    }
                }, 500);
            }
        }
    }
});

/**
 * 全局错误处理
 */
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
    showErrorMessage('游戏运行时发生错误，请检查控制台获取详细信息。');
});

/**
 * 调试功能（仅在开发环境中使用）
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // 添加调试快捷键
    document.addEventListener('keydown', async function(e) {
        // Ctrl + D: 显示调试信息
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            if (gameEngine && gameEngine.gameState) {
                console.log('🔍 当前游戏状态:', gameEngine.gameState);
                console.log('👤 角色信息:', gameEngine.gameState.character.getFullInfo());
                console.log('💾 存储使用情况:', window.ProgressManager.getStorageUsage());
                try {
                    const dbStats = await window.DatabaseManager.getStatistics();
                    console.log('📊 数据库统计:', dbStats);
                } catch (error) {
                    console.log('📊 数据库统计获取失败:', error);
                }
            }
        }
        
        // Ctrl + S: 快速保存
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (gameEngine && window.ProgressManager) {
                window.ProgressManager.manualSave(gameEngine);
            }
        }
        
        // Ctrl + L: 快速加载
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            if (gameEngine && window.ProgressManager) {
                checkAndRestoreProgress();
            }
        }
        
        // 空格键: 暂停/继续
        if (e.code === 'Space' && gameEngine && gameEngine.isRunning) {
            e.preventDefault();
            gameEngine.togglePause();
        }
    });
    
    // 添加调试面板
    addDebugPanel();
}

/**
 * 添加调试面板（开发环境）
 */
function addDebugPanel() {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: var(--text-primary);
        padding: 15px;
        border-radius: var(--radius-md);
        font-family: 'Courier New', monospace;
        font-size: 12px;
        z-index: 9999;
        max-width: 350px;
        display: none;
        border: 1px solid var(--border-glow);
        box-shadow: var(--shadow-glow);
    `;
    
    document.body.appendChild(debugPanel);
    
    // 切换调试面板显示
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12') {
            e.preventDefault();
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        }
    });
    
    // 定期更新调试信息
    setInterval(async function() {
        if (debugPanel.style.display === 'block' && gameEngine && gameEngine.gameState) {
            const character = gameEngine.gameState.character;
            const storage = window.ProgressManager.getStorageUsage();
            
            debugPanel.innerHTML = `
                <strong style="color: var(--primary-color);">🔧 调试信息</strong><br>
                <strong>角色:</strong> ${character.name} (${character.getProfessionName()})<br>
                <strong>剧情:</strong> ${character.getStorylineName()}<br>
                <strong>等级:</strong> ${character.level} (${character.experience}/${character.getRequiredExperience()})<br>
                <strong>生命:</strong> ${character.status.hp}/${character.getMaxHP()}<br>
                <strong>魔法:</strong> ${character.status.mp}/${character.getMaxMP()}<br>
                <strong>修为:</strong> ${character.status.cultivation}<br>
                <strong>财富:</strong> ${character.status.wealth}<br>
                <strong>声望:</strong> ${character.social.reputation}<br>
                <strong>位置:</strong> ${gameEngine.gameState.currentLocation}<br>
                <strong>游戏时间:</strong> ${gameEngine.gameState.gameTime}<br>
                <strong>事件数:</strong> ${gameEngine.gameState.eventHistory.length}<br>
                <strong>存储:</strong> ${storage.usedMB}MB (${storage.keys}个键)<br>
                <br>
                <small style="color: var(--text-secondary);">快捷键:<br>
                Ctrl+D: 控制台调试<br>
                Ctrl+S: 保存游戏<br>
                Ctrl+L: 加载游戏<br>
                空格: 暂停/继续<br>
                F12: 切换调试面板</small>
            `;
        }
    }, 2000);
}

/**
 * 导出全局函数供其他模块使用
 */
window.GameApp = {
    getGameEngine: () => gameEngine,
    restart: () => {
        if (gameEngine) {
            gameEngine.endGame();
            window.ProgressManager.clearAutoSave();
            location.reload();
        }
    },
    saveGame: () => {
        if (gameEngine && window.ProgressManager) {
            return window.ProgressManager.manualSave(gameEngine);
        }
    },
    loadGame: () => {
        if (gameEngine && window.ProgressManager) {
            return checkAndRestoreProgress();
        }
    }
};
