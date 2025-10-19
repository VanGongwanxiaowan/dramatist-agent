#!/bin/bash

# 竖屏短剧策划助手 - 完整启动脚本
# 同时启动前端和后端服务

echo "🎬 启动竖屏短剧策划助手完整服务..."

# 检查必要工具
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ 错误: 未找到 $1，请先安装 $1"
        exit 1
    fi
}

echo "🔍 检查环境..."
check_command "node"
check_command "npm"
check_command "python3"

# 检查是否在conda环境中
if [[ "$CONDA_DEFAULT_ENV" == "" ]]; then
    echo "⚠️  警告: 建议在conda虚拟环境中运行"
    echo "请先激活conda环境: conda activate your_env"
    read -p "是否继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 创建环境变量文件
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

# 检查前端依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 检查后端依赖
cd ../
if [ ! -f "requirements.txt" ]; then
    echo "❌ 错误: 未找到后端requirements.txt文件"
    exit 1
fi

# 检查Python依赖
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "📦 安装后端依赖..."
    pip install -r requirements.txt
fi

# 回到前端目录
cd dramatist-agent

echo "🚀 启动服务..."
echo ""
echo "📋 服务信息:"
echo "  后端API: http://localhost:8000"
echo "  API文档: http://localhost:8000/docs"
echo "  前端应用: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 使用trap确保脚本退出时清理进程
cleanup() {
    echo ""
    echo "🛑 停止所有服务..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# 启动后端服务
echo "🔧 启动后端服务..."
cd ../
python3 start_juben.py &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务
echo "🎨 启动前端服务..."
cd dramatist-agent
npm run dev &
FRONTEND_PID=$!

# 等待用户中断
wait
