const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 导入路由
const eventsRouter = require('./api/events');
const charactersRouter = require('./api/characters');
const gameRouter = require('./api/game');
const mudRouter = require('./api/mud'); // 新增MUD专用路由

// 使用路由
app.use('/api/events', eventsRouter);
app.use('/api/characters', charactersRouter);
app.use('/api/game', gameRouter);
app.use('/api/mud', mudRouter); // 新增MUD API路由

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: '江湖奇缘后端API',
        features: {
            basic_events: true,
            llm_generation: true,
            mud_features: true,
            npc_dialogue: true,
            sect_system: true,
            reputation_system: true
        }
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: '江湖奇缘 - 智能文字MUD游戏后端API',
        version: '1.0.0',
        description: '基于LLM的武侠文字MUD游戏，参考北大侠客行等经典MUD设计',
        endpoints: {
            health: '/api/health',
            events: '/api/events',
            characters: '/api/characters',
            game: '/api/game',
            mud: {
                npc_dialogue: '/api/mud/npc/dialogue',
                sect_events: '/api/mud/sect/event',
                rumors: '/api/mud/rumor/generate',
                martial_arts: '/api/mud/martial-arts/generate',
                encounters: '/api/mud/encounter/generate',
                batch: '/api/mud/batch/generate',
                status: '/api/mud/status'
            }
        },
        features: [
            '🤖 DeepSeek LLM集成',
            '🏛️ 门派系统',
            '🗣️ 动态NPC对话',
            '📰 江湖传闻生成',
            '⚔️ 武功秘籍创造',
            '🎭 江湖奇遇生成',
            '🏆 声望系统',
            '📊 批量内容生成'
        ]
    });
});

// 错误处理中间件
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
        path: req.originalUrl,
        available_endpoints: [
            '/api/health',
            '/api/events/*',
            '/api/characters/*',
            '/api/game/*',
            '/api/mud/*'
        ]
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 江湖奇缘后端API服务器启动成功`);
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`🏥 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`📚 API文档: http://localhost:${PORT}/`);
    console.log(`🏮 MUD功能: http://localhost:${PORT}/api/mud/status`);
    console.log('');
    console.log('🎮 支持的MUD功能:');
    console.log('  🗣️  NPC动态对话生成');
    console.log('  🏛️  门派事件和任务');
    console.log('  📰 江湖传闻和消息');
    console.log('  ⚔️  武功秘籍创造');
    console.log('  🎭 江湖奇遇生成');
    console.log('  🏆 声望系统集成');
});

module.exports = app;
