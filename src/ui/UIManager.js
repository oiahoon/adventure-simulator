/**
 * UI管理器
 * 负责更新游戏界面和用户交互，实现统一日志和小说导出
 */
class UIManager {
    constructor() {
        this.logContainer = document.getElementById('log-content');
        this.typingSpeed = 30; // 打字效果速度（毫秒）
        this.isTyping = false;
        this.gameStartTime = Date.now();
        this.storyLog = []; // 完整的故事日志，用于导出
        this.gameTimeCounter = 0; // 使用游戏内部计数器而不是实际时间
        
        console.log('🎨 UI管理器初始化完成');
    }

    /**
     * 更新所有UI元素
     */
    updateAll(gameState) {
        this.updateCharacterDisplay(gameState.character);
        this.updateStatusBars(gameState.character);
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
        
        if (wealthElement) wealthElement.textContent = character.status.wealth || 0;
        if (reputationElement) reputationElement.textContent = character.status.reputation || 0;
    }

    /**
     * 更新状态条
     */
    updateStatusBars(character) {
        // 更新生命值
        const hpFill = document.getElementById('hp-fill');
        const hpText = document.getElementById('hp-text');
        if (hpFill && hpText) {
            const maxHp = character.getMaxHP();
            const hpPercent = (character.status.hp / maxHp) * 100;
            hpFill.style.width = `${Math.max(0, hpPercent)}%`;
            hpText.textContent = `${character.status.hp}/${maxHp}`;
        }
        
        // 更新魔法值
        const mpFill = document.getElementById('mp-fill');
        const mpText = document.getElementById('mp-text');
        if (mpFill && mpText) {
            const maxMp = character.getMaxMP();
            const mpPercent = (character.status.mp / maxMp) * 100;
            mpFill.style.width = `${Math.max(0, mpPercent)}%`;
            mpText.textContent = `${character.status.mp}/${maxMp}`;
        }
        
        // 更新经验值
        const expFill = document.getElementById('exp-fill');
        const expText = document.getElementById('exp-text');
        if (expFill && expText) {
            const requiredExp = character.getRequiredExperience();
            const expPercent = (character.experience / requiredExp) * 100;
            expFill.style.width = `${Math.max(0, expPercent)}%`;
            expText.textContent = `${character.experience}/${requiredExp}`;
        }
    }

