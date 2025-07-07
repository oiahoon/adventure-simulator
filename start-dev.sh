#!/bin/bash

# 江湖奇缘开发环境启动脚本

echo "🏮 启动江湖奇缘开发环境..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装Node.js"
    exit 1
fi

# 检查Python3
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未安装Python3"
    exit 1
fi

# 安装API依赖
echo "📦 安装API依赖..."
cd api
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# 启动API服务器（后台运行）
echo "🚀 启动API服务器..."
cd api
node index.js &
API_PID=$!
echo "✅ API服务器启动成功 (PID: $API_PID)"
cd ..

# 等待API启动
sleep 2

# 启动前端服务器
echo "🎮 启动前端游戏界面..."
cd public
python3 -m http.server 8080 &
FRONTEND_PID=$!
echo "✅ 前端服务器启动成功 (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "🎉 江湖奇缘开发环境启动完成！"
echo ""
echo "📡 API服务: http://localhost:3000"
echo "🎮 游戏界面: http://localhost:8080"
echo "🏥 健康检查: http://localhost:3000/api/health"
echo ""
echo "📋 清理后的项目结构:"
echo "├── api/         # Serverless API函数"
echo "├── public/      # 静态游戏文件"
echo "├── scripts/     # LLM故事生成脚本"
echo "├── docs/        # 项目文档"
echo "└── .github/     # GitHub Actions工作流"
echo ""
echo "🚀 Vercel部署: vercel --prod"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $API_PID $FRONTEND_PID 2>/dev/null; echo '✅ 所有服务已停止'; exit 0" INT

# 保持脚本运行
wait
