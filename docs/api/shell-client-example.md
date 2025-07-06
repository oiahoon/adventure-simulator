# Shell端API使用示例

## 🖥️ Shell客户端接口说明

游戏提供了完整的RESTful API，支持Shell端或其他客户端接入。

## 📡 API端点

基础URL: `https://your-domain.vercel.app/api/game-api`

### 认证
目前API不需要认证，但建议在生产环境中添加API密钥验证。

## 🎮 基本使用流程

### 1. 创建游戏会话
```bash
curl -X POST "https://your-domain.vercel.app/api/game-api?endpoint=session" \
  -H "Content-Type: application/json" \
  -d '{
    "characterName": "张三",
    "profession": "warrior",
    "storyline": "xianxia",
    "attributes": {
      "strength": 15,
      "intelligence": 10,
      "dexterity": 12,
      "constitution": 13,
      "charisma": 8,
      "luck": 10
    }
  }'
```

响应：
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1234567890_abc123",
    "character": { ... },
    "gameState": { ... }
  }
}
```

### 2. 获取随机事件
```bash
curl -X POST "https://your-domain.vercel.app/api/game-api?endpoint=action" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_1234567890_abc123",
    "action": "get_event"
  }'
```

### 3. 应用事件效果
```bash
curl -X POST "https://your-domain.vercel.app/api/game-api?endpoint=action" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_1234567890_abc123",
    "action": "apply_event_effects",
    "parameters": {
      "effects": {
        "attributes": { "strength": 2 },
        "status": { "experience": 10, "wealth": 50 }
      }
    }
  }'
```

### 4. 获取角色状态
```bash
curl -X POST "https://your-domain.vercel.app/api/game-api?endpoint=action" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_1234567890_abc123",
    "action": "get_status"
  }'
```

## 🐚 Shell脚本示例

### 简单的Shell游戏客户端
```bash
#!/bin/bash

API_BASE="https://your-domain.vercel.app/api/game-api"
SESSION_FILE="/tmp/adventure_session.txt"

# 创建新游戏
create_game() {
    echo "创建新角色..."
    read -p "角色名称: " char_name
    read -p "职业 (warrior/mage/rogue/priest/ranger/noble): " profession
    read -p "剧情 (xianxia/xuanhuan/scifi/wuxia/fantasy): " storyline
    
    response=$(curl -s -X POST "${API_BASE}?endpoint=session" \
        -H "Content-Type: application/json" \
        -d "{
            \"characterName\": \"$char_name\",
            \"profession\": \"$profession\",
            \"storyline\": \"$storyline\"
        }")
    
    session_id=$(echo $response | jq -r '.data.sessionId')
    echo $session_id > $SESSION_FILE
    echo "游戏会话创建成功: $session_id"
}

# 获取事件
get_event() {
    if [ ! -f $SESSION_FILE ]; then
        echo "请先创建游戏会话"
        return 1
    fi
    
    session_id=$(cat $SESSION_FILE)
    response=$(curl -s -X POST "${API_BASE}?endpoint=action" \
        -H "Content-Type: application/json" \
        -d "{
            \"sessionId\": \"$session_id\",
            \"action\": \"get_event\"
        }")
    
    event_title=$(echo $response | jq -r '.data.event.title')
    event_desc=$(echo $response | jq -r '.data.event.description')
    
    echo "=== 事件: $event_title ==="
    echo "$event_desc"
    echo ""
}

# 获取状态
get_status() {
    if [ ! -f $SESSION_FILE ]; then
        echo "请先创建游戏会话"
        return 1
    fi
    
    session_id=$(cat $SESSION_FILE)
    response=$(curl -s -X POST "${API_BASE}?endpoint=action" \
        -H "Content-Type: application/json" \
        -d "{
            \"sessionId\": \"$session_id\",
            \"action\": \"get_status\"
        }")
    
    char_name=$(echo $response | jq -r '.data.character.name')
    char_level=$(echo $response | jq -r '.data.character.level')
    char_hp=$(echo $response | jq -r '.data.character.status.hp')
    char_wealth=$(echo $response | jq -r '.data.character.status.wealth')
    
    echo "=== 角色状态 ==="
    echo "姓名: $char_name"
    echo "等级: $char_level"
    echo "生命值: $char_hp"
    echo "财富: $char_wealth"
    echo ""
}

