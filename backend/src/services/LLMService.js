const axios = require('axios');

class LLMService {
    constructor() {
        this.apiKey = process.env.DEEPSEEK_TOKEN;
        this.baseURL = 'https://api.deepseek.com/v1';
        this.model = 'deepseek-chat';
        this.rateLimitDelay = 1000; // 1秒延迟
        this.lastCallTime = 0;
        
        if (!this.apiKey) {
            console.warn('⚠️ DEEPSEEK_TOKEN未设置，LLM功能将不可用');
        } else {
            console.log('✅ DeepSeek LLM服务初始化成功');
        }
    }

    /**
     * 检查服务是否可用
     */
    isAvailable() {
        return !!this.apiKey;
    }

    /**
     * 生成武侠风格的事件
     */
    async generateWuxiaEvent(character, location, context = {}) {
        if (!this.isAvailable()) {
            throw new Error('LLM服务不可用：缺少API密钥');
        }

        // 速率限制
        await this.enforceRateLimit();

        const prompt = this.buildWuxiaPrompt(character, location, context);
        
        try {
            console.log('🤖 调用DeepSeek API生成武侠事件...');
            
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的武侠小说作家和游戏设计师，擅长创造引人入胜的江湖故事。请严格按照JSON格式返回结果，确保所有数值都是数字类型。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.9,
                    max_tokens: 2000,
                    top_p: 0.95
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            const content = response.data.choices[0].message.content;
            return this.parseEventResponse(content);

        } catch (error) {
            console.error('DeepSeek API调用失败:', error.response?.data || error.message);
            throw new Error(`LLM事件生成失败: ${error.message}`);
        }
    }

    /**
     * 构建武侠风格的提示词
     */
    buildWuxiaPrompt(character, location, context) {
        return `请为武侠MUD游戏生成一个精彩的江湖事件。

【角色信息】
- 姓名：${character.name}
- 职业：${this.getProfessionDescription(character.profession)}
- 等级：${character.level}级
- 当前地点：${location}
- 主要属性：力量${character.attributes?.strength || 10}，智力${character.attributes?.intelligence || 10}，敏捷${character.attributes?.dexterity || 10}
- 当前状态：生命值${character.status?.hp || 100}，财富${character.status?.wealth || 0}两银子

【事件要求】
1. 符合${location}的环境特色和武侠氛围
2. 适合${character.level}级角色的挑战难度
3. 包含生动的对话和情节描述（150-250字）
4. 体现江湖儿女的恩怨情仇
5. 奖励要合理且有吸引力

【输出格式】
请严格按照以下JSON格式返回，确保所有数值都是数字类型：

{
  "events": [
    {
      "title": "事件标题（体现武侠特色）",
      "description": "详细的事件描述，包含对话和情节发展，体现江湖氛围",
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

注意：请确保JSON格式完全正确，所有数值都是数字类型，数组即使为空也要包含。`;
    }

    /**
     * 获取职业描述
     */
    getProfessionDescription(profession) {
        const descriptions = {
            warrior: '武者 - 刀剑双绝的江湖侠客',
            mage: '术士 - 精通奇门遁甲的方外高人',
            rogue: '游侠 - 身轻如燕的江湖浪子',
            priest: '僧侣 - 武功高强的出家人',
            ranger: '猎户 - 野外生存的山林好汉',
            noble: '文士 - 博学多才的书香门第'
        };
        return descriptions[profession] || '江湖人士';
    }

    /**
     * 解析LLM响应
     */
    parseEventResponse(content) {
        try {
            // 尝试提取JSON部分
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('响应中未找到JSON格式');
            }

            const jsonStr = jsonMatch[0];
            const parsed = JSON.parse(jsonStr);

            if (!parsed.events || !Array.isArray(parsed.events)) {
                throw new Error('响应格式不正确：缺少events数组');
            }

            // 验证和修复事件数据
            return parsed.events.map(event => this.validateAndFixEvent(event));

        } catch (error) {
            console.error('解析LLM响应失败:', error);
            console.log('原始响应:', content);
            throw new Error(`响应解析失败: ${error.message}`);
        }
    }

    /**
     * 验证和修复事件数据
     */
    validateAndFixEvent(event) {
        const fixed = {
            id: `llm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: event.title || '江湖奇遇',
            description: event.description || '在江湖中遇到了一些有趣的事情。',
            type: 'llm_generated',
            effects: {
                status: {
                    experience: parseInt(event.effects?.status?.experience) || 20,
                    wealth: parseInt(event.effects?.status?.wealth) || 0,
                    hp: parseInt(event.effects?.status?.hp) || 0,
                    mp: parseInt(event.effects?.status?.mp) || 0
                },
                attributes: event.effects?.attributes || {},
                items: Array.isArray(event.effects?.items) ? event.effects.items : [],
                skills: Array.isArray(event.effects?.skills) ? event.effects.skills : [],
                social: event.effects?.social || {}
            },
            rarity: event.rarity || 'common',
            impact_description: event.impact_description || '获得了一些经验',
            source: 'DeepSeek LLM',
            generated_at: new Date().toISOString()
        };

        return fixed;
    }

    /**
     * 强制执行速率限制
     */
    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;
        
        if (timeSinceLastCall < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastCall;
            console.log(`⏳ 速率限制：等待 ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastCallTime = Date.now();
    }
}

module.exports = LLMService;
