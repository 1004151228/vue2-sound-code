# Vue2 源码阅读指南

## 项目结构

```
vue2-sound-code/
├── vue/                    # Vue2 源码目录
│   ├── src/               # 源码目录
│   │   ├── core/          # 核心代码
│   │   │   ├── instance/  # Vue实例相关
│   │   │   ├── observer/  # 响应式系统
│   │   │   ├── vdom/      # 虚拟DOM
│   │   │   ├── components/ # 组件系统
│   │   │   └── global-api/ # 全局API
│   │   ├── compiler/      # 编译器
│   │   ├── platforms/     # 平台相关代码
│   │   └── shared/        # 共享工具
│   ├── packages/          # 包目录
│   └── dist/              # 构建输出
├── docs/                  # 阅读笔记和文档
│   ├── 01-入口文件分析.md
│   ├── 02-响应式系统分析.md
│   ├── 03-虚拟DOM分析.md
│   ├── 04-源码阅读工具.md
│   ├── 05-数组方法重写分析.md
│   ├── 06-生命周期和渲染系统分析.md
│   ├── 07-编译器系统分析.md
│   ├── 08-Vue2整体架构总结.md
│   └── 09-nextTick实现分析.md
└── examples/              # 示例代码
    ├── array-methods-demo.js
    └── next-tick-demo.js
```

## 阅读顺序建议

### 1. 入口文件
- `src/core/index.ts` - Vue的入口文件
- `src/core/instance/index.ts` - Vue实例的创建

### 2. 响应式系统
- `src/core/observer/` - 响应式系统的核心
  - `index.ts` - 响应式系统的入口
  - `dep.ts` - 依赖收集
  - `watcher.ts` - 观察者
  - `array.ts` - 数组响应式处理

### 3. 虚拟DOM
- `src/core/vdom/` - 虚拟DOM相关
  - `vnode.ts` - 虚拟节点定义
  - `patch.ts` - DOM更新算法

### 4. 组件系统
- `src/core/components/` - 组件相关
- `src/core/global-api/` - 全局API

### 5. 生命周期和渲染
- `src/core/instance/lifecycle.ts` - 生命周期管理
- `src/core/instance/render.ts` - 渲染系统

### 6. 异步更新
- `src/core/util/next-tick.ts` - nextTick实现

### 7. 编译器
- `src/compiler/` - 模板编译器

## 关键概念

### 响应式系统
Vue2的响应式系统基于Object.defineProperty实现，主要包括：
- Observer: 数据劫持
- Dep: 依赖收集
- Watcher: 观察者模式

### 虚拟DOM
- VNode: 虚拟节点
- Patch: DOM diff算法
- 组件更新机制

### 数组方法重写
Vue2重写了7个数组方法来实现响应式更新：
- `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`

### 生命周期
- beforeCreate
- created
- beforeMount
- mounted
- beforeUpdate
- updated
- beforeDestroy
- destroyed

### 编译器系统
- Parse: 模板解析
- Optimize: 静态优化
- Generate: 代码生成

### 异步更新机制
- nextTick: 在下次DOM更新循环结束之后执行延迟回调
- 微任务优先：优先使用Promise和MutationObserver
- 批量处理：合并多个nextTick调用

## 开发环境设置

1. 克隆Vue2源码：
```bash
git clone https://github.com/vuejs/vue.git
cd vue
git checkout v2.7.16
```

2. 安装依赖（需要Node.js 18+）：
```bash
pnpm install
```

3. 开发模式：
```bash
npm run dev
```

## 阅读技巧

1. **从入口开始**：先看`src/core/index.ts`了解整体结构
2. **关注注释**：源码中有大量中文注释，仔细阅读
3. **画图理解**：对于复杂流程，建议画图理解
4. **调试代码**：可以修改源码进行调试
5. **结合文档**：参考Vue2官方文档理解API设计

## 重要文件说明

- `src/core/instance/index.ts` - Vue构造函数
- `src/core/observer/index.ts` - 响应式系统入口
- `src/core/observer/array.ts` - 数组方法重写
- `src/core/vdom/patch.ts` - DOM更新算法
- `src/core/instance/lifecycle.ts` - 生命周期管理
- `src/core/instance/render.ts` - 渲染系统
- `src/core/util/next-tick.ts` - nextTick实现
- `src/compiler/index.ts` - 模板编译器入口

## 学习资源

- [Vue2官方文档](https://v2.vuejs.org/)
- [Vue2源码解析](https://github.com/answershuto/learnVue)
- [Vue2技术揭秘](https://ustbhuangyi.github.io/vue-analysis/)