# 主菜单
main_menu() {
    while true; do
        echo "=== 冒险模拟器 Shell客户端 ==="
        echo "1. 创建新游戏"
        echo "2. 获取随机事件"
        echo "3. 查看角色状态"
        echo "4. 退出"
        read -p "请选择: " choice
        
        case $choice in
            1) create_game ;;
            2) get_event ;;
            3) get_status ;;
            4) exit 0 ;;
            *) echo "无效选择" ;;
        esac
        echo ""
    done
}

# 检查依赖
if ! command -v jq &> /dev/null; then
    echo "请安装 jq 工具: brew install jq"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "请安装 curl 工具"
    exit 1
fi

# 启动主菜单
main_menu
```

### Python客户端示例
```python
#!/usr/bin/env python3
import requests
import json
import os

class AdventureClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session_file = "/tmp/adventure_session.json"
        self.session_id = None
        self.load_session()
    
    def load_session(self):
        if os.path.exists(self.session_file):
            with open(self.session_file, 'r') as f:
                data = json.load(f)
                self.session_id = data.get('sessionId')
    
    def save_session(self, session_data):
        with open(self.session_file, 'w') as f:
            json.dump(session_data, f)
        self.session_id = session_data['sessionId']
    
    def create_game(self, name, profession, storyline):
        url = f"{self.base_url}?endpoint=session"
        data = {
            "characterName": name,
            "profession": profession,
            "storyline": storyline
        }
        
        response = requests.post(url, json=data)
        if response.status_code == 201:
            result = response.json()
            self.save_session(result['data'])
            return result['data']
        else:
            raise Exception(f"创建游戏失败: {response.text}")
    
    def get_event(self):
        if not self.session_id:
            raise Exception("请先创建游戏会话")
        
        url = f"{self.base_url}?endpoint=action"
        data = {
            "sessionId": self.session_id,
            "action": "get_event"
        }
        
        response = requests.post(url, json=data)
        if response.status_code == 200:
            return response.json()['data']
        else:
            raise Exception(f"获取事件失败: {response.text}")
    
    def get_status(self):
        if not self.session_id:
            raise Exception("请先创建游戏会话")
        
        url = f"{self.base_url}?endpoint=action"
        data = {
            "sessionId": self.session_id,
            "action": "get_status"
        }
        
        response = requests.post(url, json=data)
        if response.status_code == 200:
            return response.json()['data']
        else:
            raise Exception(f"获取状态失败: {response.text}")

# 使用示例
if __name__ == "__main__":
    client = AdventureClient("https://your-domain.vercel.app/api/game-api")
    
    # 创建游戏
    game_data = client.create_game("李四", "mage", "xuanhuan")
    print(f"游戏创建成功: {game_data['character']['name']}")
    
    # 获取事件
    event_data = client.get_event()
    if event_data['event']:
        print(f"事件: {event_data['event']['title']}")
        print(f"描述: {event_data['event']['description']}")
    
    # 获取状态
    status = client.get_status()
    char = status['character']
    print(f"角色: {char['name']} (等级 {char['level']})")
    print(f"生命值: {char['status']['hp']}")
    print(f"财富: {char['status']['wealth']}")
```

## 📋 API参考

### 端点列表

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/game-api?endpoint=events` | 获取事件列表 |
| GET | `/api/game-api?endpoint=session&sessionId=xxx` | 获取游戏会话 |
| GET | `/api/game-api?endpoint=storylines` | 获取剧情类型 |
| POST | `/api/game-api?endpoint=session` | 创建游戏会话 |
| POST | `/api/game-api?endpoint=action` | 执行游戏动作 |
| PUT | `/api/game-api?endpoint=session` | 更新游戏会话 |
| DELETE | `/api/game-api?endpoint=session&sessionId=xxx` | 删除游戏会话 |

### 错误处理

API使用标准HTTP状态码：
- 200: 成功
- 201: 创建成功
- 400: 请求错误
- 404: 资源不存在
- 500: 服务器错误

错误响应格式：
```json
{
  "error": "错误描述"
}
```

## 🔧 开发建议

1. **会话管理**: 妥善保存和管理会话ID
2. **错误处理**: 实现完善的错误处理机制
3. **数据缓存**: 缓存角色状态减少API调用
4. **异步处理**: 使用异步请求提升用户体验
5. **安全考虑**: 在生产环境中添加认证和限流

这个API设计为未来的Shell端、移动端或其他客户端提供了完整的接口支持。
