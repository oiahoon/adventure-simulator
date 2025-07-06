/**
 * Vercel API端点：生成游戏事件
 */

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const axios = require('axios');

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

// DeepSeek API调用
async function callDeepSeek(prompt) {
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
      }
    }
  );

  return response.data.choices[0].message.content;
}

// 生成事件提示词
function buildEventPrompt(storyline, eventCount) {
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
   - 具有连续性和世界观一致性

请按以下JSON格式返回${eventCount}个事件：
{
  "events": [
    {
      "title": "事件标题",
      "description": "详细的故事描述，包含对话和情节发展",
      "storyline": "${storyline}",
      "chapter": 章节编号,
      "tags": ["标签1", "标签2"],
      "characters": ["角色1", "角色2"],
      "location": "地点描述",
      "effects": {
        "attributes": {
          "strength": 0,
          "intelligence": 0,
          "dexterity": 0,
          "constitution": 0,
          "charisma": 0,
          "luck": 0
        },
        "personality": {
          "courage": 0,
          "wisdom": 0,
          "compassion": 0,
          "ambition": 0,
          "curiosity": 0,
          "patience": 0,
          "pride": 0,
          "loyalty": 0
        },
        "social": {
          "reputation": 0,
          "influence": 0,
          "karma": 0
        },
        "status": {
          "hp": 0,
          "mp": 0,
          "wealth": 0,
          "experience": 0,
          "fatigue": 0
        },
        "skills": [],
        "items": [],
        "titles": [],
        "achievements": []
      },
      "rarity": "common|uncommon|rare|legendary",
      "impact_description": "对角色造成的具体影响描述"
    }
  ]
}

注意：
- effects中的数值可以是正数（增加）或负数（减少）
- 纯故事性事件的effects可以全部为0
- 影响较大的事件应该设置为更高的稀有度
- impact_description要清楚说明为什么会产生这些影响

现在请生成${eventCount}个${STORYLINES[storyline].name}类型的事件：`;
}

// 初始化数据库
async function initDatabase() {
  const db = await open({
    filename: '/tmp/events.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      storyline TEXT NOT NULL,
      chapter INTEGER DEFAULT 1,
      tags TEXT,
      characters TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS storylines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      themes TEXT NOT NULL,
      event_count INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_storyline ON events(storyline);
    CREATE INDEX IF NOT EXISTS idx_chapter ON events(chapter);
  `);

  // 初始化剧情类型
  for (const [id, storyline] of Object.entries(STORYLINES)) {
    await db.run(
      'INSERT OR REPLACE INTO storylines (id, name, description, themes) VALUES (?, ?, ?, ?)',
      [id, storyline.name, storyline.description, JSON.stringify(storyline.themes)]
    );
  }

  return db;
}

