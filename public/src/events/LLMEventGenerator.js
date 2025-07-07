/**
 * 前端LLM事件生成器
 * 通过后端API调用LLM服务
 */
class LLMEventGenerator {
    constructor() {
        this.apiEndpoint = this.getApiEndpoint();
        this.isEnabled = false;
        this.rateLimitDelay = 2000; // 2秒限制
        this.lastCallTime = 0;
        
        // 检查后端API可用性
        this.checkAvailability();
        
        console.log('🤖 前端LLM事件生成器初始化完成');
    }

    /**
     * 获取API端点
     */
    getApiEndpoint() {
        // 根据环境确定API地址
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
        // Vercel部署环境
        return '/api';
    }

    /**
     * 检查后端API可用性
     */
    async checkAvailability() {
        // 在前端部署中禁用API调用
        console.log('🔧 前端部署模式，跳过LLM API检查');
        this.isEnabled = false;
        return false;
    }

    /**
     * 生成LLM事件
     */
    async generateEvent(gameState) {
        if (!this.isEnabled) {
            console.log('🚫 LLM服务不可用，跳过生成');
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

            console.log('🔗 调用后端API生成LLM事件...');
            this.lastCallTime = now;

            const response = await fetch(`${this.apiEndpoint}/events/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    character: {
                        name: character.name,
                        profession: character.profession,
                        level: character.level,
                        attributes: character.attributes,
                        status: character.status
                    },
                    location: location,
                    context: {
                        gameTime: gameState.gameTime,
                        recentEvents: gameState.recentEvents || []
                    }
                }),
                timeout: 30000 // 30秒超时
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API调用失败: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success && data.events && data.events.length > 0) {
                const event = data.events[0]; // 取第一个事件
                console.log('🎭 LLM事件生成成功:', event.title);
                return event;
            } else {
                console.warn('⚠️ API返回了空的事件列表');
                return null;
            }

        } catch (error) {
            console.warn('❌ LLM事件生成失败:', error.message);
            
            // 如果是网络错误，暂时禁用服务
            if (error.message.includes('fetch') || error.message.includes('network')) {
                this.isEnabled = false;
                console.log('🚫 网络错误，暂时禁用LLM服务');
            }
            
            return null;
        }
    }

    /**
     * 获取随机预生成事件
     */
    async getRandomEvent(character, location) {
        if (!this.isEnabled) {
            return null;
        }

        try {
            const response = await fetch(
                `${this.apiEndpoint}/events/random?level=${character.level}&location=${encodeURIComponent(location)}`,
                { timeout: 10000 }
            );

            if (!response.ok) {
                throw new Error(`获取随机事件失败: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.event) {
                console.log('📚 获取预生成事件成功:', data.event.title);
                return data.event;
            }

            return null;

        } catch (error) {
            console.warn('获取随机事件失败:', error.message);
            return null;
        }
    }

    /**
     * 检查是否应该使用LLM生成
     */
    shouldUseLLM(gameState) {
        if (!this.isEnabled) {
            return false;
        }

        const character = gameState.character;
        let probability = 0.2; // 基础20%概率

        // 根据角色等级调整概率
        if (character.level >= 3) probability += 0.1;
        if (character.level >= 6) probability += 0.1;
        if (character.level >= 10) probability += 0.1;

        // 特殊地点增加概率
        const specialLocations = ['遗迹', '洞穴', '神秘森林', '古老神庙', '江湖秘境'];
        if (specialLocations.includes(gameState.currentLocation)) {
            probability += 0.2;
        }

        // 开发环境增加概率
        if (window.location.hostname === 'localhost') {
            probability += 0.3;
        }

        return Math.random() < probability;
    }

    /**
     * 重新检查API可用性
     */
    async recheckAvailability() {
        await this.checkAvailability();
        return this.isEnabled;
    }
}

// 全局实例
window.LLMEventGenerator = LLMEventGenerator;
