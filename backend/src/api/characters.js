const express = require('express');
const router = express.Router();

/**
 * 获取角色信息
 * GET /api/characters/:id
 */
router.get('/:id', (req, res) => {
    // 这里可以从数据库获取角色信息
    res.json({
        success: true,
        message: '角色API - 开发中'
    });
});

/**
 * 保存角色状态
 * POST /api/characters/:id/save
 */
router.post('/:id/save', (req, res) => {
    // 这里可以保存角色状态到数据库
    res.json({
        success: true,
        message: '角色保存成功'
    });
});

module.exports = router;
