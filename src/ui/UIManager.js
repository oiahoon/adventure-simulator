/**
 * UI管理器
 * 负责管理游戏界面的更新和显示
 */
class UIManager {
    constructor() {
        this.logEntries = [];
        this.maxLogEntries = 100;
        
        console.log('🖥️ UI管理器初始化完成');
    }

    /**
     * 更新所有UI元素
     */
    updateAll(gameState) {
        this.updateCharacterDisplay(gameState.character);
        this.updateStatusBars(gameState.character);
        this.updateLocationDisplay(gameState.currentLocation);
    }

    /**
     * 更新角色显示
     */
    updateCharacterDisplay(character) {
        // 更新角色基本信息
        const nameElement = document.getElementById('character-display-name');
        const professionElement = document.getElementById('character-profession');
        const levelElement = document.getElementById('character-level');
        
        if (nameElement) nameElement.textContent = character.name;
        if (professionElement) professionElement.textContent = character.getProfessionName();
        if (levelElement) levelElement.textContent = `等级 ${character.level}`;
        
        // 更新属性显示
        const attributes = ['strength', 'intelligence', 'dexterity', 'constitution', 'charisma', 'luck'];
        attributes.forEach(attr => {
            const element = document.getElementById(`display-${attr}`);
            if (element) {
                element.textContent = character.attributes[attr];
            }
        });
        
        // 更新状态信息
        const wealthElement = document.getElementById('wealth-display');
        const reputationElement = document.getElementById('reputation-display');
        
        if (wealthElement) wealthElement.textContent = character.status.wealth;
        if (reputationElement) reputationElement.textContent = character.status.reputation;
    }

    /**
     * 更新状态条
     */
    updateStatusBars(character) {
        // 更新HP条
        const hpFill = document.getElementById('hp-fill');
        const hpText = document.getElementById('hp-text');
        const maxHP = character.getMaxHP();
        const hpPercent = (character.status.hp / maxHP) * 100;
        
        if (hpFill) hpFill.style.width = `${hpPercent}%`;
        if (hpText) hpText.textContent = `${character.status.hp}/${maxHP}`;
        
        // 更新MP条
        const mpFill = document.getElementById('mp-fill');
        const mpText = document.getElementById('mp-text');
        const maxMP = character.getMaxMP();
        const mpPercent = (character.status.mp / maxMP) * 100;
        
        if (mpFill) mpFill.style.width = `${mpPercent}%`;
        if (mpText) mpText.textContent = `${character.status.mp}/${maxMP}`;
        
        // 根据状态改变颜色
        if (hpPercent < 25) {
            if (hpFill) hpFill.style.background = 'linear-gradient(90deg, #dc3545, #c82333)';
        } else if (hpPercent < 50) {
            if (hpFill) hpFill.style.background = 'linear-gradient(90deg, #ffc107, #e0a800)';
        } else {
            if (hpFill) hpFill.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
        }
    }

    /**
     * 更新位置显示
     */
    updateLocationDisplay(location) {
        const locationElement = document.getElementById('location-display');
        if (locationElement) {
            const locationNames = {
                newbie_village: '新手村',
                forest: '神秘森林',
                town: '繁华城镇',
                dungeon: '地下城',
                capital: '王都',
                magic_tower: '魔法塔'
            };
            
            locationElement.textContent = locationNames[location] || '未知地点';
        }
    }

    /**
     * 添加日志条目
     */
    addLogEntry(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = {
            type,
            message,
            timestamp
        };
        
        this.logEntries.push(entry);
        
        // 限制日志条目数量
        if (this.logEntries.length > this.maxLogEntries) {
            this.logEntries.shift();
        }
        
        // 立即更新日志显示
        this.updateLogDisplay();
        
        // 添加终端打字效果
        this.addTypingEffect(type, message);
    }

    /**
     * 更新日志显示
     */
    updateLogDisplay() {
        const logContent = document.getElementById('log-content');
        if (!logContent) return;
        
        // 只显示最近的30条日志
        const recentEntries = this.logEntries.slice(-30);
        
        // 清空现有内容
        logContent.innerHTML = '';
        
        // 逐条添加日志
        recentEntries.forEach((entry, index) => {
            const logElement = document.createElement('p');
            logElement.className = `log-entry ${entry.type}`;
            logElement.innerHTML = `
                <span class="log-time">[${entry.timestamp}]</span> 
                <span class="log-message">${entry.message}</span>
            `;
            
            // 添加淡入动画
            logElement.style.opacity = '0';
            logElement.style.transform = 'translateY(10px)';
            
            logContent.appendChild(logElement);
            
            // 延迟显示动画
            setTimeout(() => {
                logElement.style.transition = 'all 0.3s ease';
                logElement.style.opacity = '1';
                logElement.style.transform = 'translateY(0)';
            }, index * 50);
        });
        
        // 自动滚动到底部
        setTimeout(() => {
            logContent.scrollTop = logContent.scrollHeight;
        }, recentEntries.length * 50 + 100);
    }

