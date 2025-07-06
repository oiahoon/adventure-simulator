#!/bin/bash

# 冒险模拟器启动脚本

echo "🎮 启动冒险模拟器..."
echo "================================"

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

# 获取当前目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📁 当前目录: $SCRIPT_DIR"
echo "🌐 启动HTTP服务器..."

# 查找可用端口
PORT=8080
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; do
    PORT=$((PORT + 1))
done

echo "🔗 服务器地址: http://localhost:$PORT"
echo "📱 移动端测试: http://$(ipconfig getifaddr en0):$PORT"
echo ""
echo "💡 提示:"
echo "   - 按 Ctrl+C 停止服务器"
echo "   - 在浏览器中打开上述地址"
echo "   - 推荐使用Chrome或Safari浏览器"
echo ""
echo "🚀 正在启动服务器..."

# 启动HTTP服务器
python3 -m http.server $PORT
