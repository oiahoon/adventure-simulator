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

# 安装根目录依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    npm install
fi

# 启动后端服务器
echo "🚀 启动后端API服务器..."
cd backend
if [ ! -f ".env" ]; then
    echo "⚠️  警告: 未找到.env文件，请复制.env.example并配置"
    cp .env.example .env
fi

# 安装后端依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 后台启动后端
npm run dev &
BACKEND_PID=$!
echo "✅ 后端服务器启动成功 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

# 启动前端服务器
echo "🎮 启动前端游戏界面..."
cd ../frontend
python3 -m http.server 8080 &
FRONTEND_PID=$!
echo "✅ 前端服务器启动成功 (PID: $FRONTEND_PID)"

echo ""
echo "🎉 江湖奇缘开发环境启动完成！"
echo ""
echo "📡 后端API: http://localhost:3000"
echo "🎮 游戏界面: http://localhost:8080"
echo "🏥 健康检查: http://localhost:3000/api/health"
echo ""
echo "📋 项目结构:"
echo "├── backend/     # 后端API服务"
echo "├── frontend/    # 前端游戏界面"
echo "├── vercel.json  # Vercel部署配置"
echo "└── start-dev.sh # 开发环境启动脚本"
echo ""
echo "🚀 Vercel部署: vercel --prod"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ 所有服务已停止'; exit 0" INT

# 保持脚本运行
wait
