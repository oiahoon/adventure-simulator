const express = require('express');
const router = express.Router();

/**
 * 获取游戏状态
 * GET /api/game/status
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        server_time: new Date().toISOString(),
        version: '1.0.0'
    });
});

/**
 * 保存游戏状态
 * POST /api/game/save
 */
router.post('/save', (req, res) => {
    // 这里可以保存游戏状态
    res.json({
        success: true,
        message: '游戏状态保存成功'
    });
});

module.exports = router;
