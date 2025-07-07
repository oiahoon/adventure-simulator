/**
 * 角色成长界面UI
 */
class CharacterGrowthUI {
    constructor() {
        this.characterGrowth = new CharacterGrowth();
        this.currentCharacter = null;
        this.activeTab = 'attributes';
        
        console.log('🎨 角色成长界面初始化完成');
    }

    /**
     * 显示成长界面
     */
    show(character) {
        this.currentCharacter = character;
        this.render();
        
        // 显示模态框
        const modal = document.getElementById('character-growth-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    /**
     * 隐藏成长界面
     */
    hide() {
        const modal = document.getElementById('character-growth-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 渲染界面
     */
    render() {
        if (!this.currentCharacter) return;

        const growthInfo = this.characterGrowth.getCharacterGrowthInfo(this.currentCharacter);
        
        const modalHTML = `
            <div id="character-growth-modal" class="modal" style="display: none;">
                <div class="modal-content character-growth-content">
                    <div class="modal-header">
                        <h2>🌱 ${this.currentCharacter.name} - 角色成长</h2>
                        <span class="close" onclick="characterGrowthUI.hide()">&times;</span>
                    </div>
                    
                    <div class="character-growth-tabs">
                        <button class="tab-button ${this.activeTab === 'attributes' ? 'active' : ''}" 
                                onclick="characterGrowthUI.switchTab('attributes')">
                            📊 属性
                        </button>
                        <button class="tab-button ${this.activeTab === 'skills' ? 'active' : ''}" 
                                onclick="characterGrowthUI.switchTab('skills')">
                            📚 技能
                        </button>
                        <button class="tab-button ${this.activeTab === 'equipment' ? 'active' : ''}" 
                                onclick="characterGrowthUI.switchTab('equipment')">
                            ⚔️ 装备
                        </button>
                        <button class="tab-button ${this.activeTab === 'stats' ? 'active' : ''}" 
                                onclick="characterGrowthUI.switchTab('stats')">
                            📈 数据
                        </button>
                    </div>
                    
                    <div class="character-growth-body">
                        ${this.renderCurrentTab(growthInfo)}
                    </div>
                </div>
            </div>
        `;

        // 移除旧的模态框
        const existingModal = document.getElementById('character-growth-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的模态框
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 添加样式
        this.addStyles();
    }

    /**
     * 切换标签页
     */
    switchTab(tab) {
        this.activeTab = tab;
        this.render();
        this.show(this.currentCharacter);
    }

    /**
     * 渲染当前标签页内容
     */
    renderCurrentTab(growthInfo) {
        switch (this.activeTab) {
            case 'attributes':
                return this.renderAttributesTab(growthInfo);
            case 'skills':
                return this.renderSkillsTab(growthInfo);
            case 'equipment':
                return this.renderEquipmentTab(growthInfo);
            case 'stats':
                return this.renderStatsTab(growthInfo);
            default:
                return '<div>未知标签页</div>';
        }
    }

    /**
     * 渲染属性标签页
     */
    renderAttributesTab(growthInfo) {
        const character = this.currentCharacter;
        const expProgress = (growthInfo.experience.progress * 100).toFixed(1);
        
        return `
            <div class="attributes-tab">
                <div class="level-info">
                    <h3>🎯 等级信息</h3>
                    <div class="level-display">
                        <span class="level-number">等级 ${growthInfo.level}</span>
                        <div class="exp-bar">
                            <div class="exp-progress" style="width: ${expProgress}%"></div>
                            <span class="exp-text">${growthInfo.experience.current}/${growthInfo.experience.required}</span>
                        </div>
                    </div>
                </div>

                <div class="available-points">
                    <h3>📊 可用点数</h3>
                    <div class="points-display">
                        <div class="point-item">
                            <span>属性点:</span>
                            <span class="point-value">${growthInfo.availablePoints.attribute}</span>
                        </div>
                        <div class="point-item">
                            <span>技能点:</span>
                            <span class="point-value">${growthInfo.availablePoints.skill}</span>
                        </div>
                    </div>
                </div>

                <div class="attributes-section">
                    <h3>💪 基础属性</h3>
                    <div class="attributes-grid">
                        ${this.renderAttributeItem('strength', '力量', character.attributes.strength, '影响攻击力和负重')}
                        ${this.renderAttributeItem('constitution', '体质', character.attributes.constitution, '影响生命值和防御力')}
                        ${this.renderAttributeItem('dexterity', '敏捷', character.attributes.dexterity, '影响闪避和速度')}
                        ${this.renderAttributeItem('intelligence', '智力', character.attributes.intelligence, '影响法力值和学习能力')}
                        ${this.renderAttributeItem('charisma', '魅力', character.attributes.charisma, '影响社交和声望')}
                        ${this.renderAttributeItem('luck', '幸运', character.attributes.luck, '影响暴击和掉落')}
                    </div>
                </div>

                <div class="combat-stats">
                    <h3>⚔️ 战斗属性</h3>
                    <div class="combat-grid">
                        <div class="combat-stat">
                            <span>攻击力:</span>
                            <span class="stat-value">${character.getTotalAttack()}</span>
                        </div>
                        <div class="combat-stat">
                            <span>防御力:</span>
                            <span class="stat-value">${character.getTotalDefense()}</span>
                        </div>
                        <div class="combat-stat">
                            <span>暴击率:</span>
                            <span class="stat-value">${character.getCriticalRate()}%</span>
                        </div>
                        <div class="combat-stat">
                            <span>闪避率:</span>
                            <span class="stat-value">${character.getDodgeRate()}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染单个属性项
     */
    renderAttributeItem(attrName, displayName, value, description) {
        const canIncrease = this.currentCharacter.availableAttributePoints > 0;
        
        return `
            <div class="attribute-item">
                <div class="attribute-info">
                    <span class="attribute-name">${displayName}</span>
                    <span class="attribute-value">${value}</span>
                </div>
                <div class="attribute-controls">
                    <button class="attribute-btn ${canIncrease ? '' : 'disabled'}" 
                            onclick="characterGrowthUI.increaseAttribute('${attrName}')"
                            ${canIncrease ? '' : 'disabled'}>+</button>
                </div>
                <div class="attribute-description">${description}</div>
            </div>
        `;
    }

    /**
     * 渲染技能标签页
     */
    renderSkillsTab(growthInfo) {
        const skillTrees = this.characterGrowth.skillTrees;
        
        return `
            <div class="skills-tab">
                <div class="skill-points">
                    <h3>📚 可用技能点: ${growthInfo.availablePoints.skill}</h3>
                </div>
                
                ${Object.entries(skillTrees).map(([treeId, tree]) => `
                    <div class="skill-tree">
                        <h3>🌳 ${tree.name}</h3>
                        <div class="skills-grid">
                            ${Object.entries(tree.skills).map(([skillId, skill]) => 
                                this.renderSkillItem(skillId, skill, growthInfo.skills[skillId] || 0)
                            ).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 渲染技能项
     */
    renderSkillItem(skillId, skill, currentLevel) {
        const canLearn = this.currentCharacter.availableSkillPoints > 0 && 
                        currentLevel < skill.maxLevel &&
                        this.characterGrowth.checkSkillRequirements(this.currentCharacter, skill.requirements).success;
        
        return `
            <div class="skill-item">
                <div class="skill-header">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-level">${currentLevel}/${skill.maxLevel}</span>
                </div>
                <div class="skill-description">${skill.description}</div>
                <div class="skill-effects">
                    效果: ${Object.entries(skill.effects).map(([effect, value]) => 
                        `${effect}+${value}`
                    ).join(', ')}
                </div>
                <button class="skill-learn-btn ${canLearn ? '' : 'disabled'}"
                        onclick="characterGrowthUI.learnSkill('${skillId}')"
                        ${canLearn ? '' : 'disabled'}>
                    ${currentLevel === 0 ? '学习' : '升级'}
                </button>
            </div>
        `;
    }

    /**
     * 渲染装备标签页
     */
    renderEquipmentTab(growthInfo) {
        const equipment = this.currentCharacter.equipment;
        
        return `
            <div class="equipment-tab">
                <h3>⚔️ 当前装备</h3>
                <div class="equipment-slots">
                    ${Object.entries(equipment).map(([slot, item]) => `
                        <div class="equipment-slot">
                            <div class="slot-name">${this.getSlotDisplayName(slot)}</div>
                            <div class="slot-item">
                                ${item ? `
                                    <div class="equipped-item ${item.rarity}">
                                        <span class="item-name">${item.name}</span>
                                        <div class="item-effects">
                                            ${Object.entries(item.effects || {}).map(([effect, value]) => 
                                                `${effect}+${value}`
                                            ).join(', ')}
                                        </div>
                                    </div>
                                ` : '<div class="empty-slot">未装备</div>'}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <h3>🎒 背包物品</h3>
                <div class="inventory-items">
                    ${this.currentCharacter.inventory.filter(item => 
                        ['weapon', 'armor', 'accessory', 'boots'].includes(item.type)
                    ).map(item => `
                        <div class="inventory-item ${item.rarity}">
                            <span class="item-name">${item.name}</span>
                            <button class="equip-btn" onclick="characterGrowthUI.equipItem('${item.id}')">
                                装备
                            </button>
                        </div>
                    `).join('') || '<div class="no-items">暂无可装备物品</div>'}
                </div>
            </div>
        `;
    }

    /**
     * 渲染数据标签页
     */
    renderStatsTab(growthInfo) {
        const character = this.currentCharacter;
        
        return `
            <div class="stats-tab">
                <div class="stats-section">
                    <h3>📊 基础数据</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span>生命值:</span>
                            <span>${character.status.hp}/${character.getMaxHP()}</span>
                        </div>
                        <div class="stat-item">
                            <span>法力值:</span>
                            <span>${character.status.mp}/${character.getMaxMP()}</span>
                        </div>
                        <div class="stat-item">
                            <span>财富:</span>
                            <span>${character.wealth} 金币</span>
                        </div>
                        <div class="stat-item">
                            <span>当前位置:</span>
                            <span>${character.location}</span>
                        </div>
                    </div>
                </div>

                <div class="stats-section">
                    <h3>🏆 游戏统计</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span>完成事件:</span>
                            <span>${character.statistics.eventsCompleted}</span>
                        </div>
                        <div class="stat-item">
                            <span>击败怪物:</span>
                            <span>${character.statistics.monstersDefeated}</span>
                        </div>
                        <div class="stat-item">
                            <span>完成任务:</span>
                            <span>${character.statistics.questsCompleted}</span>
                        </div>
                        <div class="stat-item">
                            <span>获得物品:</span>
                            <span>${character.statistics.itemsFound}</span>
                        </div>
                    </div>
                </div>

                <div class="stats-section">
                    <h3>🌟 声望状态</h3>
                    <div class="reputation-grid">
                        ${Object.entries(character.reputation).map(([type, value]) => `
                            <div class="reputation-item">
                                <span>${this.getReputationDisplayName(type)}:</span>
                                <span class="reputation-value ${value >= 0 ? 'positive' : 'negative'}">${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 增加属性点
     */
    increaseAttribute(attrName) {
        if (this.currentCharacter.availableAttributePoints <= 0) {
            return;
        }

        this.currentCharacter.attributes[attrName]++;
        this.currentCharacter.availableAttributePoints--;
        
        // 更新角色数据
        this.characterGrowth.updateCharacterStats(this.currentCharacter);
        
        // 重新渲染
        this.render();
        this.show(this.currentCharacter);
        
        console.log(`📈 ${this.currentCharacter.name} 的 ${attrName} 增加了 1 点`);
    }

    /**
     * 学习技能
     */
    learnSkill(skillId) {
        // 找到技能所属的技能树
        let skillTreeName = null;
        let skill = null;
        
        for (const [treeName, tree] of Object.entries(this.characterGrowth.skillTrees)) {
            if (tree.skills[skillId]) {
                skillTreeName = treeName;
                skill = tree.skills[skillId];
                break;
            }
        }
        
        if (!skill) {
            console.error('未找到技能:', skillId);
            return;
        }

        const result = this.characterGrowth.learnSkill(this.currentCharacter, skillTreeName, skillId);
        
        if (result.success) {
            // 重新渲染
            this.render();
            this.show(this.currentCharacter);
            
            // 显示成功消息
            this.showMessage(result.message, 'success');
        } else {
            this.showMessage(result.message, 'error');
        }
    }

    /**
     * 装备物品
     */
    equipItem(itemId) {
        const result = this.characterGrowth.equipItem(this.currentCharacter, itemId);
        
        if (result.success) {
            this.render();
            this.show(this.currentCharacter);
            this.showMessage(result.message, 'success');
        } else {
            this.showMessage(result.message, 'error');
        }
    }

    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `growth-message ${type}`;
        messageEl.textContent = message;
        
        // 添加到页面
        document.body.appendChild(messageEl);
        
        // 3秒后移除
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    /**
     * 获取装备槽显示名称
     */
    getSlotDisplayName(slot) {
        const names = {
            weapon: '武器',
            armor: '护甲',
            accessory: '饰品',
            boots: '靴子'
        };
        return names[slot] || slot;
    }

    /**
     * 获取声望显示名称
     */
    getReputationDisplayName(type) {
        const names = {
            righteous: '正派',
            evil: '邪派',
            jianghu: '江湖',
            sect: '门派',
            merchant: '商业',
            scholar: '学者'
        };
        return names[type] || type;
    }

    /**
     * 添加样式
     */
    addStyles() {
        if (document.getElementById('character-growth-styles')) return;

        const styles = `
            <style id="character-growth-styles">
                .character-growth-content {
                    max-width: 800px;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .character-growth-tabs {
                    display: flex;
                    border-bottom: 2px solid #333;
                    margin-bottom: 20px;
                }
                
                .tab-button {
                    padding: 10px 20px;
                    background: #2a2a2a;
                    border: none;
                    color: #fff;
                    cursor: pointer;
                    border-bottom: 3px solid transparent;
                }
                
                .tab-button.active {
                    background: #444;
                    border-bottom-color: #00ff41;
                }
                
                .attributes-grid, .skills-grid, .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin: 15px 0;
                }
                
                .attribute-item, .skill-item {
                    background: #2a2a2a;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #444;
                }
                
                .attribute-controls {
                    margin: 10px 0;
                }
                
                .attribute-btn {
                    background: #00ff41;
                    color: #000;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .attribute-btn.disabled {
                    background: #666;
                    cursor: not-allowed;
                }
                
                .exp-bar {
                    background: #333;
                    height: 20px;
                    border-radius: 10px;
                    position: relative;
                    margin: 10px 0;
                }
                
                .exp-progress {
                    background: linear-gradient(90deg, #00ff41, #00cc33);
                    height: 100%;
                    border-radius: 10px;
                    transition: width 0.3s ease;
                }
                
                .exp-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #fff;
                    font-size: 12px;
                }
                
                .equipment-slots {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin: 20px 0;
                }
                
                .equipment-slot {
                    background: #2a2a2a;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }
                
                .equipped-item {
                    padding: 10px;
                    border-radius: 4px;
                }
                
                .equipped-item.common { background: #666; }
                .equipped-item.uncommon { background: #2e7d32; }
                .equipped-item.rare { background: #1565c0; }
                .equipped-item.epic { background: #7b1fa2; }
                .equipped-item.legendary { background: #f57c00; }
                
                .growth-message {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: #fff;
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                }
                
                .growth-message.success { background: #4caf50; }
                .growth-message.error { background: #f44336; }
                .growth-message.info { background: #2196f3; }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// 全局实例
window.characterGrowthUI = new CharacterGrowthUI();