    /**
     * 添加日志条目（带打字效果的统一日志）
     */
    async addLogEntry(type, content, effects = null, timestamp = null) {
        if (!this.logContainer) {
            console.warn('日志容器不存在');
            return;
        }

        const now = timestamp || Date.now();
        
        // 使用游戏内部计数器计算游戏时间
        this.gameTimeCounter += 1;
        const gameTime = this.formatGameTimeFromCounter(this.gameTimeCounter);
        const realTime = new Date(now).toLocaleTimeString();

        // 创建日志条目
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        // 时间戳
        const timeStamp = document.createElement('div');
        timeStamp.className = 'log-timestamp';
        timeStamp.innerHTML = `<span class="game-time">[第${gameTime}]</span> <span class="real-time">${realTime}</span>`;
        
        // 内容容器
        const contentDiv = document.createElement('div');
        contentDiv.className = 'log-content';
        
        // 故事内容
        const storyDiv = document.createElement('div');
        storyDiv.className = 'log-story';
        
        logEntry.appendChild(timeStamp);
        logEntry.appendChild(contentDiv);
        contentDiv.appendChild(storyDiv);
        
        // 添加到容器
        this.logContainer.appendChild(logEntry);
        
        // 打字效果显示故事内容
        await this.typeText(storyDiv, content);
        
        // 如果有影响，显示影响结果
        if (effects && this.hasSignificantEffects(effects)) {
            const effectsDiv = document.createElement('div');
            effectsDiv.className = 'log-effects';
            effectsDiv.innerHTML = this.formatEffects(effects);
            contentDiv.appendChild(effectsDiv);
            
            // 添加淡入效果
            setTimeout(() => {
                effectsDiv.style.opacity = '0';
                effectsDiv.style.transform = 'translateY(10px)';
                effectsDiv.style.transition = 'all 0.5s ease';
                setTimeout(() => {
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
        
        // 自动滚动到底部
        this.scrollToBottom();
    }

    /**
     * 打字效果
     */
    async typeText(element, text) {
        this.isTyping = true;
        element.textContent = '';
        
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await new Promise(resolve => setTimeout(resolve, this.typingSpeed));
            
            // 如果文本很长，在句号、感叹号、问号后稍作停顿
            if (['。', '！', '？', '.', '!', '?'].includes(text[i])) {
                await new Promise(resolve => setTimeout(resolve, this.typingSpeed * 3));
            }
        }
        
        this.isTyping = false;
    }

    /**
     * 格式化游戏时间
     */
    formatGameTimeFromCounter(counter) {
        // 每10个计数器单位 = 1小时游戏时间
        const hours = Math.floor(counter / 10);
        const minutes = (counter % 10) * 6; // 0-54分钟
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return `第${days}天${remainingHours}时`;
        } else if (hours > 0) {
            return `第${hours}时${minutes}分`;
        } else {
            return `第${minutes}分`;
        }
    }

    formatGameTime(milliseconds) {
        // 确保不是负数
        const ms = Math.max(0, milliseconds);
        
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
            return `${days}天${hours}时`;
        } else if (hours > 0) {
            return `${hours}时${minutes}分`;
        } else {
            return `${minutes}分`;
        }
    }

    /**
     * 检查是否有显著影响
     */
    hasSignificantEffects(effects) {
        if (!effects) return false;
        
        // 检查属性变化
        if (effects.attributes) {
            for (const value of Object.values(effects.attributes)) {
                if (Math.abs(value) > 0) return true;
            }
        }
        
        // 检查其他影响
        if (effects.personality) {
            for (const value of Object.values(effects.personality)) {
                if (Math.abs(value) > 0) return true;
            }
        }
        
        if (effects.status) {
            for (const value of Object.values(effects.status)) {
                if (Math.abs(value) > 0) return true;
            }
        }
        
        if (effects.skills && effects.skills.length > 0) return true;
        if (effects.items && effects.items.length > 0) return true;
        if (effects.titles && effects.titles.length > 0) return true;
        if (effects.achievements && effects.achievements.length > 0) return true;
        
        return false;
    }

    /**
     * 格式化影响显示
     */
    formatEffects(effects) {
        const parts = [];
        
        // 属性变化
        if (effects.attributes) {
            const attrChanges = [];
            for (const [attr, value] of Object.entries(effects.attributes)) {
                if (value !== 0) {
                    const sign = value > 0 ? '+' : '';
                    const name = this.getAttributeName(attr);
                    attrChanges.push(`${name} ${sign}${value}`);
                }
            }
            if (attrChanges.length > 0) {
                parts.push(`📊 ${attrChanges.join(', ')}`);
            }
        }
        
        // 人格变化
        if (effects.personality) {
            const personalityChanges = [];
            for (const [trait, value] of Object.entries(effects.personality)) {
                if (value !== 0) {
                    const sign = value > 0 ? '+' : '';
                    const name = this.getPersonalityName(trait);
                    personalityChanges.push(`${name} ${sign}${value}`);
                }
            }
            if (personalityChanges.length > 0) {
                parts.push(`🎭 ${personalityChanges.join(', ')}`);
            }
        }
        
        // 状态变化
        if (effects.status) {
            const statusChanges = [];
            for (const [stat, value] of Object.entries(effects.status)) {
                if (value !== 0) {
                    const sign = value > 0 ? '+' : '';
                    const name = this.getStatusName(stat);
                    statusChanges.push(`${name} ${sign}${value}`);
                }
            }
            if (statusChanges.length > 0) {
                parts.push(`💫 ${statusChanges.join(', ')}`);
            }
        }
        
        // 技能获得
        if (effects.skills && effects.skills.length > 0) {
            parts.push(`🎯 获得技能: ${effects.skills.join(', ')}`);
        }
        
        // 物品获得
        if (effects.items && effects.items.length > 0) {
            parts.push(`🎒 获得物品: ${effects.items.join(', ')}`);
        }
        
        // 称号获得
        if (effects.titles && effects.titles.length > 0) {
            parts.push(`👑 获得称号: ${effects.titles.join(', ')}`);
        }
        
        // 成就解锁
        if (effects.achievements && effects.achievements.length > 0) {
            parts.push(`🏆 解锁成就: ${effects.achievements.join(', ')}`);
        }
        
        return parts.join('<br>');
    }

    /**
     * 获取属性中文名
     */
    getAttributeName(attr) {
        const names = {
            strength: '力量',
            intelligence: '智力',
            dexterity: '敏捷',
            constitution: '体质',
            charisma: '魅力',
            luck: '幸运'
        };
        return names[attr] || attr;
    }

    /**
     * 获取人格特征中文名
     */
    getPersonalityName(trait) {
        const names = {
            courage: '勇气',
            wisdom: '智慧',
            compassion: '慈悲',
            ambition: '野心',
            curiosity: '好奇心',
            patience: '耐心',
            pride: '自尊',
            loyalty: '忠诚'
        };
        return names[trait] || trait;
    }

    /**
     * 获取状态中文名
     */
    getStatusName(stat) {
        const names = {
            hp: '生命值',
            mp: '魔法值',
            wealth: '财富',
            experience: '经验',
            fatigue: '疲劳'
        };
        return names[stat] || stat;
    }

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        if (this.logContainer) {
            this.logContainer.scrollTop = this.logContainer.scrollHeight;
        }
    }

    /**
     * 导出故事为小说格式
     */
    exportStoryAsNovel(character) {
        const title = `《${character.name}的${character.getStorylineName()}之旅》`;
        const author = `作者：AI冒险模拟器`;
        const date = `创作时间：${new Date().toLocaleDateString()}`;
        
        let novel = `${title}\n${author}\n${date}\n\n`;
        
        // 角色介绍
        novel += `=== 角色档案 ===\n\n`;
        novel += `姓名：${character.name}\n`;
        novel += `职业：${character.getProfessionName()}\n`;
        novel += `剧情：${character.getStorylineName()}\n`;
        novel += `等级：${character.level}\n\n`;
        
        // 属性信息
        novel += `【基础属性】\n`;
        novel += `力量：${character.attributes.strength} | 智力：${character.attributes.intelligence} | 敏捷：${character.attributes.dexterity}\n`;
        novel += `体质：${character.attributes.constitution} | 魅力：${character.attributes.charisma} | 幸运：${character.attributes.luck}\n\n`;
        
        // 人格特征
        novel += `【人格特征】\n`;
        novel += `勇气：${character.personality.courage} | 智慧：${character.personality.wisdom} | 慈悲：${character.personality.compassion}\n`;
        novel += `野心：${character.personality.ambition} | 好奇心：${character.personality.curiosity} | 耐心：${character.personality.patience}\n`;
        novel += `自尊：${character.personality.pride} | 忠诚：${character.personality.loyalty}\n\n`;
        
        novel += `=== 冒险故事 ===\n\n`;
        
        // 按章节组织故事
        let currentChapter = 1;
        let chapterEventCount = 0;
        
        this.storyLog.forEach((entry, index) => {
            // 每10个事件为一章
            if (chapterEventCount === 0) {
                novel += `第${currentChapter}章\n\n`;
            }
            
            // 添加时间戳
            novel += `【第${entry.gameTime}】\n`;
            
            // 添加故事内容
            novel += `${entry.content}\n`;
            
            // 添加影响（如果有）
            if (entry.effects && this.hasSignificantEffects(entry.effects)) {
                const effectsText = this.formatEffectsForNovel(entry.effects);
                if (effectsText) {
                    novel += `\n（${effectsText}）\n`;
                }
            }
            
            novel += `\n`;
            
            chapterEventCount++;
            if (chapterEventCount >= 10) {
                chapterEventCount = 0;
                currentChapter++;
                novel += `\n`;
            }
        });
        
        // 结尾统计
        novel += `=== 冒险总结 ===\n\n`;
        novel += `总游戏时长：${this.formatGameTime(Date.now() - this.gameStartTime)}\n`;
        novel += `经历事件：${this.storyLog.length}个\n`;
        novel += `当前等级：${character.level}\n`;
        novel += `总经验值：${character.experience}\n\n`;
        
        novel += `--- 故事完 ---\n`;
        novel += `\n感谢您使用AI冒险模拟器！\n`;
        novel += `这是一个由人工智能生成的独特冒险故事。\n`;
        
        return novel;
    }

    /**
     * 为小说格式化影响文本
     */
    formatEffectsForNovel(effects) {
        const parts = [];
        
        // 属性变化
        if (effects.attributes) {
            for (const [attr, value] of Object.entries(effects.attributes)) {
                if (value !== 0) {
                    const name = this.getAttributeName(attr);
                    if (value > 0) {
                        parts.push(`${name}得到了提升`);
                    } else {
                        parts.push(`${name}有所下降`);
                    }
                }
            }
        }
        
        // 技能和物品
        if (effects.skills && effects.skills.length > 0) {
            parts.push(`学会了${effects.skills.join('、')}`);
        }
        
        if (effects.items && effects.items.length > 0) {
            parts.push(`获得了${effects.items.join('、')}`);
        }
        
        if (effects.titles && effects.titles.length > 0) {
            parts.push(`获得了${effects.titles.join('、')}的称号`);
        }
        
        return parts.join('，');
    }

    /**
     * 下载故事文件
     */
    downloadStory(character) {
        const story = this.exportStoryAsNovel(character);
        const blob = new Blob([story], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.name}的${character.getStorylineName()}之旅.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📖 故事已导出为小说文件');
    }
}

console.log('🎨 UI管理器已加载');
