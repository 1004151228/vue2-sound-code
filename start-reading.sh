#!/bin/bash

echo "🚀 Vue2 源码阅读环境启动脚本"
echo "================================"

# 检查是否在正确的目录
if [ ! -d "vue" ]; then
    echo "❌ 未找到vue目录，请确保已经克隆了Vue2源码"
    echo "请运行: git clone https://github.com/vuejs/vue.git"
    exit 1
fi

# 进入vue目录
cd vue

# 检查Node.js版本
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  当前Node.js版本为 $(node --version)，建议使用Node.js 18+"
    echo "请运行: nvm install 18 && nvm use 18"
    echo ""
    echo "或者继续使用当前版本（可能遇到兼容性问题）"
    read -p "是否继续？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    if command -v pnpm &> /dev/null; then
        echo "使用pnpm安装依赖..."
        pnpm install
    else
        echo "使用npm安装依赖..."
        npm install
    fi
else
    echo "✅ 依赖已安装"
fi

# 显示项目结构
echo ""
echo "📁 Vue2 项目结构："
echo "================================"
echo "src/"
echo "├── core/           # 核心代码"
echo "│   ├── instance/   # Vue实例相关"
echo "│   ├── observer/   # 响应式系统"
echo "│   ├── vdom/       # 虚拟DOM"
echo "│   ├── components/ # 组件系统"
echo "│   └── global-api/ # 全局API"
echo "├── compiler/       # 编译器"
echo "├── platforms/      # 平台相关代码"
echo "└── shared/         # 共享工具"
echo ""

# 显示阅读建议
echo "📚 阅读建议："
echo "================================"
echo "1. 从 src/core/index.ts 开始"
echo "2. 重点关注 src/core/observer/ 响应式系统"
echo "3. 学习 src/core/vdom/ 虚拟DOM实现"
echo "4. 查看 docs/ 目录下的详细分析文档"
echo ""

# 检查是否有可用的开发脚本
if [ -f "package.json" ]; then
    echo "🔧 可用的开发命令："
    echo "================================"
    echo "npm run dev          # 开发模式"
    echo "npm run build        # 构建"
    echo "npm run test         # 运行测试"
    echo ""
fi

echo "🎯 开始你的Vue2源码阅读之旅吧！"
echo ""
echo "💡 提示："
echo "- 查看 docs/ 目录下的详细分析文档"
echo "- 使用VS Code等IDE进行源码阅读"
echo "- 结合官方文档和社区资源学习"
echo ""
echo "Happy Coding! 🎉"
