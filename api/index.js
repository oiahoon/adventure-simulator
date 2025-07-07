const express = require('express');
const cors = require('cors');

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 简单的LLM服务类
class SimpleLLMService {
    constructor() {
        this.apiKey = process.env.DEEPSEEK_TOKEN;
        this.baseURL = 'https://api.deepseek.com/v1';
    }

    isAvailable() {
        return !!this.apiKey;
    }

    async generateWuxiaEvent(character, location, context = {}) {
        if (!this.isAvailable()) {
            throw new Error('LLM服务不可用：缺少API密钥');
        }

        const prompt = `请为武侠MUD游戏生成一个事件。

角色信息：
- 姓名：${character.name}
- 等级：${character.level}
- 职业：${character.profession}
- 当前地点：${location}

请生成一个适合的武侠风格事件，包含：
1. 事件标题
2. 详细描述（150-200字）
3. 奖励设置

输出JSON格式：
{
  "title": "事件标题",
  "description": "详细描述",
  "effects": {
    "status": {
      "experience": 30,
      "wealth": 20
    }
  },
  "rarity": "common"
}`;

        try {
            const axios = require('axios');
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是专业的武侠小说作家和游戏设计师。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.9,
                    max_tokens: 2000
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
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    ...parsed,
                    id: `llm_${Date.now()}`,
                    source: 'DeepSeek LLM',
                    generated_at: new Date().toISOString()
                };
            }
            
            throw new Error('无法解析LLM响应');

        } catch (error) {
            console.error('LLM API调用失败:', error);
            throw error;
        }
    }
}

// 初始化LLM服务
const llmService = new SimpleLLMService();

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: '江湖奇缘后端API',
        llm_available: llmService.isAvailable()
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: '江湖奇缘 - 智能文字MUD游戏后端API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            events: '/api/events/generate'
        }
    });
});

// 事件生成API
app.post('/api/events/generate', async (req, res) => {
    try {
        const { character, location, context } = req.body;
        
        if (!character || !location) {
            return res.status(400).json({
                error: '缺少必要参数',
                required: ['character', 'location']
            });
        }

        console.log(`🎭 生成事件请求: ${character.name} 在 ${location}`);

        const event = await llmService.generateWuxiaEvent(character, location, context);

        res.json({
            success: true,
            events: [event],
            generated_at: new Date().toISOString(),
            source: 'LLM'
        });

    } catch (error) {
        console.error('事件生成失败:', error);
        res.status(500).json({
            error: '事件生成失败',
            message: error.message
        });
    }
});

// MUD状态API
app.get('/api/mud/status', (req, res) => {
    res.json({
        success: true,
        service: 'MUD LLM Service',
        available: llmService.isAvailable(),
        features: [
            'LLM事件生成',
            '武侠风格内容',
            '动态剧情创造'
        ],
        version: '1.0.0'
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('API错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        error: '接口不存在',
        path: req.originalUrl
    });
});

// 导出为Vercel函数
module.exports = app;
