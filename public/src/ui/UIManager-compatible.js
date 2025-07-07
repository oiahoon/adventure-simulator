/**
 * UI管理器 - 兼容版本
 * 管理游戏界面的显示和更新，避免现代JavaScript语法
 */
class UIManager {
    constructor() {
        this.logContainer = document.getElementById('log-content');
        this.characterPanel = document.getElementById('character-panel');
        this.storyLog = [];
        this.gameTimeCounter = 0;
        this.typingSpeed = 50; // 毫秒
        this.isTyping = false;
        
        console.log('🎨 UI管理器初始化完成');
    }

    /**
     * 添加日志条目（兼容版本）
     */
    addLogEntry(type, content, effects, timestamp) {
        if (!this.logContainer) {
            console.warn('日志容器不存在');
            return Promise.resolve();
        }

        var now = timestamp || Date.now();
        
        // 使用游戏内部计数器计算游戏时间
        this.gameTimeCounter += 1;
        var gameTime = this.formatGameTimeFromCounter(this.gameTimeCounter);
        var realTime = new Date(now).toLocaleTimeString();

        // 创建日志条目
        var logEntry = document.createElement('div');
        logEntry.className = 'log-entry ' + type;
        
        // 时间戳
        var timeStamp = document.createElement('div');
        timeStamp.className = 'log-timestamp';
        timeStamp.innerHTML = '<span class="game-time">[第' + gameTime + ']</span> <span class="real-time">' + realTime + '</span>';
        
        // 内容容器
        var contentDiv = document.createElement('div');
        contentDiv.className = 'log-content';
        
        // 故事内容
        var storyDiv = document.createElement('div');
        storyDiv.className = 'log-story';
        
        logEntry.appendChild(timeStamp);
        logEntry.appendChild(contentDiv);
        contentDiv.appendChild(storyDiv);
        
        // 添加到容器
        this.logContainer.appendChild(logEntry);
        
        // 非阻塞的打字效果
        this.typeTextCompatible(storyDiv, content);
        
        // 如果有影响，显示影响结果
        if (effects && this.hasSignificantEffects(effects)) {
            var effectsDiv = document.createElement('div');
            effectsDiv.className = 'log-effects';
            effectsDiv.innerHTML = this.formatEffects(effects);
            contentDiv.appendChild(effectsDiv);
            
            // 添加淡入效果
            var self = this;
            setTimeout(function() {
                effectsDiv.style.opacity = '0';
                effectsDiv.style.transform = 'translateY(10px)';
                effectsDiv.style.transition = 'all 0.5s ease';
                setTimeout(function() {
                    effectsDiv.style.opacity = '1';
                    effectsDiv.style.transform = 'translateY(0)';
                }, 100);
            }, 500);
        }
        
        // 保存到故事日志
        this.storyLog.push({
            timestamp: now,
            gameTime: gameTime,
            type: type,
            content: content,
            effects: effects
        });
        
        // 限制日志长度
        if (this.storyLog.length > 1000) {
            this.storyLog = this.storyLog.slice(-800);
        }
        
        // 自动滚动到底部
        var self = this;
        setTimeout(function() {
            self.logContainer.scrollTop = self.logContainer.scrollHeight;
        }, 100);
        
        // 立即返回
        return Promise.resolve();
    }

    /**
     * 打字效果（兼容版本）
     */
    typeTextCompatible(element, text) {
        this.isTyping = true;
        element.textContent = '';
        
        // 如果游戏在快速模式或文本很长，直接显示
        if (this.typingSpeed <= 10 || text.length > 200) {
            element.textContent = text;
            this.isTyping = false;
            return;
        }
        
        // 分批显示文本，避免阻塞
        var batchSize = 5; // 每批显示5个字符
        var currentIndex = 0;
        var self = this;
        
        function displayBatch() {
            var endIndex = Math.min(currentIndex + batchSize, text.length);
            element.textContent += text.slice(currentIndex, endIndex);
            currentIndex = endIndex;
            
            if (currentIndex < text.length) {
                setTimeout(displayBatch, self.typingSpeed);
            } else {
                self.isTyping = false;
            }
        }
        
        displayBatch();
    }

    /**
     * 格式化游戏时间
     */
    formatGameTimeFromCounter(counter) {
        // 每10个计数器单位 = 1小时游戏时间
        var hours = Math.floor(counter / 10);
        var minutes = (counter % 10) * 6; // 0-54分钟
        
        if (hours > 24) {
            var days = Math.floor(hours / 24);
            var remainingHours = hours % 24;
            return '第' + days + '天' + remainingHours + '时';
        } else if (hours > 0) {
            return '第' + hours + '时' + minutes + '分';
        } else {
            return '第' + minutes + '分';
        }
    }

