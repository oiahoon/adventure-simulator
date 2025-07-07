/**
 * 游戏引擎核心类
 * 负责管理游戏的主要逻辑和状态
 */
class GameEngine {
    constructor() {
        this.gameState = null;
        this.isRunning = false;
        this.isPaused = false;
        this.gameSpeed = 1000; // 毫秒
        this.gameLoop = null;
        
        // 初始化子系统
        try {
            if (typeof EventSystem !== 'undefined') {
                this.eventSystem = new EventSystem();
                console.log('✅ EventSystem初始化成功');
            } else {
                console.error('❌ EventSystem类未定义');
                throw new Error('EventSystem类未加载');
            }
        } catch (error) {
            console.error('❌ EventSystem初始化失败:', error);
            throw error;
        }
        
        try {
            this.uiManager = new UIManager();
            console.log('✅ UIManager初始化成功');
        } catch (error) {
            console.error('❌ UIManager初始化失败:', error);
            throw error;
        }
        
        // 绑定事件
        this.bindEvents();
        
        console.log('🎮 游戏引擎初始化完成');
    }

    /**
     * 绑定UI事件
     */
    bindEvents() {
        console.log('🔗 开始绑定事件监听器...');
        
        // 新游戏按钮
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                console.log('🎮 新游戏按钮被点击');
                this.showCharacterCreation();
            });
            console.log('✅ 新游戏按钮事件绑定成功');
        } else {
            console.error('❌ 找不到新游戏按钮');
        }

        // 游戏控制按钮
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                console.log('⏸️ 暂停按钮被点击');
                this.togglePause();
            });
        }

        const stepBtn = document.getElementById('step-btn');
        if (stepBtn) {
            stepBtn.addEventListener('click', () => {
                console.log('⏭️ 单步按钮被点击');
                this.stepForward();
            });
        }

        const autoBtn = document.getElementById('auto-btn');
        if (autoBtn) {
            autoBtn.addEventListener('click', () => {
                console.log('🤖 自动按钮被点击');
                this.setAutoMode();
            });
        }

        const fastBtn = document.getElementById('fast-btn');
        if (fastBtn) {
            fastBtn.addEventListener('click', () => {
                console.log('⚡ 快速按钮被点击');
                this.setFastMode();
            });
        }

        // 速度滑块
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.setGameSpeed(parseInt(e.target.value));
            });
        }

        // 保存/加载
        const saveGameBtn = document.getElementById('save-game-btn');
        if (saveGameBtn) {
            saveGameBtn.addEventListener('click', () => {
                console.log('💾 保存游戏按钮被点击');
                if (window.ProgressManager && this.gameState) {
                    window.ProgressManager.manualSave(this);
                }
            });
        }

        const loadGameBtn = document.getElementById('load-game-btn');
        if (loadGameBtn) {
            loadGameBtn.addEventListener('click', () => {
                console.log('📁 加载游戏按钮被点击');
                this.loadGame();
            });
        }
        
        // 导出故事按钮
        const exportStoryBtn = document.getElementById('export-story-btn');
        if (exportStoryBtn) {
            exportStoryBtn.addEventListener('click', () => {
                console.log('📖 导出故事按钮被点击');
                if (this.gameState && this.gameState.character) {
                    this.uiManager.downloadStory(this.gameState.character);
                } else {
                    alert('请先开始游戏才能导出故事！');
                }
            });
        }
        
        console.log('🔗 事件监听器绑定完成');
    }

    /**
     * 显示角色创建界面
     */
    showCharacterCreation() {
        console.log('🎭 显示角色创建界面');
        const modal = document.getElementById('character-creation');
        if (modal) {
            modal.classList.remove('hidden');
            console.log('✅ 角色创建模态框已显示');
            
            // 初始化角色创建逻辑
            this.initCharacterCreation();
        } else {
            console.error('❌ 找不到角色创建模态框');
        }
    }

    /**
     * 初始化角色创建
     */
    initCharacterCreation() {
        let selectedProfession = null;
        let attributes = {
            strength: 10,
            intelligence: 10,
            dexterity: 10,
            constitution: 10,
            charisma: 10,
            luck: 10
        };
        let remainingPoints = 10;

        // 职业选择
        const professionCards = document.querySelectorAll('.profession-card');
        professionCards.forEach(card => {
            card.addEventListener('click', () => {
                // 移除其他选中状态
                professionCards.forEach(c => c.classList.remove('selected'));
                // 添加选中状态
                card.classList.add('selected');
                selectedProfession = card.dataset.profession;
                
                // 重置属性并应用职业加成
                this.resetAttributes();
                this.applyProfessionBonus(selectedProfession);
                
                console.log('✅ 选择职业:', selectedProfession);
            });
        });

        // 属性分配按钮
        const attrButtons = document.querySelectorAll('.attr-btn');
        attrButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const attr = btn.dataset.attr;
                const action = btn.dataset.action;
                
                if (action === 'increase' && remainingPoints > 0 && attributes[attr] < 20) {
                    attributes[attr]++;
                    remainingPoints--;
                } else if (action === 'decrease' && attributes[attr] > 5) {
                    attributes[attr]--;
                    remainingPoints++;
                }
                
                this.updateAttributeDisplay(attributes, remainingPoints);
            });
        });

        // 创建角色按钮
        const createBtn = document.getElementById('create-character-btn');
        if (createBtn) {
            createBtn.addEventListener('click', async () => {
                const name = document.getElementById('character-name').value.trim();
                
                if (!name) {
                    alert('请输入角色名称');
                    return;
                }
                
                if (!selectedProfession) {
                    alert('请选择职业');
                    return;
                }
                
                console.log('🎮 开始创建角色:', { name, profession: selectedProfession, attributes });
                
                // 创建角色时不传入storyline，让Character类自动分配
                await this.createCharacter(name, selectedProfession, attributes);
            });
        }

        // 取消按钮
        const cancelBtn = document.getElementById('cancel-creation-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.getElementById('character-creation').classList.add('hidden');
            });
        }
        
        console.log('🎭 角色创建界面初始化完成（剧情将根据角色名字自动分配）');
    }

    /**
     * 添加剧情选择界面
     */
    addStorylineSelection() {
        const characterForm = document.querySelector('.character-form');
        if (!characterForm) {
            console.error('❌ 找不到 character-form 元素');
            return;
        }
        
        const professionGroup = characterForm.querySelector('.form-group:nth-child(2)');
        if (!professionGroup) {
            console.error('❌ 找不到职业选择组');
            return;
        }
        
        // 检查是否已经添加过剧情选择
        if (characterForm.querySelector('.storyline-grid')) {
            console.log('剧情选择已存在，跳过添加');
            return;
        }
        
        const storylineGroup = document.createElement('div');
        storylineGroup.className = 'form-group';
        storylineGroup.innerHTML = `
            <label>选择主线剧情:</label>
            <div class="storyline-grid">
                <div class="storyline-card selected" data-storyline="xianxia">
                    <div class="storyline-icon">⚔️</div>
                    <h3>仙侠修真</h3>
                    <p>踏上修仙之路，追求长生不老的传说</p>
                    <div class="storyline-themes">
                        <span>修炼</span>
                        <span>仙人</span>
                        <span>法宝</span>
                    </div>
                </div>
                <div class="storyline-card" data-storyline="xuanhuan">
                    <div class="storyline-icon">🔮</div>
                    <h3>玄幻奇缘</h3>
                    <p>在神秘的玄幻世界中探索无尽奥秘</p>
                    <div class="storyline-themes">
                        <span>魔法</span>
                        <span>异兽</span>
                        <span>神器</span>
                    </div>
                </div>
                <div class="storyline-card" data-storyline="scifi">
                    <div class="storyline-icon">🚀</div>
                    <h3>科幻未来</h3>
                    <p>探索未来科技的无限可能性</p>
                    <div class="storyline-themes">
                        <span>星际</span>
                        <span>机甲</span>
                        <span>AI</span>
                    </div>
                </div>
                <div class="storyline-card" data-storyline="wuxia">
                    <div class="storyline-icon">🗡️</div>
                    <h3>武侠江湖</h3>
                    <p>行走江湖，快意恩仇的侠客人生</p>
                    <div class="storyline-themes">
                        <span>武功</span>
                        <span>江湖</span>
                        <span>侠客</span>
                    </div>
                </div>
                <div class="storyline-card" data-storyline="fantasy">
                    <div class="storyline-icon">🏰</div>
                    <h3>西幻冒险</h3>
                    <p>在魔法与剑的世界中书写传奇</p>
                    <div class="storyline-themes">
                        <span>魔法</span>
                        <span>龙族</span>
                        <span>骑士</span>
                    </div>
                </div>
            </div>
        `;
        
        try {
            characterForm.insertBefore(storylineGroup, professionGroup);
            console.log('✅ 剧情选择界面添加成功');
        } catch (error) {
            console.error('❌ 添加剧情选择界面失败:', error);
        }
    }

    /**
     * 重置属性
     */
    resetAttributes() {
        const baseAttributes = {
            strength: 10,
            intelligence: 10,
            dexterity: 10,
            constitution: 10,
            charisma: 10,
            luck: 10
        };
        
        Object.keys(baseAttributes).forEach(attr => {
            document.getElementById(`${attr}-value`).textContent = baseAttributes[attr];
        });
        
        document.getElementById('remaining-points').textContent = '10';
    }

    /**
     * 应用职业加成
     */
    applyProfessionBonus(profession) {
        const bonuses = {
            warrior: { strength: 3, constitution: 2 },
            mage: { intelligence: 3, charisma: 2 },
            rogue: { dexterity: 3, luck: 2 },
            priest: { charisma: 3, intelligence: 2 },
            ranger: { dexterity: 2, constitution: 2, intelligence: 1 },
            noble: { charisma: 3, luck: 2 }
        };

        const bonus = bonuses[profession];
        if (bonus) {
            Object.keys(bonus).forEach(attr => {
                const currentValue = parseInt(document.getElementById(`${attr}-value`).textContent);
                document.getElementById(`${attr}-value`).textContent = currentValue + bonus[attr];
            });
        }
    }

    /**
     * 更新属性显示
     */
    updateAttributeDisplay(attributes, remainingPoints) {
        Object.keys(attributes).forEach(attr => {
            document.getElementById(`${attr}-value`).textContent = attributes[attr];
        });
        document.getElementById('remaining-points').textContent = remainingPoints;
        
        // 更新按钮状态
        document.querySelectorAll('.attr-btn').forEach(btn => {
            const attr = btn.dataset.attr;
            const action = btn.dataset.action;
            
            if (action === 'increase') {
                btn.disabled = remainingPoints <= 0 || attributes[attr] >= 20;
            } else {
                btn.disabled = attributes[attr] <= 5;
            }
        });
    }

    /**
     * 创建角色并开始游戏
     */
    async createCharacter(name, profession, attributes) {
        // 创建角色（剧情将自动分配）
        const character = new Character(name, profession, attributes);
        
        // 初始化游戏状态
        this.gameState = new GameState(character);
        
        // 隐藏角色创建界面，显示游戏界面
        document.getElementById('character-creation').classList.add('hidden');
        document.getElementById('game-interface').classList.remove('hidden');
        
        // 启用控制按钮
        this.enableGameControls();
        
        // 更新UI
        this.uiManager.updateCharacterDisplay(character);
        await this.uiManager.addLogEntry('system', `${name}开始了${character.getStorylineName()}的冒险之旅！`);
        await this.uiManager.addLogEntry('system', `🎭 系统根据角色名字自动分配了"${character.getStorylineName()}"剧情`);
        
        // 开始自动保存
        if (window.ProgressManager) {
            window.ProgressManager.startAutoSave(this);
        }
        
        // 开始游戏
        this.startGame();
        
        console.log('🎭 角色创建完成:', character);
    }

    /**
     * 启用游戏控制
     */
    enableGameControls() {
        const controlButtons = ['pause-btn', 'step-btn', 'auto-btn', 'fast-btn', 'save-game-btn', 'export-story-btn'];
        controlButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = false;
            }
        });
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.disabled = false;
        }
    }

    /**
     * 开始游戏
     */
    startGame() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        
        // 触发第一个事件
        this.eventSystem.triggerRandomEvent(this.gameState);
        
        // 开始游戏循环
        this.startGameLoop();
        
        console.log('🚀 游戏开始');
    }

    /**
     * 开始游戏循环
     */
    startGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        
        this.gameLoop = setInterval(() => {
            if (!this.isPaused && this.isRunning) {
                this.gameStep();
            }
        }, this.gameSpeed);
    }

    /**
     * 游戏步进
     */
    gameStep() {
        if (!this.gameState || !this.isRunning) {
            return;
        }
        
        try {
            // 检查游戏结束条件
            if (this.checkGameEnd()) {
                this.endGame();
                return;
            }
            
            // 更新角色状态
            this.updateCharacterStatus();
            
            // 控制事件触发频率
            this.gameState.gameTime++;
            
            // 检查是否应该改变地点
            if (this.gameState.gameTime % 20 === 0) {
                this.checkLocationChange();
            }
            
            // 触发事件
            var eventInterval = Math.floor(Math.random() * 3) + 2;
            if (this.gameState.gameTime % eventInterval === 0) {
                this.triggerGameEvent();
            }
            
            // 更新UI显示
            this.updateUI();
            
        } catch (error) {
            console.error('游戏步进错误:', error);
        }
    }

    /**
     * 触发游戏事件
     */
    triggerGameEvent() {
        try {
            var eventPromise = this.eventSystem.triggerRandomEvent(this.gameState);
            if (eventPromise && typeof eventPromise.catch === 'function') {
                var self = this;
                eventPromise.catch(function(error) {
                    console.error('事件触发失败:', error);
                });
            }
        } catch (error) {
            console.error('事件系统错误:', error);
        }
    }

    /**
     * 检查游戏结束条件
     */
    checkGameEnd() {
        if (!this.gameState || !this.gameState.character) {
            return true;
        }
        
        // 检查角色是否死亡
        if (this.gameState.character.status.hp <= 0) {
            return true;
        }
        
        return false;
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        if (this.uiManager && this.gameState) {
            this.uiManager.updateAll(this.gameState);
        }
    }

    /**
     * 更新角色状态
     */
    updateCharacterStatus() {
        if (!this.gameState || !this.gameState.character) return;
        
        var character = this.gameState.character;
        
        // 简单的状态恢复
        if (character.status.hp < character.getMaxHP()) {
            character.status.hp = Math.min(character.getMaxHP(), character.status.hp + 1);
        }
        
        if (character.status.mp < character.getMaxMP()) {
            character.status.mp = Math.min(character.getMaxMP(), character.status.mp + 1);
        }
    }

    /**
     * 检查位置变化
     */
    checkLocationChange() {
        // 简单的位置变化逻辑
        if (Math.random() < 0.1) { // 10%概率改变位置
            var locations = ['新手村', '森林', '山洞', '城镇', '荒野', '古庙'];
            var newLocation = locations[Math.floor(Math.random() * locations.length)];
            if (this.gameState.character.location !== newLocation) {
                this.gameState.character.location = newLocation;
                console.log('📍 ' + this.gameState.character.name + ' 来到了 ' + newLocation);
            }
        }
    }

    /**
     * 检查并处理地点变化
     */
    checkLocationChange() {
        const character = this.gameState.character;
        const currentLocation = this.gameState.currentLocation;
        
        if (character.shouldChangeLocation(currentLocation, this.gameState.gameTime)) {
            const newLocation = character.getNextRecommendedLocation(currentLocation);
            
            if (newLocation !== currentLocation) {
                this.gameState.currentLocation = newLocation;
                
                // 添加地点变化日志
                this.uiManager.addLogEntry(
                    'location', 
                    `🗺️ ${character.name}离开了${currentLocation}，来到了${newLocation}`, 
                    null
                );
                
                console.log(`📍 地点变化: ${currentLocation} → ${newLocation}`);
            }
        }
    }

    /**
     * 更新角色状态
     */
    updateCharacterStatus() {
        const character = this.gameState.character;
        
        // 恢复疲劳
        if (character.status.fatigue > 0) {
            character.status.fatigue = Math.max(0, character.status.fatigue - 1);
        }
        
        // 缓慢恢复HP和MP
        if (character.status.hp < character.getMaxHP()) {
            character.status.hp = Math.min(character.getMaxHP(), character.status.hp + 1);
        }
        
        if (character.status.mp < character.getMaxMP()) {
            character.status.mp = Math.min(character.getMaxMP(), character.status.mp + 1);
        }
    }

    /**
     * 检查游戏结束条件
     */
    checkGameEnd() {
        const character = this.gameState.character;
        
        // 生命值归零
        if (character.status.hp <= 0) {
            this.gameState.endReason = 'death';
            return true;
        }
        
        // 达到最大等级
        if (character.level >= 50) {
            this.gameState.endReason = 'max_level';
            return true;
        }
        
        // 其他结束条件...
        
        return false;
    }

    /**
     * 结束游戏
     */
    endGame() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        // 显示结束信息
        this.showGameEndDialog();
        
        console.log('🏁 游戏结束:', this.gameState.endReason);
    }

    /**
     * 显示游戏结束对话框
     */
    showGameEndDialog() {
        const reason = this.gameState.endReason;
        let message = '';
        
        switch (reason) {
            case 'death':
                message = '你的角色在冒险中不幸身亡...';
                break;
            case 'max_level':
                message = '恭喜！你的角色达到了传奇等级！';
                break;
            default:
                message = '冒险结束了。';
        }
        
        this.uiManager.addLogEntry('system', message);
        
        // 可以在这里添加更详细的结束统计
        setTimeout(() => {
            alert(message + '\n\n点击确定查看冒险统计。');
        }, 1000);
    }

    /**
     * 暂停/继续游戏
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('pause-btn');
        
        if (this.isPaused) {
            btn.textContent = '▶️ 继续';
            btn.classList.add('active');
        } else {
            btn.textContent = '⏸️ 暂停';
            btn.classList.remove('active');
        }
    }

    /**
     * 单步前进
     */
    stepForward() {
        if (this.isRunning) {
            this.isPaused = true;
            this.gameStep();
            document.getElementById('pause-btn').textContent = '▶️ 继续';
            document.getElementById('pause-btn').classList.add('active');
        }
    }

    /**
     * 设置自动模式
     */
    setAutoMode() {
        this.setGameSpeed(5);
        this.isPaused = false;
        this.updateSpeedDisplay();
    }

    /**
     * 设置快速模式
     */
    setFastMode() {
        this.setGameSpeed(10);
        this.isPaused = false;
        this.updateSpeedDisplay();
    }

    /**
     * 设置游戏速度
     */
    setGameSpeed(speed) {
        // speed: 1-10, 1最慢，10最快
        this.gameSpeed = 2000 - (speed - 1) * 180; // 2000ms到200ms
        document.getElementById('speed-slider').value = speed;
        this.updateSpeedDisplay();
        
        if (this.gameLoop && this.isRunning) {
            this.startGameLoop();
        }
    }

    /**
     * 更新速度显示
     */
    updateSpeedDisplay() {
        const speed = parseInt(document.getElementById('speed-slider').value);
        const multiplier = (speed / 5).toFixed(1);
        document.getElementById('speed-display').textContent = `${multiplier}x`;
    }

    /**
     * 保存游戏
     */
    saveGame() {
        if (!this.gameState) {
            alert('没有可保存的游戏');
            return;
        }
        
        try {
            const saveManager = new SaveManager();
            saveManager.saveGame(this.gameState);
            this.uiManager.addLogEntry('system', '游戏已保存');
        } catch (error) {
            console.error('保存游戏失败:', error);
            alert('保存游戏失败');
        }
    }

    /**
     * 加载游戏
     */
    loadGame() {
        try {
            const saveManager = new SaveManager();
            const savedState = saveManager.loadGame();
            if (savedState) {
                this.gameState = savedState;
                
                // 显示游戏界面
                document.getElementById('game-interface').classList.remove('hidden');
                this.enableGameControls();
                
                // 更新UI
                this.uiManager.updateAll(this.gameState);
                this.uiManager.addLogEntry('system', '游戏已加载');
                
                // 继续游戏
                this.isRunning = true;
                this.startGameLoop();
            } else {
                alert('没有找到保存的游戏');
            }
        } catch (error) {
            console.error('加载游戏失败:', error);
            alert('加载游戏失败');
        }
    }
}

