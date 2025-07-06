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

// 使用路由
app.use('/api/events', eventsRouter);
app.use('/api/characters', charactersRouter);
app.use('/api/game', gameRouter);

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: '江湖奇缘后端API'
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: '江湖奇缘 - 智能文字MUD游戏后端API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            events: '/api/events',
            characters: '/api/characters',
            game: '/api/game'
        }
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
        path: req.originalUrl
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 江湖奇缘后端API服务器启动成功`);
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`🏥 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`📚 API文档: http://localhost:${PORT}/`);
});

module.exports = app;