// 保存事件到数据库
async function saveEvents(db, events, storyline) {
  const stmt = await db.prepare(`
    INSERT INTO events (title, description, storyline, chapter, tags, characters, location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const event of events) {
    await stmt.run([
      event.title,
      event.description,
      storyline,
      event.chapter || 1,
      JSON.stringify(event.tags || []),
      JSON.stringify(event.characters || []),
      event.location || ''
    ]);
  }

  await stmt.finalize();
}

// 清理旧事件（保持10万条限制）
async function cleanupOldEvents(db) {
  const MAX_EVENTS = 100000;
  
  const count = await db.get('SELECT COUNT(*) as count FROM events');
  
  if (count.count > MAX_EVENTS) {
    const deleteCount = count.count - MAX_EVENTS;
    await db.run(
      'DELETE FROM events WHERE id IN (SELECT id FROM events ORDER BY created_at ASC LIMIT ?)',
      [deleteCount]
    );
    console.log(`清理了 ${deleteCount} 个旧事件`);
  }
}

/**
 * Vercel API端点：生成游戏事件
 */

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const axios = require('axios');

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

// DeepSeek API调用
async function callDeepSeek(prompt) {
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
      }
    }
  );

  return response.data.choices[0].message.content;
}

// 生成事件提示词
function buildEventPrompt(storyline, eventCount) {
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
   - 具有连续性和世界观一致性

请按以下JSON格式返回${eventCount}个事件：
{
  "events": [
    {
      "title": "事件标题",
      "description": "详细的故事描述，包含对话和情节发展",
      "storyline": "${storyline}",
      "chapter": 章节编号,
      "tags": ["标签1", "标签2"],
      "characters": ["角色1", "角色2"],
      "location": "地点描述",
      "effects": {
        "attributes": {
          "strength": 0,
          "intelligence": 0,
          "dexterity": 0,
          "constitution": 0,
          "charisma": 0,
          "luck": 0
        },
        "personality": {
          "courage": 0,
          "wisdom": 0,
          "compassion": 0,
          "ambition": 0,
          "curiosity": 0,
          "patience": 0,
          "pride": 0,
          "loyalty": 0
        },
        "social": {
          "reputation": 0,
          "influence": 0,
          "karma": 0
        },
        "status": {
          "hp": 0,
          "mp": 0,
          "wealth": 0,
          "experience": 0,
          "fatigue": 0
        },
        "skills": [],
        "items": [],
        "titles": [],
        "achievements": []
      },
      "rarity": "common|uncommon|rare|legendary",
      "impact_description": "对角色造成的具体影响描述"
    }
  ]
}

注意：
- effects中的数值可以是正数（增加）或负数（减少）
- 纯故事性事件的effects可以全部为0
- 影响较大的事件应该设置为更高的稀有度
- impact_description要清楚说明为什么会产生这些影响

现在请生成${eventCount}个${STORYLINES[storyline].name}类型的事件：`;
}

// 初始化数据库
async function initDatabase() {
  const db = await open({
    filename: '/tmp/events.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS storylines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      themes TEXT NOT NULL,
      event_count INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_storyline ON events(storyline);
    CREATE INDEX IF NOT EXISTS idx_chapter ON events(chapter);
  `);

  // 初始化剧情类型
  for (const [id, storyline] of Object.entries(STORYLINES)) {
    await db.run(
      'INSERT OR REPLACE INTO storylines (id, name, description, themes) VALUES (?, ?, ?, ?)',
      [id, storyline.name, storyline.description, JSON.stringify(storyline.themes)]
    );
  }

  return db;
}

// 保存事件到数据库
async function saveEvents(db, events, storyline) {
  const stmt = await db.prepare(`
    INSERT INTO events (title, description, storyline, chapter, tags, characters, location, effects, impact_description, rarity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const event of events) {
    await stmt.run([
      event.title,
      event.description,
      storyline,
      event.chapter || 1,
      JSON.stringify(event.tags || []),
      JSON.stringify(event.characters || []),
      event.location || '',
      JSON.stringify(event.effects || {}),
      event.impact_description || '',
      event.rarity || 'common'
    ]);
  }

  await stmt.finalize();
}

// 清理旧事件（保持10万条限制）
async function cleanupOldEvents(db) {
  const MAX_EVENTS = 100000;
  
  const count = await db.get('SELECT COUNT(*) as count FROM events');
  
  if (count.count > MAX_EVENTS) {
    const deleteCount = count.count - MAX_EVENTS;
    await db.run(
      'DELETE FROM events WHERE id IN (SELECT id FROM events ORDER BY created_at ASC LIMIT ?)',
      [deleteCount]
    );
    console.log(`清理了 ${deleteCount} 个旧事件`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('开始生成事件...');
    
    if (!process.env.DEEPSEEK_TOKEN) {
      throw new Error('DEEPSEEK_TOKEN 环境变量未设置');
    }

    const db = await initDatabase();
    const eventsPerStoryline = Math.floor(400 / Object.keys(STORYLINES).length);
    let totalGenerated = 0;

    // 为每个剧情类型生成事件
    for (const [storylineId, storyline] of Object.entries(STORYLINES)) {
      try {
        console.log(`生成 ${storyline.name} 事件...`);
        
        const prompt = buildEventPrompt(storylineId, eventsPerStoryline);
        const response = await callDeepSeek(prompt);
        
        // 解析响应
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error(`${storyline.name} 响应格式错误`);
          continue;
        }

        const data = JSON.parse(jsonMatch[0]);
        if (data.events && Array.isArray(data.events)) {
          await saveEvents(db, data.events, storylineId);
          totalGenerated += data.events.length;
          console.log(`${storyline.name} 生成了 ${data.events.length} 个事件`);
        }

        // 添加延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`生成 ${storyline.name} 事件失败:`, error);
        continue;
      }
    }

    // 清理旧事件
    await cleanupOldEvents(db);
    await db.close();

    console.log(`总共生成了 ${totalGenerated} 个事件`);

    res.status(200).json({
      success: true,
      generated: totalGenerated,
      storylines: Object.keys(STORYLINES),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('生成事件失败:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('开始生成事件...');
    
    if (!process.env.DEEPSEEK_TOKEN) {
      throw new Error('DEEPSEEK_TOKEN 环境变量未设置');
    }

    const db = await initDatabase();
    const eventsPerStoryline = Math.floor(400 / Object.keys(STORYLINES).length);
    let totalGenerated = 0;

    // 为每个剧情类型生成事件
    for (const [storylineId, storyline] of Object.entries(STORYLINES)) {
      try {
        console.log(`生成 ${storyline.name} 事件...`);
        
        const prompt = buildEventPrompt(storylineId, eventsPerStoryline);
        const response = await callDeepSeek(prompt);
        
        // 解析响应
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error(`${storyline.name} 响应格式错误`);
          continue;
        }

        const data = JSON.parse(jsonMatch[0]);
        if (data.events && Array.isArray(data.events)) {
          await saveEvents(db, data.events, storylineId);
          totalGenerated += data.events.length;
          console.log(`${storyline.name} 生成了 ${data.events.length} 个事件`);
        }

        // 添加延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`生成 ${storyline.name} 事件失败:`, error);
        continue;
      }
    }

    // 清理旧事件
    await cleanupOldEvents(db);
    await db.close();

    console.log(`总共生成了 ${totalGenerated} 个事件`);

    res.status(200).json({
      success: true,
      generated: totalGenerated,
      storylines: Object.keys(STORYLINES),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('生成事件失败:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
