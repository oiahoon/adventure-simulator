#!/usr/bin/env node

/**
 * 事件生成器 - SQLite数据库版本
 * 使用DeepSeek API生成游戏事件并保存到SQLite数据库
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');
require('dotenv').config();

// 主线剧情类型
const STORYLINES = {
  xianxia: {
    name: '仙侠修真',
    description: '踏上修仙之路，追求长生不老',
    themes: ['修炼', '仙人', '法宝', '天劫', '门派', '丹药', '灵石']
  },
  xuanhuan: {
    name: '玄幻奇缘',
    description: '在神秘的玄幻世界中冒险',
    themes: ['魔法', '异兽', '神器', '血脉', '斗气', '元素', '位面']
  },
  scifi: {
    name: '科幻未来',
    description: '探索未来科技的无限可能',
    themes: ['星际', '机甲', 'AI', '基因', '虚拟现实', '时空', '外星']
  },
  wuxia: {
    name: '武侠江湖',
    description: '行走江湖，快意恩仇',
    themes: ['武功', '江湖', '侠客', '门派', '武林', '剑法', '内功']
  },
  fantasy: {
    name: '西幻冒险',
    description: '在魔法与剑的世界中冒险',
    themes: ['魔法', '龙族', '精灵', '矮人', '骑士', '法师', '冒险']
  }
};

class SQLiteEventGenerator {
    constructor() {
        this.dataDir = path.join(__dirname, '../../src/data');
        this.dbFile = path.join(this.dataDir, 'events.db');
        this.statsFile = path.join(this.dataDir, 'event-stats.json');
        this.maxEvents = 100000;
        this.eventCount = parseInt(process.env.EVENT_COUNT) || 400;
        this.db = null;
        
        console.log('🎲 SQLite事件生成器初始化完成');
    }

    /**
     * 初始化数据库
     */
    async initDatabase() {
        await fs.ensureDir(this.dataDir);
        
        // 创建或打开数据库
        this.db = new Database(this.dbFile);
        
        // 创建表结构
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                storyline TEXT NOT NULL,
                chapter INTEGER DEFAULT 1,
                tags TEXT,
                characters TEXT,
                location TEXT,
                effects TEXT,
                impact_description TEXT,
                rarity TEXT DEFAULT 'common',
                generated BOOLEAN DEFAULT 1,
                generator TEXT DEFAULT 'deepseek',
                timestamp INTEGER NOT NULL,
                version TEXT DEFAULT '1.0',
                used_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_storyline ON events(storyline);
            CREATE INDEX IF NOT EXISTS idx_rarity ON events(rarity);
            CREATE INDEX IF NOT EXISTS idx_timestamp ON events(timestamp);
            CREATE INDEX IF NOT EXISTS idx_used_count ON events(used_count);
            
            CREATE TABLE IF NOT EXISTS generation_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                total_generated INTEGER NOT NULL,
                generation_time DATETIME NOT NULL,
                storyline_counts TEXT,
                rarity_counts TEXT,
                success_rate REAL
            );
        `);
        
        console.log('📊 数据库初始化完成');
    }

    /**
     * 调用DeepSeek API
     */
    async callDeepSeek(prompt) {
        try {
            console.log('🔗 正在调用DeepSeek API...');
            console.log('🔑 API Token长度:', process.env.DEEPSEEK_TOKEN ? process.env.DEEPSEEK_TOKEN.length : 0);
            
            const response = await axios.post(
                'https://api.deepseek.com/v1/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的游戏剧情设计师，擅长创造引人入胜的故事情节。请严格按照JSON格式返回结果。'
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
                        'Authorization': `Bearer ${process.env.DEEPSEEK_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000,
                    validateStatus: function (status) {
                        return status < 500;
                    }
                }
            );

            console.log('📊 API响应状态:', response.status);
            console.log('📊 API响应头:', JSON.stringify(response.headers, null, 2));

            if (response.status !== 200) {
                console.error('❌ API返回非200状态码:', response.status);
                console.error('❌ 响应数据:', JSON.stringify(response.data, null, 2));
                throw new Error(`API返回状态码: ${response.status}, 消息: ${response.statusText}`);
            }

            if (!response.data || !response.data.choices || !response.data.choices[0]) {
                console.error('❌ API返回数据格式错误:', JSON.stringify(response.data, null, 2));
                throw new Error('API返回数据格式错误');
            }

            console.log('✅ API调用成功，内容长度:', response.data.choices[0].message.content.length);
            return response.data.choices[0].message.content;
            
        } catch (error) {
            console.error('❌ DeepSeek API调用详细错误:');
            console.error('错误类型:', error.constructor.name);
            console.error('错误消息:', error.message);
            console.error('错误代码:', error.code);
            
            if (error.response) {
                console.error('响应状态:', error.response.status);
                console.error('响应头:', JSON.stringify(error.response.headers, null, 2));
                console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
            } else if (error.request) {
                console.error('请求配置:', JSON.stringify(error.config, null, 2));
                console.error('无响应，请求详情:', error.request);
            }
            
            throw error; // 重新抛出错误，不生成备用事件
        }
    }

    /**
     * 构建事件生成提示词
     */
    buildEventPrompt(storyline, eventCount) {
        const themes = STORYLINES[storyline].themes.join('、');
        
        return `请为${STORYLINES[storyline].name}类型的游戏生成${eventCount}个事件。

要求：
1. 事件类型：${STORYLINES[storyline].name}
2. 主题元素：${themes}
3. 事件特点：
   - 丰富的故事情节和对话（200-400字）
   - 符合${STORYLINES[storyline].name}的世界观
   - 每个事件可以是纯故事性的，也可以对角色造成影响
   - 影响包括：属性变化、财富变化、社会威望、人格特征、技能获得等
   - 影响必须与事件内容有合理的逻辑关系

请按以下JSON格式返回${eventCount}个事件：
{
  "events": [
    {
      "title": "事件标题",
      "description": "详细的故事描述，包含对话和情节发展",
      "storyline": "${storyline}",
      "chapter": 1,
      "tags": ["标签1", "标签2"],
      "characters": ["角色1", "角色2"],
      "location": "地点描述",
      "effects": {
        "attributes": {"strength": 0, "intelligence": 0, "dexterity": 0, "constitution": 0, "charisma": 0, "luck": 0},
        "personality": {"courage": 0, "wisdom": 0, "compassion": 0, "ambition": 0, "curiosity": 0, "patience": 0, "pride": 0, "loyalty": 0},
        "social": {"reputation": 0, "influence": 0, "karma": 0},
        "status": {"hp": 0, "mp": 0, "wealth": 0, "experience": 0, "fatigue": 0},
        "skills": [], "items": [], "titles": [], "achievements": []
      },
      "rarity": "common",
      "impact_description": "对角色造成的具体影响描述"
    }
  ]
}

现在请生成${eventCount}个${STORYLINES[storyline].name}类型的事件：`;
    }

    /**
     * 主生成流程
     */
    async generate() {
        try {
            console.log('🚀 开始生成事件...');
            
            if (!process.env.DEEPSEEK_TOKEN) {
                throw new Error('DEEPSEEK_TOKEN 环境变量未设置');
            }

            // 初始化数据库
            await this.initDatabase();

            // 获取当前事件数量
            const currentCount = this.db.prepare('SELECT COUNT(*) as count FROM events').get().count;
            console.log(`📚 当前数据库中有 ${currentCount} 个事件`);

            // 生成新事件
            const newEvents = await this.generateNewEvents();
            console.log(`✨ 生成了 ${newEvents.length} 个新事件`);

            // 清理旧事件（如果超过限制）
            await this.cleanupOldEvents();

            // 更新统计信息
            await this.updateStats(newEvents);

            // 关闭数据库连接
            this.db.close();

            console.log('✅ 事件生成完成！');

        } catch (error) {
            console.error('❌ 事件生成失败:', error);
            if (this.db) {
                this.db.close();
            }
            process.exit(1);
        }
    }

    /**
     * 生成新事件
     */
    async generateNewEvents() {
        const newEvents = [];
        const eventsPerStoryline = Math.floor(this.eventCount / Object.keys(STORYLINES).length);
        
        console.log(`📊 计划为每个剧情生成 ${eventsPerStoryline} 个事件`);
        
        // 准备插入语句
        const insertStmt = this.db.prepare(`
            INSERT INTO events (
                id, title, description, storyline, chapter, tags, characters, 
                location, effects, impact_description, rarity, generated, 
                generator, timestamp, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const [storylineId, storyline] of Object.entries(STORYLINES)) {
            console.log(`🔄 开始生成 ${storyline.name} 事件...`);
            
            try {
                const prompt = this.buildEventPrompt(storylineId, eventsPerStoryline);
                console.log(`📝 提示词长度: ${prompt.length} 字符`);
                
                const response = await this.callDeepSeek(prompt);
                console.log(`📥 收到响应，长度: ${response.length} 字符`);
                
                // 解析响应
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    console.error(`❌ ${storyline.name} 响应中未找到JSON格式数据`);
                    console.error('响应内容:', response.substring(0, 500) + '...');
                    throw new Error('响应格式错误：未找到JSON数据');
                }

                console.log(`🔍 找到JSON数据，长度: ${jsonMatch[0].length} 字符`);
                
                let data;
                try {
                    data = JSON.parse(jsonMatch[0]);
                } catch (parseError) {
                    console.error(`❌ ${storyline.name} JSON解析失败:`, parseError.message);
                    console.error('JSON内容:', jsonMatch[0].substring(0, 500) + '...');
                    throw new Error(`JSON解析失败: ${parseError.message}`);
                }

                if (!data.events || !Array.isArray(data.events)) {
                    console.error(`❌ ${storyline.name} 数据结构错误:`, JSON.stringify(data, null, 2));
                    throw new Error('数据结构错误：缺少events数组');
                }

                console.log(`✅ ${storyline.name} 解析成功，获得 ${data.events.length} 个事件`);
                
                // 批量插入事件
                await this.insertEvents(insertStmt, data.events, storylineId);
                newEvents.push(...data.events);
                
                console.log(`💾 ${storyline.name} 已保存 ${data.events.length} 个事件到数据库`);

                // 添加延迟避免API限制
                if (Object.keys(STORYLINES).indexOf(storylineId) < Object.keys(STORYLINES).length - 1) {
                    console.log('⏳ 等待2秒避免API限制...');
                    await this.sleep(2000);
                }

            } catch (error) {
                console.error(`💥 生成 ${storyline.name} 事件失败:`, error.message);
                console.error('详细错误:', error);
                
                // 不生成备用事件，直接失败
                throw new Error(`${storyline.name} 事件生成失败: ${error.message}`);
            }
        }

        console.log(`🎉 总共成功生成 ${newEvents.length} 个事件`);
        return newEvents;
    }

    /**
     * 插入事件到数据库
     */
    async insertEvents(insertStmt, events, storylineId = null) {
        const transaction = this.db.transaction((events) => {
            for (const event of events) {
                const eventId = uuidv4();
                insertStmt.run(
                    eventId,
                    event.title,
                    event.description,
                    storylineId || event.storyline,
                    event.chapter || 1,
                    JSON.stringify(event.tags || []),
                    JSON.stringify(event.characters || []),
                    event.location || '',
                    JSON.stringify(event.effects || {}),
                    event.impact_description || '',
                    event.rarity || 'common',
                    1, // generated
                    'deepseek', // generator
                    Date.now(), // timestamp
                    '1.0' // version
                );
            }
        });
        
        transaction(events);
    }

    /**
     * 生成备用事件（当API失败时使用）
     */
    generateFallbackEvents(storylineId, count) {
        const storyline = STORYLINES[storylineId];
        const events = [];
        
        const templates = {
            xianxia: [
                {
                    title: "山中修炼",
                    description: "你在深山中找到一处灵气充沛的洞府，决定在此修炼。经过数日的打坐吐纳，你感觉内力有所精进。",
                    effects: { attributes: { intelligence: 1, constitution: 1 } }
                },
                {
                    title: "遇见前辈",
                    description: "路遇一位白发苍苍的老者，他看出你有修仙的资质，传授了你一些修炼心得。",
                    effects: { attributes: { wisdom: 2 }, skills: ["基础修炼法"] }
                },
                {
                    title: "采集灵草",
                    description: "在山谷中发现了一株珍贵的灵草，小心采摘后收入囊中，这将对你的修炼大有帮助。",
                    effects: { items: ["灵草"], status: { hp: 10 } }
                }
            ],
            xuanhuan: [
                {
                    title: "魔法试炼",
                    description: "你参加了魔法师公会的试炼，在激烈的魔法对决中展现了自己的实力，获得了认可。",
                    effects: { attributes: { intelligence: 2 }, status: { mp: 15 } }
                },
                {
                    title: "神秘遗迹",
                    description: "探索一座古老的遗迹，在其中发现了失传的魔法知识，你的魔法造诣得到了提升。",
                    effects: { skills: ["元素魔法"], attributes: { intelligence: 1 } }
                }
            ],
            scifi: [
                {
                    title: "科技升级",
                    description: "你获得了最新的科技装备，经过一番研究和调试，成功提升了自己的战斗能力。",
                    effects: { items: ["高科技装备"], attributes: { dexterity: 2 } }
                },
                {
                    title: "数据分析",
                    description: "通过分析大量的数据，你发现了一些重要的模式和规律，这让你的思维更加敏锐。",
                    effects: { attributes: { intelligence: 2 }, skills: ["数据分析"] }
                }
            ],
            wuxia: [
                {
                    title: "武功切磋",
                    description: "与江湖高手切磋武艺，在激烈的对战中你领悟了新的招式，武功更进一步。",
                    effects: { attributes: { strength: 1, dexterity: 1 }, skills: ["新招式"] }
                },
                {
                    title: "侠义之举",
                    description: "路见不平，拔刀相助，你的侠义行为赢得了江湖人士的尊敬。",
                    effects: { personality: { courage: 2, loyalty: 1 }, social: { reputation: 5 } }
                }
            ],
            fantasy: [
                {
                    title: "龙族传说",
                    description: "你听说了古老的龙族传说，这些神秘的故事激发了你的想象力和冒险精神。",
                    effects: { personality: { curiosity: 2 }, attributes: { charisma: 1 } }
                },
                {
                    title: "精灵祝福",
                    description: "善良的精灵为你送上祝福，你感到身心都得到了净化和提升。",
                    effects: { status: { hp: 20, mp: 10 }, personality: { compassion: 1 } }
                }
            ]
        };
        
        const storylineTemplates = templates[storylineId] || templates.xianxia;
        
        for (let i = 0; i < count; i++) {
            const template = storylineTemplates[i % storylineTemplates.length];
            events.push({
                ...template,
                storyline: storylineId,
                chapter: Math.floor(i / 5) + 1,
                tags: storyline.themes.slice(0, 3),
                characters: [],
                location: `${storyline.name}世界`,
                rarity: 'common',
                impact_description: `这次经历让你在${storyline.name}的道路上更进一步。`
            });
        }
        
        return events;
    }

    /**
     * 清理旧事件
     */
    async cleanupOldEvents() {
        const currentCount = this.db.prepare('SELECT COUNT(*) as count FROM events').get().count;
        
        if (currentCount > this.maxEvents) {
            const deleteCount = currentCount - this.maxEvents;
            
            // 删除最老的事件（按timestamp排序）
            this.db.prepare(`
                DELETE FROM events 
                WHERE id IN (
                    SELECT id FROM events 
                    ORDER BY timestamp ASC 
                    LIMIT ?
                )
            `).run(deleteCount);
            
            console.log(`🗑️ 删除了 ${deleteCount} 个最老的事件`);
        }
    }

    /**
     * 更新统计信息
     */
    async updateStats(newEvents) {
        // 统计各剧情类型数量
        const storylineCounts = {};
        const rarityCounts = {};
        
        newEvents.forEach(event => {
            const storyline = event.storyline || 'unknown';
            const rarity = event.rarity || 'common';
            
            storylineCounts[storyline] = (storylineCounts[storyline] || 0) + 1;
            rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
        });
        
        // 插入统计记录
        this.db.prepare(`
            INSERT INTO generation_stats (
                total_generated, generation_time, storyline_counts, 
                rarity_counts, success_rate
            ) VALUES (?, ?, ?, ?, ?)
        `).run(
            newEvents.length,
            new Date().toISOString(),
            JSON.stringify(storylineCounts),
            JSON.stringify(rarityCounts),
            newEvents.length / this.eventCount
        );
        
        console.log(`📊 统计信息已更新`);
    }

    /**
     * 延迟函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取数据库统计信息
     */
    getStats() {
        if (!this.db) return null;
        
        const totalEvents = this.db.prepare('SELECT COUNT(*) as count FROM events').get().count;
        const storylineStats = this.db.prepare(`
            SELECT storyline, COUNT(*) as count 
            FROM events 
            GROUP BY storyline
        `).all();
        
        const rarityStats = this.db.prepare(`
            SELECT rarity, COUNT(*) as count 
            FROM events 
            GROUP BY rarity
        `).all();
        
        return {
            totalEvents,
            storylineStats,
            rarityStats,
            dbFile: this.dbFile
        };
    }
}

// 主执行逻辑
async function main() {
    const generator = new SQLiteEventGenerator();
    await generator.generate();
}

// 如果直接运行此文件
if (require.main === module) {
    main().catch(error => {
        console.error('💥 程序执行失败:', error);
        process.exit(1);
    });
}

module.exports = SQLiteEventGenerator;
