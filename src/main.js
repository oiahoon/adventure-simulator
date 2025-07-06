/**
 * 游戏主入口文件
 * 初始化游戏引擎和相关系统
 */

// 全局游戏引擎实例
let gameEngine = null;

/**
 * 页面加载完成后初始化游戏
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎮 冒险模拟器启动中...');
    
    try {
        // 初始化数据库
        await window.DatabaseManager.waitForInit();
        console.log('💾 数据库初始化完成');
        
        // 初始化游戏引擎
        gameEngine = new GameEngine();
        
        // 检查是否有自动保存的游戏
        await checkAndRestoreProgress();
        
        // 显示欢迎信息
        if (!gameEngine.gameState) {
            showWelcomeMessage();
        }
        
        // 预加载生成的事件
        if (window.GeneratedEventLoader) {
            await window.GeneratedEventLoader.preloadEvents();
        }
        
        console.log('✅ 游戏初始化完成');
        
    } catch (error) {
        console.error('❌ 游戏初始化失败:', error);
        showErrorMessage('游戏初始化失败，请刷新页面重试。');
    }
});

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
    document.addEventListener('keydown', function(e) {
        // Ctrl + D: 显示调试信息
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            if (gameEngine && gameEngine.gameState) {
                console.log('🔍 当前游戏状态:', gameEngine.gameState);
                console.log('👤 角色信息:', gameEngine.gameState.character.getFullInfo());
                console.log('💾 存储使用情况:', window.ProgressManager.getStorageUsage());
                console.log('📊 数据库统计:', await window.DatabaseManager.getStatistics());
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
