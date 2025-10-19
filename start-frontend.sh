#!/bin/bash

# 竖屏短剧策划助手 - 前端启动脚本

echo "🎬 启动竖屏短剧策划助手前端应用..."

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

# 检查package.json
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到package.json"
    echo "请确保在正确的项目目录中运行此脚本"
    exit 1
fi

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查环境变量文件
if [ ! -f ".env.local" ]; then
    echo "📝 创建环境变量文件..."
    cat > .env.local << EOF
# 竖屏短剧策划助手 - 环境配置

# API基础URL
VITE_API_BASE_URL=http://localhost:8000

# 应用配置
VITE_APP_NAME=竖屏短剧策划助手
VITE_APP_VERSION=1.0.0

# 开发环境配置
VITE_DEV_MODE=true
VITE_DEBUG_MODE=false

# 功能开关
VITE_ENABLE_STREAMING=true
VITE_ENABLE_ANALYTICS=false

# 超时配置
VITE_REQUEST_TIMEOUT=30000
VITE_STREAM_TIMEOUT=60000
EOF
    echo "✅ 已创建 .env.local 文件"
fi

echo "🚀 启动前端开发服务器..."
echo "前端地址: http://localhost:5173"
echo "按 Ctrl+C 停止服务"
echo ""

# 启动开发服务器
npm run dev
