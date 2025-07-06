# 部署说明文档

## 🚀 Vercel 自动部署配置

### 1. 准备工作

#### 1.1 GitHub 仓库设置
```bash
# 初始化 Git 仓库（如果还没有）
git init
git add .
git commit -m "Initial commit: Adventure Simulator with LLM event generation"

# 推送到 GitHub
git remote add origin https://github.com/YOUR_USERNAME/adventure-simulator.git
git branch -M main
git push -u origin main
```

#### 1.2 获取 API 密钥
需要获取以下 LLM 服务的 API 密钥：

**DeepSeek (主要)**
- 访问: https://platform.deepseek.com/
- 注册账号并获取 API Key
- 这是主要的 LLM 提供商

**OpenAI (可选)**
- 访问: https://platform.openai.com/
- 获取 API Key

**Anthropic Claude (可选)**
- 访问: https://console.anthropic.com/
- 获取 API Key

**Google Gemini (可选)**
- 访问: https://makersuite.google.com/
- 获取 API Key

### 2. Vercel 部署步骤

#### 2.1 连接 GitHub
1. 访问 [Vercel](https://vercel.com/)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择 `adventure-simulator` 仓库
5. 点击 "Import"

#### 2.2 配置环境变量
在 Vercel 项目设置中添加以下环境变量：

**必需的环境变量:**
```
DEEPSEEK_TOKEN=your_deepseek_api_key_here
```

**可选的环境变量:**
```
OPENAI_API_KEY=your_openai_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 2.3 获取 Vercel 项目信息
部署后，在项目设置中找到：
- `VERCEL_ORG_ID`: 组织 ID
- `VERCEL_PROJECT_ID`: 项目 ID
- 生成 `VERCEL_TOKEN`: 在账户设置中生成

### 3. GitHub Actions 配置

#### 3.1 设置 GitHub Secrets
在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加：

**必需的 Secrets:**
```
DEEPSEEK_TOKEN=your_deepseek_api_key
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

**可选的 Secrets:**
```
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
GEMINI_API_KEY=your_gemini_key
```

#### 3.2 GitHub Actions 工作流
工作流文件已配置在 `.github/workflows/generate-events.yml`，将会：

- **每天凌晨2点自动运行**
- **每次推送到 main 分支时运行**
- **可以手动触发**

工作流程：
1. 使用多个 LLM 生成新事件
2. 验证事件质量
3. 更新事件数据库
4. 自动提交到 GitHub
5. 自动部署到 Vercel

### 4. 本地开发和测试

#### 4.1 安装依赖
```bash
cd scripts/event-generator
npm install
```

#### 4.2 本地测试
```bash
# 测试组件功能
npm test

# 设置环境变量并生成事件
export DEEPSEEK_TOKEN=your_api_key
npm run generate
```

#### 4.3 本地运行游戏
```bash
# 返回项目根目录
cd ../..

# 启动本地服务器
./start.sh
```

### 5. 监控和维护

#### 5.1 查看生成统计
- 访问部署的网站
- 在浏览器控制台中运行：
```javascript
// 查看事件统计
console.log(window.GeneratedEventLoader.getEventStats());
```

#### 5.2 GitHub Actions 监控
- 在 GitHub 仓库的 Actions 标签页查看工作流运行状态
- 检查日志以确保事件生成正常

#### 5.3 Vercel 部署监控
- 在 Vercel 控制台查看部署状态
- 监控网站访问情况

### 6. 故障排除

#### 6.1 常见问题

**事件生成失败:**
- 检查 API 密钥是否正确
- 确认 API 配额是否充足
- 查看 GitHub Actions 日志

**部署失败:**
- 检查 Vercel 环境变量配置
- 确认 GitHub 仓库权限
- 查看 Vercel 部署日志

**游戏无法加载事件:**
- 检查 `generated-events.json` 文件是否存在
- 确认文件格式是否正确
- 查看浏览器控制台错误

#### 6.2 调试命令

**本地调试事件生成:**
```bash
cd scripts/event-generator
DEBUG=1 node generate-events.js
```

**检查事件文件:**
```bash
# 查看生成的事件数量
cat src/data/generated-events.json | jq '.metadata.totalEvents'

# 查看最新的事件
cat src/data/generated-events.json | jq '.events[0]'
```

### 7. 扩展和定制

#### 7.1 添加新的 LLM 提供商
1. 在 `llm-providers.js` 中添加新的提供商类
2. 在环境变量中添加相应的 API 密钥
3. 更新 GitHub Actions 和 Vercel 配置

#### 7.2 自定义事件模板
1. 编辑 `event-templates.js`
2. 添加新的事件类别和模板
3. 更新验证规则

#### 7.3 调整生成频率
- 修改 `.github/workflows/generate-events.yml` 中的 cron 表达式
- 调整每次生成的事件数量

### 8. 成本控制

#### 8.1 API 使用优化
- 设置合理的生成频率
- 监控 API 使用量
- 使用多个提供商分散负载

#### 8.2 存储优化
- 定期清理旧事件（自动）
- 压缩事件数据
- 优化文件大小

### 9. 安全考虑

#### 9.1 API 密钥安全
- 使用 GitHub Secrets 存储敏感信息
- 定期轮换 API 密钥
- 监控异常使用

#### 9.2 内容过滤
- 事件验证器会过滤不当内容
- 定期审查生成的事件
- 建立内容举报机制

## 🎉 部署完成

完成以上步骤后，你将拥有：

1. **自动化的事件生成系统** - 每天自动生成新的游戏事件
2. **多 LLM 支持** - 使用多个 AI 服务确保内容多样性
3. **自动部署** - 代码更新和事件生成后自动部署
4. **质量控制** - 自动验证和过滤生成的内容
5. **监控和统计** - 完整的生成和使用统计

你的冒险模拟器现在具备了几乎无限的内容生成能力！🚀
