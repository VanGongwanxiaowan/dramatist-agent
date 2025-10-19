#!/bin/bash

# 竖屏短剧策划助手 - 后端启动脚本

echo "🎬 启动竖屏短剧策划助手后端服务..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到Python3，请先安装Python3"
    exit 1
fi

# 检查是否在conda环境中
if [[ "$CONDA_DEFAULT_ENV" == "" ]]; then
    echo "⚠️  警告: 建议在conda虚拟环境中运行"
    echo "请先激活conda环境: conda activate your_env"
fi

# 进入后端目录
cd ../

# 检查后端目录是否存在
if [ ! -d "apis" ]; then
    echo "❌ 错误: 未找到后端API目录"
    echo "请确保在正确的项目目录中运行此脚本"
    exit 1
fi

# 检查依赖
echo "📦 检查Python依赖..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "❌ 错误: 未找到FastAPI，请先安装依赖"
    echo "运行: pip install -r requirements.txt"
    exit 1
fi

# 启动后端服务
echo "🚀 启动后端服务..."
echo "服务地址: http://localhost:8000"
echo "API文档: http://localhost:8000/docs"
echo "按 Ctrl+C 停止服务"
echo ""

# 启动服务
python3 start_juben.py