    /**
     * 添加终端打字效果
     */
    addTypingEffect(type, message) {
        // 为重要消息添加打字机效果
        if (['system', 'event'].includes(type)) {
            const logContent = document.getElementById('log-content');
            if (!logContent) return;
            
            const lastEntry = logContent.lastElementChild;
            if (!lastEntry) return;
            
            const messageSpan = lastEntry.querySelector('.log-message');
            if (!messageSpan) return;
            
            // 保存原始消息
            const originalMessage = messageSpan.textContent;
            messageSpan.textContent = '';
            
            // 逐字显示
            let charIndex = 0;
            const typingInterval = setInterval(() => {
                if (charIndex < originalMessage.length) {
                    messageSpan.textContent += originalMessage[charIndex];
                    charIndex++;
                    
                    // 添加光标效果
                    if (charIndex < originalMessage.length) {
                        messageSpan.textContent += '▋';
                        setTimeout(() => {
                            if (messageSpan.textContent.endsWith('▋')) {
                                messageSpan.textContent = messageSpan.textContent.slice(0, -1);
                            }
                        }, 50);
                    }
                } else {
                    clearInterval(typingInterval);
                    // 滚动到底部
                    logContent.scrollTop = logContent.scrollHeight;
                }
            }, 30);
        }
    }

    /**
     * 显示升级动画
     */
    showLevelUpAnimation(character, levelUpInfo) {
        this.addLogEntry('system', `🎉 ${character.name} 升级到 ${levelUpInfo.newLevel} 级！`);
        
        // 显示属性提升
        const gains = levelUpInfo.attributeGains;
        if (Object.keys(gains).length > 0) {
            const gainsText = Object.entries(gains)
                .map(([attr, value]) => `${this.getAttributeName(attr)}+${value}`)
                .join(', ');
            this.addLogEntry('system', `属性提升: ${gainsText}`);
        }
        
        // 可以在这里添加更多的视觉效果
        this.flashElement('character-panel', 'level-up');
    }

    /**
     * 添加事件日志（剧情和影响分离）
     */
    addEventLog(eventTitle, eventDescription, effects = null, impactDescription = null) {
        // 添加剧情日志
        this.addLogEntry('event', `📖 ${eventTitle}`);
        
        // 如果有详细描述，添加到单独的行
        if (eventDescription && eventDescription.length > 100) {
            // 长描述分段显示
            const sentences = eventDescription.match(/[^。！？.!?]+[。！？.!?]/g) || [eventDescription];
            sentences.forEach((sentence, index) => {
                setTimeout(() => {
                    this.addLogEntry('story', sentence.trim());
                }, index * 1000);
            });
        } else if (eventDescription) {
            this.addLogEntry('story', eventDescription);
        }
        
        // 添加影响日志
        if (effects && this.hasSignificantEffects(effects)) {
            setTimeout(() => {
                this.addEffectsLog(effects, impactDescription);
            }, eventDescription ? 2000 : 500);
        }
    }

    /**
     * 检查是否有显著影响
     */
    hasSignificantEffects(effects) {
        if (!effects) return false;
        
        // 检查各种影响
        const checkObject = (obj) => {
            return Object.values(obj || {}).some(value => 
                typeof value === 'number' ? Math.abs(value) > 0 : 
                Array.isArray(value) ? value.length > 0 : false
            );
        };
        
        return checkObject(effects.attributes) ||
               checkObject(effects.personality) ||
               checkObject(effects.social) ||
               checkObject(effects.status) ||
               (effects.skills && effects.skills.length > 0) ||
               (effects.items && effects.items.length > 0) ||
               (effects.titles && effects.titles.length > 0) ||
               (effects.achievements && effects.achievements.length > 0);
    }

