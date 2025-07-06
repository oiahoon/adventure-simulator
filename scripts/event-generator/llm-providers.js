/**
 * 多LLM提供商管理器
 * 支持DeepSeek、OpenAI、Claude、Gemini等多个LLM服务
 */

const axios = require('axios');

class LLMProviders {
    constructor() {
        this.providers = this.initializeProviders();
    }

    /**
     * 初始化所有LLM提供商
     */
    initializeProviders() {
        const providers = [];

        // DeepSeek (主要提供商)
        if (process.env.DEEPSEEK_TOKEN) {
            providers.push(new DeepSeekProvider(process.env.DEEPSEEK_TOKEN));
        }

        // OpenAI GPT
        if (process.env.OPENAI_API_KEY) {
            providers.push(new OpenAIProvider(process.env.OPENAI_API_KEY));
        }

        // Anthropic Claude
        if (process.env.CLAUDE_API_KEY) {
            providers.push(new ClaudeProvider(process.env.CLAUDE_API_KEY));
        }

        // Google Gemini
        if (process.env.GEMINI_API_KEY) {
            providers.push(new GeminiProvider(process.env.GEMINI_API_KEY));
        }

        return providers;
    }

    /**
     * 获取可用的提供商
     */
    getAvailableProviders() {
        return this.providers.filter(provider => provider.isAvailable());
    }

    /**
     * 获取随机提供商
     */
    getRandomProvider() {
        const available = this.getAvailableProviders();
        if (available.length === 0) {
            throw new Error('没有可用的LLM提供商');
        }
        return available[Math.floor(Math.random() * available.length)];
    }
}

/**
 * 基础LLM提供商类
 */
class BaseLLMProvider {
    constructor(name, apiKey) {
        this.name = name;
        this.apiKey = apiKey;
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.rateLimitDelay = 1000; // 默认1秒延迟
    }

    isAvailable() {
        return !!this.apiKey;
    }

    async generateEvent(prompt) {
        // 实现速率限制
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await this.sleep(this.rateLimitDelay - timeSinceLastRequest);
        }

        this.lastRequestTime = Date.now();
        this.requestCount++;

        return await this.makeRequest(prompt);
    }

    async makeRequest(prompt) {
        throw new Error('子类必须实现 makeRequest 方法');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * DeepSeek提供商
 */
class DeepSeekProvider extends BaseLLMProvider {
    constructor(apiKey) {
        super('DeepSeek', apiKey);
        this.baseURL = 'https://api.deepseek.com/v1';
        this.rateLimitDelay = 1000; // 1秒延迟
    }

    async makeRequest(prompt) {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的游戏设计师，擅长创造有趣和多样化的游戏事件。请严格按照要求的JSON格式返回结果。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.9, // 高创造性
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

            return response.data.choices[0].message.content;

        } catch (error) {
            console.error(`DeepSeek API错误:`, error.response?.data || error.message);
            throw new Error(`DeepSeek请求失败: ${error.message}`);
        }
    }
}

/**
 * OpenAI提供商
 */
class OpenAIProvider extends BaseLLMProvider {
    constructor(apiKey) {
        super('OpenAI', apiKey);
        this.baseURL = 'https://api.openai.com/v1';
        this.rateLimitDelay = 1500; // 1.5秒延迟
    }

    async makeRequest(prompt) {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a creative game designer specializing in generating diverse and interesting game events. Always return results in the requested JSON format.'
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

            return response.data.choices[0].message.content;

        } catch (error) {
            console.error(`OpenAI API错误:`, error.response?.data || error.message);
            throw new Error(`OpenAI请求失败: ${error.message}`);
        }
    }
}

/**
 * Claude提供商
 */
class ClaudeProvider extends BaseLLMProvider {
    constructor(apiKey) {
        super('Claude', apiKey);
        this.baseURL = 'https://api.anthropic.com/v1';
        this.rateLimitDelay = 2000; // 2秒延迟
    }

    async makeRequest(prompt) {
        try {
            const response = await axios.post(
                `${this.baseURL}/messages`,
                {
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 2000,
                    temperature: 0.9,
                    messages: [
                        {
                            role: 'user',
                            content: `You are a creative game designer. ${prompt}`
                        }
                    ]
                },
                {
                    headers: {
                        'x-api-key': this.apiKey,
                        'Content-Type': 'application/json',
                        'anthropic-version': '2023-06-01'
                    },
                    timeout: 30000
                }
            );

            return response.data.content[0].text;

        } catch (error) {
            console.error(`Claude API错误:`, error.response?.data || error.message);
            throw new Error(`Claude请求失败: ${error.message}`);
        }
    }
}

/**
 * Gemini提供商
 */
class GeminiProvider extends BaseLLMProvider {
    constructor(apiKey) {
        super('Gemini', apiKey);
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
        this.rateLimitDelay = 1500; // 1.5秒延迟
    }

    async makeRequest(prompt) {
        try {
            const response = await axios.post(
                `${this.baseURL}/models/gemini-pro:generateContent?key=${this.apiKey}`,
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `You are a creative game designer. ${prompt}`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.9,
                        topP: 0.95,
                        maxOutputTokens: 2000
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            return response.data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error(`Gemini API错误:`, error.response?.data || error.message);
            throw new Error(`Gemini请求失败: ${error.message}`);
        }
    }
}

module.exports = LLMProviders;