/**
 * 游戏状态类
 */
class GameState {
    constructor(character) {
        this.character = character;
        this.currentLocation = '新手村';
        this.gameTime = 0;
        this.eventHistory = [];
        this.achievements = [];
        this.endReason = null;
        this.statistics = {
            eventsTriggered: 0,
            battlesWon: 0,
            treasuresFound: 0,
            npcsInteracted: 0
        };
    }

    /**
     * 添加事件到历史
     */
    addEventToHistory(event) {
        this.eventHistory.push({
            ...event,
            timestamp: this.gameTime
        });
        this.statistics.eventsTriggered++;
    }

    /**
     * 解锁成就
     */
    unlockAchievement(achievementId) {
        if (!this.achievements.includes(achievementId)) {
            this.achievements.push(achievementId);
            return true;
        }
        return false;
    }
}

/**
 * 存档管理器
 */
class SaveManager {
    constructor() {
        this.saveKey = 'adventure_simulator_save';
    }

    /**
     * 保存游戏
     */
    saveGame(gameState) {
        const saveData = {
            character: gameState.character,
            currentLocation: gameState.currentLocation,
            gameTime: gameState.gameTime,
            eventHistory: gameState.eventHistory,
            achievements: gameState.achievements,
            statistics: gameState.statistics,
            timestamp: Date.now()
        };
        
        localStorage.setItem(this.saveKey, JSON.stringify(saveData));
    }

    /**
     * 加载游戏
     */
    loadGame() {
        const saveData = localStorage.getItem(this.saveKey);
        if (!saveData) return null;
        
        try {
            const data = JSON.parse(saveData);
            
            // 重建角色对象
            const character = new Character(
                data.character.name,
                data.character.profession,
                data.character.attributes
            );
            
            // 恢复角色状态
            Object.assign(character.status, data.character.status);
            character.level = data.character.level;
            character.experience = data.character.experience;
            
            // 重建游戏状态
            const gameState = new GameState(character);
            gameState.currentLocation = data.currentLocation;
            gameState.gameTime = data.gameTime;
            gameState.eventHistory = data.eventHistory;
            gameState.achievements = data.achievements;
            gameState.statistics = data.statistics;
            
            return gameState;
        } catch (error) {
            console.error('解析存档数据失败:', error);
            return null;
        }
    }

    /**
     * 删除存档
     */
    deleteSave() {
        localStorage.removeItem(this.saveKey);
    }
}
