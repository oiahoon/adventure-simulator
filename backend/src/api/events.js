const express = require('express');
const router = express.Router();
const LLMService = require('../services/LLMService');
const EventGenerator = require('../services/EventGenerator');

// 初始化服务
const llmService = new LLMService();
const eventGenerator = new EventGenerator(llmService);

/**
 * 生成新事件
 * POST /api/events/generate
 */
router.post('/generate', async (req, res) => {
    try {
        const { character, location, context } = req.body;
        
        if (!character || !location) {
            return res.status(400).json({
                error: '缺少必要参数',
                required: ['character', 'location']
            });
        }

        console.log(`🎭 生成事件请求: ${character.name} (${character.profession}) 在 ${location}`);

        // 使用LLM生成事件
        const events = await eventGenerator.generateEvents({
            character,
            location,
            context: context || {}
        });

        if (!events || events.length === 0) {
            return res.status(500).json({
                error: '事件生成失败',
                message: '无法生成合适的事件，请稍后重试'
            });
        }

        console.log(`✅ 成功生成 ${events.length} 个事件`);

        res.json({
            success: true,
            events: events,
            generated_at: new Date().toISOString(),
            source: 'LLM'
        });

    } catch (error) {
        console.error('事件生成API错误:', error);
        res.status(500).json({
            error: '事件生成失败',
            message: error.message
        });
    }
});

/**
 * 获取预生成的事件
 * GET /api/events/random
 */
router.get('/random', async (req, res) => {
    try {
        const { level, location, type } = req.query;
        
        // 从数据库获取随机事件
        const event = await eventGenerator.getRandomEvent({
            characterLevel: parseInt(level) || 1,
            location: location || '新手村',
            type: type
        });

        if (!event) {
            return res.status(404).json({
                error: '没有找到合适的事件',
                message: '请尝试其他条件'
            });
        }

        res.json({
            success: true,
            event: event,
            source: 'Database'
        });

    } catch (error) {
        console.error('获取随机事件错误:', error);
        res.status(500).json({
            error: '获取事件失败',
            message: error.message
        });
    }
});

/**
 * 批量生成事件（管理员功能）
 * POST /api/events/batch-generate
 */
router.post('/batch-generate', async (req, res) => {
    try {
        const { count = 10, characters, locations } = req.body;
        
        console.log(`🔄 开始批量生成 ${count} 个事件`);
        
        const results = await eventGenerator.batchGenerateEvents({
            count,
            characters: characters || [
                { name: '测试武者', profession: 'warrior', level: 1 },
                { name: '测试术士', profession: 'mage', level: 1 }
            ],
            locations: locations || ['新手村', '小镇', '森林']
        });

        res.json({
            success: true,
            generated_count: results.length,
            events: results,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('批量生成事件错误:', error);
        res.status(500).json({
            error: '批量生成失败',
            message: error.message
        });
    }
});

/**
 * 获取事件统计信息
 * GET /api/events/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await eventGenerator.getEventStats();
        
        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('获取事件统计错误:', error);
        res.status(500).json({
            error: '获取统计失败',
            message: error.message
        });
    }
});

module.exports = router;