    /**
     * 检查是否有显著效果
     */
    hasSignificantEffects(effects) {
        if (!effects) return false;
        
        // 检查属性变化
        if (effects.attributes) {
            for (var attr in effects.attributes) {
                if (Math.abs(effects.attributes[attr]) > 0) {
                    return true;
                }
            }
        }
        
        // 检查状态变化
        if (effects.status) {
            for (var stat in effects.status) {
                if (Math.abs(effects.status[stat]) > 0) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * 格式化效果显示
     */
    formatEffects(effects) {
        var result = [];
        
        if (effects.attributes) {
            for (var attr in effects.attributes) {
                var value = effects.attributes[attr];
                if (Math.abs(value) > 0) {
                    var sign = value > 0 ? '+' : '';
                    result.push('<span class="effect-attr">' + attr + ': ' + sign + value + '</span>');
                }
            }
        }
        
        if (effects.status) {
            for (var stat in effects.status) {
                var value = effects.status[stat];
                if (Math.abs(value) > 0) {
                    var sign = value > 0 ? '+' : '';
                    result.push('<span class="effect-status">' + stat + ': ' + sign + value + '</span>');
                }
            }
        }
        
        return result.join(' | ');
    }

    /**
     * 更新角色面板
     */
    updateCharacterPanel(character) {
        if (!character || !this.characterPanel) return;
        
        try {
            // 更新基本信息
            var nameEl = document.getElementById('character-name');
            if (nameEl) nameEl.textContent = character.name;
            
            var levelEl = document.getElementById('character-level');
            if (levelEl) levelEl.textContent = character.level;
            
            var professionEl = document.getElementById('character-profession');
            if (professionEl) professionEl.textContent = character.getProfessionName();
            
            // 更新属性显示
            var attributes = ['strength', 'intelligence', 'dexterity', 'constitution', 'charisma', 'luck'];
            for (var i = 0; i < attributes.length; i++) {
                var attr = attributes[i];
                var el = document.getElementById('display-' + attr);
                if (el && character.attributes[attr] !== undefined) {
                    el.textContent = character.attributes[attr];
                    // 添加变化动画效果
                    el.style.color = '#00ff41';
                    setTimeout(function(element) {
                        return function() {
                            element.style.color = '';
                        };
                    }(el), 1000);
                }
            }
            
            // 更新状态条
            this.updateStatusBars(character);
            
            // 更新其他信息
            var wealthEl = document.getElementById('wealth-display');
            if (wealthEl && character.wealth !== undefined) {
                wealthEl.textContent = character.wealth;
                // 财富变化动画
                wealthEl.style.color = '#ffd700';
                setTimeout(function() {
                    wealthEl.style.color = '';
                }, 1000);
            }
            
            var locationEl = document.getElementById('location-display');
            if (locationEl) locationEl.textContent = character.location;
            
            // 更新声望显示
            var reputationEl = document.getElementById('reputation-display');
            if (reputationEl && character.social && character.social.reputation !== undefined) {
                reputationEl.textContent = character.social.reputation;
            }
            
            console.log('🎨 角色面板更新完成');
            
        } catch (error) {
            console.error('更新角色面板失败:', error);
        }
    }

    /**
     * 更新状态条
     */
    updateStatusBars(character) {
        // 更新生命值
        var hpFill = document.getElementById('hp-fill');
        var hpText = document.getElementById('hp-text');
        if (hpFill && hpText) {
            var maxHP = character.getMaxHP();
            var currentHP = character.status.hp;
            var hpPercent = (currentHP / maxHP) * 100;
            
            hpFill.style.width = hpPercent + '%';
            hpText.textContent = currentHP + '/' + maxHP;
        }
        
        // 更新法力值
        var mpFill = document.getElementById('mp-fill');
        var mpText = document.getElementById('mp-text');
        if (mpFill && mpText) {
            var maxMP = character.getMaxMP();
            var currentMP = character.status.mp;
            var mpPercent = (currentMP / maxMP) * 100;
            
            mpFill.style.width = mpPercent + '%';
            mpText.textContent = currentMP + '/' + maxMP;
        }
    }

    /**
     * 清空日志
     */
    clearLog() {
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
        }
        this.storyLog = [];
        this.gameTimeCounter = 0;
    }

    /**
     * 更新角色显示
     */
    updateCharacterDisplay(character) {
        this.updateCharacterPanel(character);
    }

    /**
     * 添加效果日志
     */
    addEffectsLog(effects, character) {
        if (!effects) return;
        
        var effectMessages = [];
        
        // 属性变化
        if (effects.attributes) {
            for (var attr in effects.attributes) {
                var value = effects.attributes[attr];
                if (Math.abs(value) > 0) {
                    var sign = value > 0 ? '+' : '';
                    effectMessages.push(attr + ': ' + sign + value);
                }
            }
        }
        
        // 状态变化
        if (effects.status) {
            for (var stat in effects.status) {
                var value = effects.status[stat];
                if (Math.abs(value) > 0) {
                    var sign = value > 0 ? '+' : '';
                    effectMessages.push(stat + ': ' + sign + value);
                }
            }
        }
        
        if (effectMessages.length > 0) {
            this.addLogEntry('effect', '💫 ' + effectMessages.join(', '));
        }
    }

    /**
     * 更新所有UI
     */
    updateAll(gameState) {
        if (gameState && gameState.character) {
            this.updateCharacterPanel(gameState.character);
        }
    }

    /**
     * 导出故事
     */
    exportStory() {
        var story = this.storyLog.map(function(entry) {
            return '[' + entry.gameTime + '] ' + entry.content;
        }).join('\n\n');
        
        var blob = new Blob([story], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'adventure-story.txt';
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 全局导出
window.UIManager = UIManager;
