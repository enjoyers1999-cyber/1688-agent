#!/bin/bash
# 1688 自动回复 Agent 启动脚本

cd "$(dirname "$0")"

echo "🤖 启动 1688 自动回复 Agent..."
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖中..."
  npm install
fi

# 使用 tsx 运行
./node_modules/tsx/dist/cli.mjs src/main.ts
