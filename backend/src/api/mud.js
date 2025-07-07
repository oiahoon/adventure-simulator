const express = require('express');
const router = express.Router();
const MUDLLMService = require('../services/MUDLLMService');

// 初始化MUD专用LLM服务
const mudLLMService = new MUDLLMService();

/**
 * 生成NPC对话
 * POST /api/mud/npc/dialogue
 */
router.post('/npc/dialogue', async (req, res) => {
    try {
        const { npcInfo, playerInfo, context } = req.body;
        
        if (!npcInfo || !playerInfo) {
            return res.status(400).json({
                error: '缺少必要参数',
                required: ['npcInfo', 'playerInfo']
            });
        }

        console.log(`🗣️ 生成NPC对话: ${npcInfo.name} vs ${playerInfo.name}`);

        const dialogue = await mudLLMService.generateNPCDialogue(npcInfo, playerInfo, context || {});

        res.json({
            success: true,
            dialogue: dialogue,
            generated_at: new Date().toISOString(),
            source: 'MUD_LLM'
        });

    } catch (error) {
        console.error('NPC对话生成失败:', error);
        res.status(500).json({
            error: 'NPC对话生成失败',
            message: error.message
        });
    }
});

/**
 * 生成门派事件
 * POST /api/mud/sect/event
 */
router.post('/sect/event', async (req, res) => {
    try {
        const { sectInfo, playerSectStatus, eventType } = req.body;
        
        if (!sectInfo || !playerSectStatus) {
            return res.status(400).json({
                error: '缺少必要参数',
                required: ['sectInfo', 'playerSectStatus']
            });
        }

        console.log(`🏛️ 生成门派事件: ${sectInfo.name} - ${eventType || 'general'}`);

        const event = await mudLLMService.generateSectEvent(sectInfo, playerSectStatus, eventType);

        res.json({
            success: true,
            event: event,
            generated_at: new Date().toISOString(),
            source: 'MUD_LLM'
        });

    } catch (error) {
        console.error('门派事件生成失败:', error);
        res.status(500).json({
            error: '门派事件生成失败',
            message: error.message
        });
    }
});

/**
 * 生成江湖传闻
 * POST /api/mud/rumor/generate
 */
router.post('/rumor/generate', async (req, res) => {
    try {
        const { worldContext, rumorType } = req.body;
        
        console.log(`📰 生成江湖传闻: ${rumorType || 'general'}`);

        const rumor = await mudLLMService.generateJianghuRumor(worldContext || {}, rumorType);

        res.json({
            success: true,
            rumor: rumor,
            generated_at: new Date().toISOString(),
            source: 'MUD_LLM'
        });

    } catch (error) {
        console.error('江湖传闻生成失败:', error);
        res.status(500).json({
            error: '江湖传闻生成失败',
            message: error.message
        });
    }
});

/**
 * 生成武功秘籍
 * POST /api/mud/martial-arts/generate
 */
router.post('/martial-arts/generate', async (req, res) => {
    try {
        const { martialType, sectStyle, playerLevel, playerAttributes } = req.body;
        
        if (!martialType || !playerLevel) {
            return res.status(400).json({
                error: '缺少必要参数',
                required: ['martialType', 'playerLevel']
            });
        }

        console.log(`⚔️ 生成武功秘籍: ${martialType} - ${sectStyle || 'general'}`);

        const martialArts = await mudLLMService.generateMartialArts(
            martialType, 
            sectStyle || 'general', 
            playerLevel, 
            playerAttributes || {}
        );

        res.json({
            success: true,
            martial_arts: martialArts,
            generated_at: new Date().toISOString(),
            source: 'MUD_LLM'
        });

    } catch (error) {
        console.error('武功生成失败:', error);
        res.status(500).json({
            error: '武功生成失败',
            message: error.message
        });
    }
});

/**
 * 生成江湖奇遇
 * POST /api/mud/encounter/generate
 */
router.post('/encounter/generate', async (req, res) => {
    try {
        const { location, playerState, encounterType } = req.body;
        
        if (!location || !playerState) {
            return res.status(400).json({
                error: '缺少必要参数',
                required: ['location', 'playerState']
            });
        }

        console.log(`🎭 生成江湖奇遇: ${location} - ${encounterType || 'mystery'}`);

        const encounter = await mudLLMService.generateAdventureEncounter(
            location, 
            playerState, 
            encounterType || 'mystery'
        );

        res.json({
            success: true,
            encounter: encounter,
            generated_at: new Date().toISOString(),
            source: 'MUD_LLM'
        });

    } catch (error) {
        console.error('江湖奇遇生成失败:', error);
        res.status(500).json({
            error: '江湖奇遇生成失败',
            message: error.message
        });
    }
});

/**
 * 批量生成MUD内容
 * POST /api/mud/batch/generate
 */
router.post('/batch/generate', async (req, res) => {
    try {
        const { contentTypes, count = 5, context } = req.body;
        
        if (!contentTypes || !Array.isArray(contentTypes)) {
            return res.status(400).json({
                error: '缺少内容类型',
                required: ['contentTypes (array)']
            });
        }

        console.log(`🔄 批量生成MUD内容: ${contentTypes.join(', ')} x${count}`);

        const results = {};
        
        for (const contentType of contentTypes) {
            results[contentType] = [];
            
            for (let i = 0; i < count; i++) {
                try {
                    let content;
                    
                    switch (contentType) {
                        case 'rumor':
                            content = await mudLLMService.generateJianghuRumor(context?.worldContext || {});
                            break;
                        case 'encounter':
                            content = await mudLLMService.generateAdventureEncounter(
                                context?.location || '江湖',
                                context?.playerState || { level: 5 }
                            );
                            break;
                        case 'martial_arts':
                            content = await mudLLMService.generateMartialArts(
                                context?.martialType || 'sword',
                                context?.sectStyle || 'general',
                                context?.playerLevel || 5,
                                context?.playerAttributes || {}
                            );
                            break;
                        default:
                            continue;
                    }
                    
                    if (content) {
                        results[contentType].push(content);
                    }
                    
                    // 避免API限制
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (error) {
                    console.error(`生成${contentType}第${i+1}个内容失败:`, error);
                }
            }
        }

        res.json({
            success: true,
            results: results,
            generated_count: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('批量生成失败:', error);
        res.status(500).json({
            error: '批量生成失败',
            message: error.message
        });
    }
});

/**
 * 获取MUD服务状态
 * GET /api/mud/status
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        service: 'MUD LLM Service',
        available: mudLLMService.isAvailable(),
        features: [
            'NPC对话生成',
            '门派事件生成',
            '江湖传闻生成',
            '武功秘籍生成',
            '江湖奇遇生成',
            '批量内容生成'
        ],
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
