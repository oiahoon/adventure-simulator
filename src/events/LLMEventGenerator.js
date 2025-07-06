/**
 * 前端LLM事件生成器
 * 集成DeepSeek等LLM服务进行实时事件生成
 */
class LLMEventGenerator {
    constructor() {
        this.apiEndpoint = '/api/generate-events'; // 后端API端点
        this.isEnabled = false;
        this.rateLimitDelay = 2000; // 2秒限制
        this.lastCallTime = 0;
        
        // 检查是否可以使用LLM服务
        this.checkAvailability();
        
        console.log('🤖 LLM事件生成器初始化完成');
    }

    /**
     * 检查LLM服务可用性
     */
    async checkAvailability() {
        try {
            // 在开发环境下启用
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                this.isEnabled = true;
                console.log('✅ LLM事件生成器已启用（开发环境）');
            } else {
                // 生产环境下检查API可用性
                const response = await fetch('/api/health', { method: 'HEAD' });
                this.isEnabled = response.ok;
                console.log(this.isEnabled ? '✅ LLM事件生成器已启用' : '⚠️ LLM服务不可用');
            }
        } catch (error) {
            console.warn('⚠️ LLM服务检查失败，禁用LLM生成:', error);
            this.isEnabled = false;
        }
    }

    /**
     * 生成LLM事件
     */
    async generateEvent(gameState) {
        if (!this.isEnabled) {
            return null;
        }

        // 速率限制
        const now = Date.now();
        if (now - this.lastCallTime < this.rateLimitDelay) {
            console.log('⏳ LLM调用受速率限制，跳过');
            return null;
        }

        try {
            const character = gameState.character;
            const location = gameState.currentLocation;

            const prompt = this.buildPrompt(character, location, gameState);
            
            console.log('🔗 调用LLM生成事件...');
            this.lastCallTime = now;

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    character: {
                        name: character.name,
                        level: character.level,
                        profession: character.getProfessionName(),
                        location: location
                    }
                }),
                timeout: 15000 // 15秒超时
            });

            if (!response.ok) {
                throw new Error(`API调用失败: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.events && data.events.length > 0) {
                const event = data.events[0]; // 取第一个事件
                event.source = 'DeepSeek LLM';
                console.log('🎭 LLM事件生成成功:', event.title);
                return event;
            }

            return null;

        } catch (error) {
            console.warn('❌ LLM事件生成失败:', error);
            return null;
        }
    }

    /**
     * 构建LLM提示词
     */
    buildPrompt(character, location, gameState) {
        return `请为RPG游戏生成一个有趣的事件。

角色信息：
- 姓名：${character.name}
- 等级：${character.level}
- 职业：${character.getProfessionName()}
- 当前地点：${location}
- 力量：${character.attributes.strength}
- 智力：${character.attributes.intelligence}
- 敏捷：${character.attributes.dexterity}
- 体质：${character.attributes.constitution}
- 魅力：${character.attributes.charisma}
- 幸运：${character.attributes.luck}
- 当前生命值：${character.status.hp}/${character.getMaxHP()}
- 当前魔法值：${character.status.mp}/${character.getMaxMP()}
- 财富：${character.status.wealth || 0}金币

要求：
1. 生成一个适合当前角色等级和地点的事件
2. 事件应该有有趣的故事情节（100-200字）
3. 提供合理的奖励：经验值、金币、物品、属性提升等
4. 奖励应该与角色等级相匹配
5. 事件应该符合${location}的环境特点

请严格按照以下JSON格式返回：
{
  "events": [
    {
      "title": "事件标题",
      "description": "详细的事件描述，包含对话和情节发展",
      "effects": {
        "status": {
          "experience": 30,
          "wealth": 20,
          "hp": 0,
          "mp": 0
        },
        "attributes": {
          "strength": 0,
          "intelligence": 0,
          "dexterity": 0,
          "constitution": 0,
          "charisma": 0,
          "luck": 0
        },
        "items": [],
        "skills": [],
        "social": {
          "reputation": 0
        }
      },
      "rarity": "common",
      "impact_description": "对角色造成的具体影响描述"
    }
  ]
}

注意：请确保JSON格式正确，所有数值都是数字类型，数组即使为空也要包含。`;
    }

    /**
     * 检查是否应该使用LLM生成
     */
    shouldUseLLM(gameState) {
        if (!this.isEnabled) {
            return false;
        }

        // 根据角色等级调整LLM使用概率
        const character = gameState.character;
        let probability = 0.3; // 基础30%概率

        // 高等级角色更容易触发LLM事件
        if (character.level >= 5) {
            probability += 0.2;
        }
        if (character.level >= 10) {
            probability += 0.2;
        }

        // 特殊地点增加概率
        const specialLocations = ['遗迹', '洞穴', '神秘森林', '古老神庙'];
        if (specialLocations.includes(gameState.currentLocation)) {
            probability += 0.3;
        }

        return Math.random() < probability;
    }
}

// 全局实例
window.LLMEventGenerator = LLMEventGenerator;
