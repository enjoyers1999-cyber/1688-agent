@echo off

REM 1688 自动回复 Agent 启动脚本
REM 适用于 Windows 系统

echo =========================================
echo 🤖 1688 自动回复 Agent 启动中...
echo =========================================

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js
    echo 请先安装 Node.js 16.x 或更高版本
    pause
    exit /b 1
)

echo ✅ 检测到 Node.js

REM 检查依赖是否已安装
if not exist "node_modules" (
    echo ⏳ 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
)

REM 安装 Playwright 浏览器
if not exist "node_modules/playwright" (
    echo ⏳ 正在安装 Playwright 浏览器...
    npx playwright install chromium --with-deps
    if %errorlevel% neq 0 (
        echo ❌ Playwright 安装失败
        pause
        exit /b 1
    )
    echo ✅ Playwright 安装完成
)

echo 🚀 启动 Agent...
echo 首次运行需要登录 1688 账号
 echo 登录成功后 Agent 将自动开始监控

echo =========================================

REM 启动项目
npm start

pause
