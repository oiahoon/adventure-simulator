# 🚀 Vercel部署指南

## 📋 部署前准备

### 项目结构
```
adventure-simulator/
├── backend/              # 后端API (Serverless Functions)
│   └── src/server.js    # API入口
├── src/                 # 前端游戏代码
├── index.html          # 前端入口
├── vercel.json         # Vercel配置
└── package.json        # 项目配置
```

## 🔧 修复的问题

### ❌ 之前的错误
```
Conflicting functions and builds configuration
```

### ✅ 解决方案
- 移除冲突的`builds`配置
- 使用现代的`rewrites`配置
- 简化Vercel配置文件

## 🌐 部署步骤

### 方法一：Vercel CLI部署

```bash
# 1. 安装Vercel CLI
npm install -g vercel

# 2. 登录Vercel
vercel login

# 3. 部署项目
vercel --prod

# 4. 设置环境变量
vercel env add DEEPSEEK_TOKEN
# 输入你的DeepSeek API密钥
```

### 方法二：GitHub集成部署

1. **连接GitHub**
   - 访问 [vercel.com](https://vercel.com)
   - 导入GitHub仓库 `adventure-simulator`

2. **配置环境变量**
   - `DEEPSEEK_TOKEN`: 你的DeepSeek API密钥
   - `NODE_ENV`: production

3. **自动部署**
   - 每次推送代码自动重新部署

## ⚙️ Vercel配置说明

### 当前配置 (vercel.json)
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/src/server.js"
    }
  ],
  "functions": {
    "backend/src/server.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 路由规则
- `/api/*` → 后端Serverless Function
- `/*` → 前端静态文件（根目录）

## 🔧 部署后验证

### 1. 检查前端
访问: `https://your-domain.vercel.app`

### 2. 检查API
```bash
curl https://your-domain.vercel.app/api/health
```

### 3. 测试MUD功能
```bash
curl https://your-domain.vercel.app/api/mud/status
```

## 🐛 常见问题解决

### 1. 函数超时
**解决**: 已设置`maxDuration: 30`秒

### 2. 环境变量未生效
**解决**: 在Vercel Dashboard重新设置

### 3. 静态文件404
**解决**: 文件已移动到根目录

### 4. API路由不工作
**解决**: 使用`rewrites`而不是`routes`

## 🎯 部署检查清单

- [ ] vercel.json配置正确
- [ ] 环境变量已设置 (DEEPSEEK_TOKEN)
- [ ] 前端文件在根目录
- [ ] 后端API正常响应
- [ ] MUD功能可用
- [ ] LLM服务连接正常

## 🎉 部署完成

部署成功后，你将获得：
- 🌐 全球CDN加速的游戏界面
- ⚡ Serverless后端API
- 🤖 LLM剧情生成服务
- 🏮 完整的MUD游戏体验

享受你的江湖奇缘游戏吧！🏮⚔️
