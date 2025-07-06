# 技术架构文档

## 🏗 整体架构

### 架构模式：MVC + 事件驱动

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   View Layer    │    │  Controller     │    │   Model Layer   │
│   (UI/Display)  │◄──►│   (Game Loop)   │◄──►│  (Game State)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Event System   │    │   AI Engine     │    │  Data Manager   │
│  (Event Bus)    │    │  (Decision)     │    │  (Persistence)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 核心模块

### 1. 游戏引擎 (Game Engine)

#### GameEngine.js
```javascript
class GameEngine {
  constructor() {
    this.gameState = new GameState();
    this.eventSystem = new EventSystem();
    this.aiEngine = new AIEngine();
    this.uiManager = new UIManager();
  }
  
  // 游戏主循环
  gameLoop() {
    // 1. 处理输入
    // 2. 更新游戏状态
    // 3. AI决策
    // 4. 触发事件
    // 5. 更新UI
  }
}
```

#### GameState.js
```javascript
class GameState {
  constructor() {
    this.character = new Character();
    this.world = new World();
    this.inventory = new Inventory();
    this.achievements = new Achievements();
  }
}
```

### 2. 角色系统 (Character System)

#### Character.js
```javascript
class Character {
  constructor(profession) {
    this.profession = profession;
    this.attributes = {
      strength: 10,
      intelligence: 10,
      dexterity: 10,
      constitution: 10,
      charisma: 10,
      luck: 10
    };
    this.status = {
      hp: 100,
      mp: 50,
      fatigue: 0,
      reputation: 0,
      wealth: 100
    };
  }
}
```

### 3. 事件系统 (Event System)

#### EventSystem.js
```javascript
class EventSystem {
  constructor() {
    this.eventQueue = [];
    this.eventHandlers = new Map();
    this.eventData = new EventDataManager();
  }
  
  // 触发事件
  triggerEvent(eventType, context) {
    const event = this.eventData.generateEvent(eventType, context);
    this.processEvent(event);
  }
}
```

#### EventDataManager.js
```javascript
class EventDataManager {
  constructor() {
    this.eventTemplates = this.loadEventTemplates();
    this.eventHistory = [];
  }
  
  // 基于上下文生成事件
  generateEvent(type, context) {
    const templates = this.eventTemplates[type];
    const suitable = this.filterByContext(templates, context);
    return this.selectEvent(suitable);
  }
}
```

### 4. AI决策引擎 (AI Engine)

#### AIEngine.js
```javascript
class AIEngine {
  constructor() {
    this.decisionTree = new DecisionTree();
    this.personalityModel = new PersonalityModel();
    this.riskAssessment = new RiskAssessment();
  }
  
  // 做出决策
  makeDecision(options, context) {
    const scores = options.map(option => 
      this.evaluateOption(option, context)
    );
    return this.selectBestOption(options, scores);
  }
}
```

### 5. UI管理器 (UI Manager)

#### UIManager.js
```javascript
class UIManager {
  constructor() {
    this.components = new Map();
    this.eventBus = new EventBus();
    this.renderer = new Renderer();
  }
  
  // 更新UI
  update(gameState) {
    this.components.forEach(component => {
      component.update(gameState);
    });
  }
}
```

## 📁 文件结构

```
src/
├── game-engine/
│   ├── GameEngine.js           # 主游戏引擎
│   ├── GameState.js            # 游戏状态管理
│   ├── GameLoop.js             # 游戏循环控制
│   └── SaveManager.js          # 存档管理
├── components/
│   ├── Character.js            # 角色类
│   ├── World.js                # 世界状态
│   ├── Inventory.js            # 物品系统
│   └── Achievements.js         # 成就系统
├── events/
│   ├── EventSystem.js          # 事件系统核心
│   ├── EventDataManager.js     # 事件数据管理
│   ├── EventTemplates.js       # 事件模板
│   └── EventProcessor.js       # 事件处理器
├── ai/
│   ├── AIEngine.js             # AI决策引擎
│   ├── DecisionTree.js         # 决策树
│   ├── PersonalityModel.js     # 性格模型
│   └── RiskAssessment.js       # 风险评估
├── ui/
│   ├── UIManager.js            # UI管理器
│   ├── components/             # UI组件
│   │   ├── CharacterPanel.js
│   │   ├── EventLog.js
│   │   ├── ControlPanel.js
│   │   └── StatusBar.js
│   └── Renderer.js             # 渲染器
└── data/
    ├── events/                 # 事件数据
    ├── characters/             # 角色数据
    ├── world/                  # 世界数据
    └── config/                 # 配置文件
```

## 🔄 数据流

### 1. 游戏启动流程
```
用户点击开始 → 创建角色 → 初始化游戏状态 → 开始游戏循环
```

### 2. 事件处理流程
```
触发条件满足 → 生成事件 → AI决策 → 执行结果 → 更新状态 → 更新UI
```

### 3. 存档流程
```
游戏状态变化 → 序列化数据 → 存储到LocalStorage → 提供恢复接口
```

## 🎨 UI设计原则

### 1. 响应式设计
- 支持桌面和移动端
- 自适应屏幕尺寸
- 触摸友好的交互

### 2. 信息层次
- 重要信息突出显示
- 合理的信息分组
- 清晰的视觉层次

### 3. 用户体验
- 流畅的动画效果
- 即时的反馈
- 直观的操作方式

## 🚀 性能优化

### 1. 代码优化
- 模块化设计
- 懒加载非核心功能
- 事件防抖和节流

### 2. 数据优化
- 增量更新UI
- 数据缓存策略
- 压缩存档数据

### 3. 渲染优化
- 虚拟滚动
- 批量DOM更新
- CSS动画优化
