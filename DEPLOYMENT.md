# 🚀 Vercel部署指南

## 📋 部署前准备

### 1. 项目结构确认
```
adventure-simulator/
├── backend/              # 后端API (Serverless Functions)
├── frontend/             # 前端界面 (Static Files)
├── vercel.json          # Vercel配置文件
└── package.json         # 项目配置
```

### 2. 环境变量准备
- `DEEPSEEK_TOKEN`: DeepSeek API密钥
- `NODE_ENV`: production

## 🌐 部署步骤

### 方法一：Vercel CLI部署

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
```bash
# 设置DeepSeek API密钥
vercel env add DEEPSEEK_TOKEN
# 输入你的API密钥

# 设置环境
vercel env add NODE_ENV
# 输入: production
```

### 方法二：GitHub集成部署

1. **推送到GitHub**
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

2. **连接Vercel**
- 访问 [vercel.com](https://vercel.com)
- 导入GitHub仓库
- 选择 `adventure-simulator` 项目

3. **配置环境变量**
在Vercel Dashboard中设置：
- `DEEPSEEK_TOKEN`: 你的API密钥
- `NODE_ENV`: production

4. **部署**
Vercel会自动部署，每次推送都会触发重新部署

## ⚙️ Vercel配置说明

### vercel.json配置
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/src/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/src/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

### 路由规则
- `/api/*` → 后端API服务器
- `/*` → 前端静态文件

## 🔧 部署后验证

### 1. 检查服务状态
```bash
curl https://your-domain.vercel.app/api/health
```

### 2. 测试游戏界面
访问: `https://your-domain.vercel.app`

### 3. 测试LLM功能
在游戏中创建角色，观察是否能生成LLM事件

## 🐛 常见问题

### 1. API调用失败
**问题**: 前端无法调用后端API
**解决**: 检查vercel.json中的路由配置

### 2. 环境变量未生效
**问题**: DEEPSEEK_TOKEN未设置
**解决**: 在Vercel Dashboard中重新设置环境变量

### 3. 函数超时
**问题**: LLM API调用超时
**解决**: 在vercel.json中增加maxDuration配置

### 4. 静态文件404
**问题**: 前端资源无法访问
**解决**: 检查frontend目录结构和路由配置

## 📊 性能优化

### 1. 函数冷启动优化
- 使用轻量级依赖
- 实现连接池
- 缓存常用数据

### 2. 静态资源优化
- 压缩CSS/JS文件
- 使用CDN加速
- 启用浏览器缓存

### 3. API响应优化
- 实现响应缓存
- 使用流式响应
- 优化数据库查询

## 🔄 持续部署

### GitHub Actions配置
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🎯 部署检查清单

- [ ] 项目结构正确
- [ ] vercel.json配置完整
- [ ] 环境变量已设置
- [ ] API路由正常工作
- [ ] 前端界面可访问
- [ ] LLM功能正常
- [ ] 游戏逻辑完整
- [ ] 性能表现良好

## 🎉 部署完成

部署成功后，你将获得：
- 🌐 全球CDN加速的游戏界面
- ⚡ Serverless后端API
- 🤖 实时LLM事件生成
- 📱 移动端友好的响应式设计

享受你的江湖奇缘游戏吧！🏮⚔️
