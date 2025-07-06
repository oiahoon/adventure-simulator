/**
 * 游戏API接口
 * 为Shell端和其他客户端提供RESTful API
 */

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// 初始化数据库连接
async function initDatabase() {
  const db = await open({
    filename: '/tmp/game.db',
    driver: sqlite3.Database
  });

  // 创建必要的表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      character_data TEXT NOT NULL,
      game_state TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      storyline TEXT NOT NULL,
      effects TEXT,
      impact_description TEXT,
      rarity TEXT DEFAULT 'common',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query, body } = req;
  const { endpoint } = query;

  try {
    const db = await initDatabase();

    switch (method) {
      case 'GET':
        return await handleGet(req, res, db, endpoint, query);
      case 'POST':
        return await handlePost(req, res, db, endpoint, body);
      case 'PUT':
        return await handlePut(req, res, db, endpoint, body);
      case 'DELETE':
        return await handleDelete(req, res, db, endpoint, query);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// GET请求处理
async function handleGet(req, res, db, endpoint, query) {
  switch (endpoint) {
    case 'events':
      return await getEvents(req, res, db, query);
    case 'session':
      return await getSession(req, res, db, query);
    case 'storylines':
      return await getStorylines(req, res, db);
    case 'achievements':
      return await getAchievements(req, res, db);
    default:
      return res.status(404).json({ error: 'Endpoint not found' });
  }
}

// POST请求处理
async function handlePost(req, res, db, endpoint, body) {
  switch (endpoint) {
    case 'session':
      return await createSession(req, res, db, body);
    case 'action':
      return await processAction(req, res, db, body);
    default:
      return res.status(404).json({ error: 'Endpoint not found' });
  }
}

// PUT请求处理
async function handlePut(req, res, db, endpoint, body) {
  switch (endpoint) {
    case 'session':
      return await updateSession(req, res, db, body);
    default:
      return res.status(404).json({ error: 'Endpoint not found' });
  }
}

// DELETE请求处理
async function handleDelete(req, res, db, endpoint, query) {
  switch (endpoint) {
    case 'session':
      return await deleteSession(req, res, db, query);
    default:
      return res.status(404).json({ error: 'Endpoint not found' });
  }
}

// 获取事件
async function getEvents(req, res, db, query) {
  const { storyline, limit = 10, offset = 0 } = query;
  
  let sql = 'SELECT * FROM events';
  let params = [];
  
  if (storyline) {
    sql += ' WHERE storyline = ?';
    params.push(storyline);
  }
  
  sql += ' ORDER BY RANDOM() LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const events = await db.all(sql, params);
  
  // 解析JSON字段
  const processedEvents = events.map(event => ({
    ...event,
    effects: event.effects ? JSON.parse(event.effects) : null
  }));
  
  return res.status(200).json({
    success: true,
    data: processedEvents,
    total: events.length
  });
}

// 获取游戏会话
async function getSession(req, res, db, query) {
  const { sessionId } = query;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }
  
  const session = await db.get(
    'SELECT * FROM game_sessions WHERE id = ?',
    [sessionId]
  );
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  return res.status(200).json({
    success: true,
    data: {
      id: session.id,
      character: JSON.parse(session.character_data),
      gameState: JSON.parse(session.game_state),
      createdAt: session.created_at,
      updatedAt: session.updated_at
    }
  });
}

// 获取剧情类型
async function getStorylines(req, res, db) {
  const storylines = {
    xianxia: { name: '仙侠修真', description: '踏上修仙之路，追求长生不老' },
    xuanhuan: { name: '玄幻奇缘', description: '在神秘的玄幻世界中冒险' },
    scifi: { name: '科幻未来', description: '探索未来科技的无限可能' },
    wuxia: { name: '武侠江湖', description: '行走江湖，快意恩仇' },
    fantasy: { name: '西幻冒险', description: '在魔法与剑的世界中冒险' }
  };
  
  return res.status(200).json({
    success: true,
    data: storylines
  });
}

// 获取成就信息
async function getAchievements(req, res, db) {
  // 这里可以从成就系统获取信息
  const achievements = {
    categories: ['attributes', 'personality', 'social', 'wealth', 'cultivation'],
    total: 50,
    description: 'Achievement system with various categories'
  };
  
  return res.status(200).json({
    success: true,
    data: achievements
  });
}

// 创建游戏会话
async function createSession(req, res, db, body) {
  const { characterName, profession, storyline, attributes } = body;
  
  if (!characterName || !profession || !storyline) {
    return res.status(400).json({ 
      error: 'Character name, profession, and storyline are required' 
    });
  }
  
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 创建角色数据
  const characterData = {
    name: characterName,
    profession,
    storyline,
    level: 1,
    experience: 0,
    attributes: attributes || {
      strength: 10,
      intelligence: 10,
      dexterity: 10,
      constitution: 10,
      charisma: 10,
      luck: 10
    },
    personality: {
      courage: 50,
      wisdom: 50,
      compassion: 50,
      ambition: 50,
      curiosity: 50,
      patience: 50,
      pride: 50,
      loyalty: 50
    },
    social: {
      reputation: 0,
      influence: 0,
      karma: 0,
      socialStatus: 'commoner',
      titles: []
    },
    status: {
      hp: 100,
      mp: 50,
      wealth: 100,
      fatigue: 0,
      cultivation: '练气期'
    }
  };
  
  const gameState = {
    currentLocation: 'newbie_village',
    gameTime: 0,
    eventHistory: [],
    currentChapter: 1
  };
  
  await db.run(
    'INSERT INTO game_sessions (id, character_data, game_state) VALUES (?, ?, ?)',
    [sessionId, JSON.stringify(characterData), JSON.stringify(gameState)]
  );
  
  return res.status(201).json({
    success: true,
    data: {
      sessionId,
      character: characterData,
      gameState
    }
  });
}

// 处理游戏动作
async function processAction(req, res, db, body) {
  const { sessionId, action, parameters } = body;
  
  if (!sessionId || !action) {
    return res.status(400).json({ error: 'Session ID and action are required' });
  }
  
  // 获取会话
  const session = await db.get(
    'SELECT * FROM game_sessions WHERE id = ?',
    [sessionId]
  );
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const character = JSON.parse(session.character_data);
  const gameState = JSON.parse(session.game_state);
  
  let result = {};
  
  switch (action) {
    case 'get_event':
      result = await getRandomEvent(db, character.storyline);
      break;
    case 'apply_event_effects':
      result = await applyEventEffects(character, parameters.effects);
      break;
    case 'get_status':
      result = { character, gameState };
      break;
    default:
      return res.status(400).json({ error: 'Unknown action' });
  }
  
  // 更新会话
  await db.run(
    'UPDATE game_sessions SET character_data = ?, game_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [JSON.stringify(character), JSON.stringify(gameState), sessionId]
  );
  
  return res.status(200).json({
    success: true,
    data: result
  });
}

// 获取随机事件
async function getRandomEvent(db, storyline) {
  const event = await db.get(
    'SELECT * FROM events WHERE storyline = ? ORDER BY RANDOM() LIMIT 1',
    [storyline]
  );
  
  if (event && event.effects) {
    event.effects = JSON.parse(event.effects);
  }
  
  return { event };
}

// 应用事件效果
async function applyEventEffects(character, effects) {
  if (!effects) return { character };
  
  // 应用属性变化
  if (effects.attributes) {
    Object.entries(effects.attributes).forEach(([attr, value]) => {
      if (character.attributes[attr] !== undefined) {
        character.attributes[attr] += value;
        character.attributes[attr] = Math.max(0, character.attributes[attr]);
      }
    });
  }
  
  // 应用人格变化
  if (effects.personality) {
    Object.entries(effects.personality).forEach(([trait, value]) => {
      if (character.personality[trait] !== undefined) {
        character.personality[trait] += value;
        character.personality[trait] = Math.max(0, Math.min(100, character.personality[trait]));
      }
    });
  }
  
  // 应用社会影响
  if (effects.social) {
    Object.entries(effects.social).forEach(([social, value]) => {
      if (character.social[social] !== undefined) {
        character.social[social] += value;
      }
    });
  }
  
  // 应用状态变化
  if (effects.status) {
    Object.entries(effects.status).forEach(([status, value]) => {
      if (character.status[status] !== undefined) {
        character.status[status] += value;
        if (status === 'hp') {
          character.status[status] = Math.max(0, character.status[status]);
        }
      }
    });
  }
  
  return { character, appliedEffects: effects };
}

// 更新会话
async function updateSession(req, res, db, body) {
  const { sessionId, character, gameState } = body;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }
  
  await db.run(
    'UPDATE game_sessions SET character_data = ?, game_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [JSON.stringify(character), JSON.stringify(gameState), sessionId]
  );
  
  return res.status(200).json({
    success: true,
    message: 'Session updated successfully'
  });
}

// 删除会话
async function deleteSession(req, res, db, query) {
  const { sessionId } = query;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }
  
  await db.run('DELETE FROM game_sessions WHERE id = ?', [sessionId]);
  
  return res.status(200).json({
    success: true,
    message: 'Session deleted successfully'
  });
}
