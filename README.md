# 江湖奇缘 - 智能文字MUD游戏

## 🎯 项目简介

江湖奇缘是一个基于LLM（大语言模型）的智能文字MUD游戏，采用前后端分离架构。玩家可以体验自动挂机的武侠冒险，所有事件都由AI动态生成，确保每次游戏都有独特的体验。

## 🏗️ 项目架构

### 统一项目结构
```
adventure-simulator/
├── backend/              # 后端API服务
│   ├── src/
│   │   ├── api/         # API路由
│   │   ├── services/    # 业务服务
│   │   └── server.js    # 服务器入口
│   ├── .env.example     # 环境配置模板
│   └── package.json     # 后端依赖
├── frontend/             # 前端游戏界面
│   ├── src/             # 游戏逻辑
│   ├── index.html       # 主页面
│   └── package.json     # 前端配置
├── vercel.json          # Vercel部署配置
├── start-dev.sh         # 开发环境启动脚本
├── package.json         # 项目根配置
└── README.md           # 项目说明
```

## 🚀 快速开始

### 环境要求
- Node.js 16+
- Python 3.7+
- DeepSeek API密钥（可选，用于LLM功能）

### 本地开发

#### 一键启动开发环境
```bash
# 在项目根目录执行：
./start-dev.sh
```

#### 手动启动
```bash
# 1. 安装依赖
npm run install:all

# 2. 配置环境变量
cd backend
cp .env.example .env
# 编辑 .env 文件，添加你的 DEEPSEEK_TOKEN

# 3. 启动开发环境
cd ..
npm run dev
```

### 访问地址
- 🎮 游戏界面: http://localhost:8080
- 📡 后端API: http://localhost:3000
- 🏥 健康检查: http://localhost:3000/api/health

## 🌐 Vercel部署

### 部署步骤

1. **安装Vercel CLI**
```bash
npm install -g vercel
```

2. **登录Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
# 在项目根目录执行
vercel --prod
```

4. **配置环境变量**
在Vercel Dashboard中设置：
- `DEEPSEEK_TOKEN`: 你的DeepSeek API密钥
- `NODE_ENV`: production

### 部署配置

项目已配置 `vercel.json`：
- **后端**: 部署为Serverless Functions
- **前端**: 部署为静态文件
- **路由**: API请求转发到后端，其他请求转发到前端

## 🎮 游戏特色

### 核心玩法
- **自动挂机**: 无需操作，角色自动进行江湖冒险
- **LLM驱动**: DeepSeek AI生成个性化的武侠事件
- **角色成长**: 等级、属性、技能、装备全面发展
- **武侠世界**: 纯正的中式武侠氛围和设定

### 职业系统
- 🗡️ **武者** - 刀剑双绝的江湖侠客
- 🔮 **术士** - 精通奇门遁甲的方外高人
- 🏃 **游侠** - 身轻如燕的江湖浪子
- 🙏 **僧侣** - 武功高强的出家人
- 🏹 **猎户** - 野外生存的山林好汉
- 📚 **文士** - 博学多才的书香门第

## 🤖 LLM集成

### 多层事件生成系统
1. **实时LLM生成** - DeepSeek API动态创建事件
2. **预生成事件库** - 批量生成的高质量事件
3. **AI模板生成** - 智能模板系统
4. **传统事件** - 保底的基础事件

### API配置
在 `backend/.env` 中配置：
```env
DEEPSEEK_TOKEN=your_deepseek_api_key_here
PORT=3000
NODE_ENV=development
```

## 📡 API文档

### 事件生成API
- `POST /api/events/generate` - 生成新事件
- `GET /api/events/random` - 获取随机事件
- `POST /api/events/batch-generate` - 批量生成事件

### 游戏状态API
- `GET /api/game/status` - 获取游戏状态
- `POST /api/game/save` - 保存游戏状态

### 角色管理API
- `GET /api/characters/:id` - 获取角色信息
- `POST /api/characters/:id/save` - 保存角色状态

## 🛠️ 开发指南

### 项目脚本
```bash
npm run dev              # 启动开发环境（前后端）
npm run backend:dev      # 仅启动后端开发服务器
npm run frontend:dev     # 仅启动前端开发服务器
npm run backend:start    # 启动后端生产服务器
npm run install:all      # 安装所有依赖
npm run build           # 构建项目
```

### 开发流程
1. **后端开发**: 在 `backend/src/` 中添加API和服务
2. **前端开发**: 在 `frontend/src/` 中添加游戏组件
3. **测试**: 使用 `./start-dev.sh` 启动完整环境
4. **部署**: 使用 `vercel --prod` 部署到生产环境

## 🎯 技术优势

### 架构优势
- **前后端分离** - 独立开发和部署
- **Vercel优化** - 专为Serverless设计
- **多层降级** - 确保游戏永不卡死
- **统一管理** - 单一项目包含完整功能

### 部署优势
- **零配置部署** - Vercel自动识别配置
- **全球CDN** - 快速的静态资源访问
- **Serverless** - 按需扩容，成本优化
- **环境变量** - 安全的配置管理

## 📝 更新日志

### v1.0.0 (2024-07-06)
- ✅ 完成前后端分离架构
- ✅ 集成DeepSeek LLM服务
- ✅ 实现武侠风格的游戏内容
- ✅ 配置Vercel部署支持
- ✅ 创建统一的项目结构

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork项目
2. 创建功能分支
3. 本地测试：`./start-dev.sh`
4. 提交代码
5. 创建Pull Request

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🎮 开始你的江湖之旅！

### 本地开发
```bash
./start-dev.sh
```

### 部署到Vercel
```bash
vercel --prod
```

立即开始你的武侠冒险吧！🏮⚔️
