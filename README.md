# 江湖奇缘 - 智能文字MUD游戏

## 🎯 项目简介

江湖奇缘是一个基于LLM（大语言模型）的智能文字MUD游戏，采用前后端分离架构。玩家可以体验自动挂机的武侠冒险，所有事件都由AI动态生成，确保每次游戏都有独特的体验。

## 🏗️ 项目架构

### 清洁的项目结构
```
adventure-simulator/
├── api/                  # Serverless API函数
│   ├── index.js         # 主API入口
│   └── package.json     # API依赖
├── public/              # 静态游戏文件 (Vercel输出目录)
│   ├── index.html       # 游戏入口页面
│   ├── src/             # 游戏核心代码
│   │   ├── components/  # 游戏组件
│   │   ├── game-engine/ # MUD游戏引擎
│   │   ├── events/      # 事件系统
│   │   └── data/        # 游戏数据
│   └── assets/          # 样式和资源
├── scripts/             # LLM故事生成脚本
│   ├── llm_story_generator.py
│   └── story_consolidator.py
├── docs/                # 项目文档
├── .github/workflows/   # GitHub Actions
├── vercel.json          # Vercel部署配置
├── start-dev.sh         # 开发环境启动脚本
└── README.md           # 项目说明
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.7+
- DeepSeek API密钥（用于LLM功能）

### 本地开发

#### 一键启动开发环境
```bash
# 在项目根目录执行：
./start-dev.sh
```

#### 手动启动
```bash
# 1. 启动API服务
cd api
npm install
node index.js &

# 2. 启动前端服务
cd ../public
python3 -m http.server 8080
```

### 访问地址
- 🎮 游戏界面: http://localhost:8080
- 📡 API服务: http://localhost:3000/api/health
- 🏮 MUD状态: http://localhost:3000/api/mud/status

## 🌐 Vercel部署

### 部署步骤

1. **部署到Vercel**
```bash
vercel --prod
```

2. **设置环境变量**
在Vercel Dashboard中设置：
- `DEEPSEEK_TOKEN`: 你的DeepSeek API密钥

### 部署配置

项目使用简化的 `vercel.json`：
- **API函数**: `/api/` 目录下的Serverless Functions
- **静态文件**: `/public/` 目录自动托管
- **构建输出**: 自动复制文件到public目录

## 🎮 游戏特色

### 核心玩法
- **自动挂机** - 无需操作，角色自动进行江湖冒险
- **LLM驱动** - DeepSeek AI生成个性化的武侠事件
- **MUD系统** - 完整的门派、声望、NPC系统
- **武侠世界** - 纯正的中式武侠氛围和设定

### MUD系统特色
- 🧙‍♂️ **动态NPC系统** - AI生成的智能角色
- 🏛️ **门派系统** - 6大经典门派，完整等级制度
- 🏆 **声望系统** - 6种声望类型，影响游戏体验
- ⚔️ **武功系统** - LLM生成的原创武功秘籍
- 📰 **江湖传闻** - 动态的世界事件和消息

## 🤖 LLM集成

### 自动化故事生成
- **GitHub Actions** - 每12小时自动生成新剧情
- **8种故事类型** - 主线、支线、NPC、门派、情感、悬疑等
- **专业提示词** - 针对武侠文化优化的生成模板

### API功能
- `GET /api/health` - 服务健康检查
- `POST /api/events/generate` - LLM事件生成
- `GET /api/mud/status` - MUD系统状态

## 🛠️ 开发指南

### 项目脚本
```bash
./start-dev.sh           # 启动开发环境
npm run build           # 构建到public目录
vercel --prod           # 部署到生产环境
```

### 添加新功能
1. **API功能**: 在 `api/index.js` 中添加新路由
2. **游戏功能**: 在 `public/src/` 中添加新组件
3. **LLM内容**: 修改 `scripts/` 中的生成脚本

## 🎯 技术优势

### 架构优势
- **Serverless部署** - Vercel优化的无服务器架构
- **静态优先** - 快速的静态文件托管
- **LLM集成** - 深度的AI内容生成
- **清洁结构** - 简化的项目组织

### 性能优势
- **全球CDN** - Vercel提供的全球加速
- **按需扩容** - Serverless自动扩展
- **缓存优化** - 静态资源缓存
- **API优化** - 30秒超时的LLM调用

## 📝 更新日志

### v2.0.0 (2024-07-07)
- ✅ 项目结构大清理
- ✅ 移除冗余文件和测试代码
- ✅ 优化Vercel部署配置
- ✅ 完善MUD系统集成
- ✅ LLM故事生成工厂

### v1.0.0 (2024-07-06)
- ✅ 完成前后端分离架构
- ✅ 集成DeepSeek LLM服务
- ✅ 实现武侠风格的游戏内容

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

立即开始你的武侠冒险吧！🏮⚔️✨
