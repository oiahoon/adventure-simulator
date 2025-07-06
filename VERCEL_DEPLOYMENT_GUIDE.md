# 🚀 Vercel 部署完整指南

## 📋 部署前准备

### 1. 获取 DeepSeek API 密钥
1. 访问 [DeepSeek 平台](https://platform.deepseek.com/)
2. 注册账号并登录
3. 在控制台中创建 API 密钥
4. 复制并保存你的 API 密钥（格式类似：`sk-xxxxxxxxxxxxxxxx`）

### 2. 准备 GitHub 仓库
```bash
# 如果还没有 Git 仓库，先初始化
git init
git add .
git commit -m "Initial commit: Adventure Simulator with LLM integration"

# 在 GitHub 上创建新仓库，然后推送代码
git remote add origin https://github.com/YOUR_USERNAME/adventure-simulator.git
git branch -M main
git push -u origin main
```

## 🌐 Vercel 部署步骤

### 第一步：连接 GitHub
1. 访问 [Vercel](https://vercel.com/)
2. 点击 "Sign up" 或 "Log in"
3. 选择 "Continue with GitHub"
4. 授权 Vercel 访问你的 GitHub 账户

### 第二步：导入项目
1. 在 Vercel 控制台点击 "New Project"
2. 找到你的 `adventure-simulator` 仓库
3. 点击 "Import"
4. 项目设置保持默认，点击 "Deploy"

### 第三步：配置环境变量
1. 部署完成后，进入项目设置页面
2. 点击左侧菜单的 "Environment Variables"
3. 添加以下环境变量：

```
Name: DEEPSEEK_TOKEN
Value: 你的DeepSeek API密钥
Environment: Production, Preview, Development
```

### 第四步：重新部署
1. 添加环境变量后，点击 "Deployments" 标签
2. 点击最新部署右侧的三个点
3. 选择 "Redeploy"
4. 等待重新部署完成

## ⚙️ GitHub Actions 配置

### 第一步：设置 GitHub Secrets
1. 在 GitHub 仓库页面，点击 "Settings"
2. 在左侧菜单中点击 "Secrets and variables" > "Actions"
3. 点击 "New repository secret"
4. 添加以下 Secrets：

**必需的 Secrets：**
```
Name: DEEPSEEK_TOKEN
Value: 你的DeepSeek API密钥
```

**可选的 Vercel 自动部署 Secrets：**
```
Name: VERCEL_TOKEN
Value: 你的Vercel Token

Name: VERCEL_ORG_ID  
Value: 你的Vercel组织ID

Name: VERCEL_PROJECT_ID
Value: 你的Vercel项目ID
```

### 第二步：获取 Vercel 信息（可选）
如果你想要自动部署到 Vercel：

1. **获取 Vercel Token：**
   - 访问 [Vercel Account Settings](https://vercel.com/account/tokens)
   - 点击 "Create Token"
   - 输入名称（如：GitHub Actions）
   - 复制生成的 Token

2. **获取组织和项目 ID：**
   - 在 Vercel 项目页面，点击 "Settings"
   - 在 "General" 标签页找到：
     - Project ID
     - Team ID（如果是个人账户则为 User ID）

## 🎮 验证部署

### 检查网站功能
1. 访问你的 Vercel 部署 URL（类似：`https://your-project.vercel.app`）
2. 确认页面正常加载
3. 尝试创建角色并开始游戏
4. 检查是否能正常保存和加载游戏

### 检查事件生成
1. 在 GitHub 仓库的 "Actions" 标签页
2. 点击 "Generate Game Events with LLM" 工作流
3. 点击 "Run workflow" 手动触发一次
4. 等待工作流完成，检查是否有新的提交

### 检查数据库功能
1. 在浏览器开发者工具的控制台中运行：
```javascript
// 检查数据库状态
console.log(await window.DatabaseManager.getStatistics());

// 检查进度管理器
console.log(window.ProgressManager.getStorageUsage());
```

## 🔧 故障排除

### 常见问题及解决方案

#### 1. 部署失败：API 密钥错误
**症状：** Vercel 部署成功但功能异常
**解决：** 
- 检查环境变量中的 `DEEPSEEK_TOKEN` 是否正确
- 确认 API 密钥有效且有足够配额

#### 2. GitHub Actions 失败
**症状：** 工作流运行失败
**解决：**
- 检查 GitHub Secrets 中的 `DEEPSEEK_TOKEN`
- 查看 Actions 日志中的具体错误信息
- 确认 API 配额充足

#### 3. 游戏无法保存进度
**症状：** 刷新页面后游戏进度丢失
**解决：**
- 检查浏览器是否支持 localStorage
- 确认没有禁用浏览器存储
- 查看浏览器控制台是否有错误

#### 4. 事件生成不工作
**症状：** 游戏中没有新的 LLM 生成事件
**解决：**
- 检查 GitHub Actions 是否正常运行
- 确认生成的事件文件已提交到仓库
- 检查 Vercel 是否自动重新部署

## 📊 监控和维护

### 定期检查项目
1. **每周检查：**
   - GitHub Actions 运行状态
   - Vercel 部署状态
   - API 使用量

2. **每月检查：**
   - 数据库大小和性能
   - 用户反馈和错误日志
   - API 费用和配额

### 性能优化建议
1. **监控 API 使用：**
   - 设置 DeepSeek API 使用量警报
   - 定期检查生成质量

2. **优化存储：**
   - 定期清理旧的游戏存档
   - 监控浏览器存储使用量

3. **用户体验：**
   - 收集用户反馈
   - 监控页面加载速度

## 🎉 部署完成检查清单

- [ ] Vercel 部署成功，网站可以正常访问
- [ ] DeepSeek API 密钥配置正确
- [ ] GitHub Actions 可以正常运行
- [ ] 游戏功能正常（创建角色、开始游戏、保存进度）
- [ ] 事件生成系统工作正常
- [ ] 数据库功能正常
- [ ] 移动端适配良好

## 🔗 有用的链接

- [Vercel 文档](https://vercel.com/docs)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [项目 GitHub 仓库](https://github.com/YOUR_USERNAME/adventure-simulator)

---

**恭喜！你的冒险模拟器现在已经成功部署到 Vercel，并具备了自动事件生成功能！** 🎮✨

如果遇到任何问题，请检查上述故障排除部分，或在 GitHub 仓库中创建 Issue。