    /**
     * 添加影响日志
     */
    addEffectsLog(effects, impactDescription) {
        const impactParts = [];
        
        // 属性变化
        if (effects.attributes) {
            Object.entries(effects.attributes).forEach(([attr, value]) => {
                if (Math.abs(value) > 0) {
                    const attrName = this.getAttributeName(attr);
                    const change = value > 0 ? `+${value}` : `${value}`;
                    impactParts.push(`${attrName}${change}`);
                }
            });
        }
        
        // 人格变化
        if (effects.personality) {
            Object.entries(effects.personality).forEach(([trait, value]) => {
                if (Math.abs(value) > 0) {
                    const traitName = this.getPersonalityName(trait);
                    const change = value > 0 ? `+${value}` : `${value}`;
                    impactParts.push(`${traitName}${change}`);
                }
            });
        }
        
        // 社会影响
        if (effects.social) {
            Object.entries(effects.social).forEach(([social, value]) => {
                if (Math.abs(value) > 0) {
                    const socialName = this.getSocialName(social);
                    const change = value > 0 ? `+${value}` : `${value}`;
                    impactParts.push(`${socialName}${change}`);
                }
            });
        }
        
        // 状态变化
        if (effects.status) {
            Object.entries(effects.status).forEach(([status, value]) => {
                if (Math.abs(value) > 0) {
                    const statusName = this.getStatusName(status);
                    const change = value > 0 ? `+${value}` : `${value}`;
                    impactParts.push(`${statusName}${change}`);
                }
            });
        }
        
        // 技能获得
        if (effects.skills && effects.skills.length > 0) {
            impactParts.push(`获得技能：${effects.skills.join('、')}`);
        }
        
        // 物品获得
        if (effects.items && effects.items.length > 0) {
            impactParts.push(`获得物品：${effects.items.join('、')}`);
        }
        
        // 称号获得
        if (effects.titles && effects.titles.length > 0) {
            impactParts.push(`获得称号：${effects.titles.join('、')}`);
        }
        
        // 成就解锁
        if (effects.achievements && effects.achievements.length > 0) {
            impactParts.push(`解锁成就：${effects.achievements.join('、')}`);
        }
        
        // 显示影响
        if (impactParts.length > 0) {
            this.addLogEntry('impact', `⚡ 影响：${impactParts.join('，')}`);
        }
        
        // 显示影响描述
        if (impactDescription) {
            this.addLogEntry('impact', `💭 ${impactDescription}`);
        }
    }

    /**
     * 获取人格特征名称
     */
    getPersonalityName(trait) {
        const names = {
            courage: '勇气',
            wisdom: '智慧',
            compassion: '慈悲',
            ambition: '野心',
            curiosity: '好奇心',
            patience: '耐心',
            pride: '骄傲',
            loyalty: '忠诚'
        };
        return names[trait] || trait;
    }

    /**
     * 获取社会属性名称
     */
    getSocialName(social) {
        const names = {
            reputation: '声望',
            influence: '影响力',
            karma: '业力'
        };
        return names[social] || social;
    }

    /**
     * 获取状态名称
     */
    getStatusName(status) {
        const names = {
            hp: '生命值',
            mp: '魔法值',
            wealth: '财富',
            experience: '经验值',
            fatigue: '疲劳度'
        };
        return names[status] || status;
    }

    /**
     * 闪烁元素效果
     */
    flashElement(elementId, className = 'flash') {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add(className);
            setTimeout(() => {
                element.classList.remove(className);
            }, 1000);
        }
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, duration);
    }

    /**
     * 获取通知颜色
     */
    getNotificationColor(type) {
        const colors = {
            info: '#17a2b8',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545'
        };
        return colors[type] || colors.info;
    }

    /**
     * 显示确认对话框
     */
    showConfirmDialog(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            text-align: center;
        `;
        
        dialog.innerHTML = `
            <p style="margin-bottom: 20px; font-size: 16px;">${message}</p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="confirm-yes" class="btn btn-primary">确定</button>
                <button id="confirm-no" class="btn btn-secondary">取消</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // 绑定事件
        document.getElementById('confirm-yes').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        });
        
        document.getElementById('confirm-no').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        });
        
        // 点击背景关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                if (onCancel) onCancel();
            }
        });
    }

    /**
     * 显示成就解锁
     */
    showAchievementUnlocked(achievement) {
        this.addLogEntry('system', `🏆 解锁成就: ${achievement.name}`);
        this.showNotification(`🏆 解锁成就: ${achievement.name}`, 'success', 5000);
    }

    /**
     * 更新成就面板
     */
    updateAchievements(achievements) {
        const achievementsList = document.getElementById('achievements-list');
        if (!achievementsList) return;
        
        achievementsList.innerHTML = achievements.map(achievement => {
            return `
                <div class="achievement-item">
                    <div class="achievement-icon">${achievement.icon || '🏆'}</div>
                    <div class="achievement-info">
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 显示游戏统计
     */
    showGameStatistics(gameState) {
        const stats = gameState.statistics;
        const character = gameState.character;
        
        const statsHtml = `
            <div class="game-statistics">
                <h3>冒险统计</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">角色等级:</span>
                        <span class="stat-value">${character.level}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">冒险时长:</span>
                        <span class="stat-value">${Math.floor(gameState.gameTime / 60)}分钟</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">触发事件:</span>
                        <span class="stat-value">${stats.eventsTriggered}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">战斗胜利:</span>
                        <span class="stat-value">${stats.battlesWon}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">发现宝藏:</span>
                        <span class="stat-value">${stats.treasuresFound}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">NPC互动:</span>
                        <span class="stat-value">${stats.npcsInteracted}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">最终财富:</span>
                        <span class="stat-value">${character.status.wealth}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">声望等级:</span>
                        <span class="stat-value">${character.status.reputation}</span>
                    </div>
                </div>
            </div>
        `;
        
        return statsHtml;
    }
}
