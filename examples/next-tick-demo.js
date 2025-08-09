// Vue2 nextTick 实现演示
// 这个示例展示了Vue2中nextTick的工作原理

// 1. 模拟Vue2的nextTick实现

// 全局变量
let isUsingMicroTask = false
const callbacks = []
let pending = false

// 清空回调函数队列
function flushCallbacks() {
  console.log('🔄 执行flushCallbacks，清空回调队列')
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    try {
      copies[i]()
    } catch (error) {
      console.error('❌ nextTick回调执行出错:', error)
    }
  }
}

// 选择异步任务实现方式
let timerFunc

// 优先使用Promise（微任务）
if (typeof Promise !== 'undefined') {
  const p = Promise.resolve()
  timerFunc = () => {
    console.log('📝 使用Promise.then作为异步任务')
    p.then(flushCallbacks)
  }
  isUsingMicroTask = true
} else if (typeof MutationObserver !== 'undefined') {
  // 使用MutationObserver（微任务）
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    console.log('📝 使用MutationObserver作为异步任务')
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined') {
  // 使用setImmediate（宏任务）
  timerFunc = () => {
    console.log('📝 使用setImmediate作为异步任务')
    setImmediate(flushCallbacks)
  }
} else {
  // 使用setTimeout（宏任务）
  timerFunc = () => {
    console.log('📝 使用setTimeout作为异步任务')
    setTimeout(flushCallbacks, 0)
  }
}

// nextTick函数实现
function nextTick(cb, ctx) {
  let _resolve
  
  // 将回调函数添加到队列中
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        console.error('❌ nextTick回调执行出错:', e)
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  
  // 如果当前没有pending的任务，则启动异步任务
  if (!pending) {
    pending = true
    console.log('🚀 启动异步任务')
    timerFunc()
  }
  
  // 如果没有提供回调函数且支持Promise，则返回Promise
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}

// 2. 演示使用

console.log('🚀 Vue2 nextTick 实现演示')
console.log('========================')

// 模拟Vue实例
const vm = {
  message: 'Hello',
  $el: { textContent: 'Hello' },
  $nextTick: nextTick
}

// 演示1：基本用法
console.log('\n📋 演示1：基本用法')
console.log('当前message:', vm.message)
console.log('当前DOM内容:', vm.$el.textContent)

vm.message = 'World'
console.log('更新message为:', vm.message)

vm.$nextTick(() => {
  console.log('✅ nextTick回调执行')
  console.log('DOM已更新，内容为:', vm.$el.textContent)
})

// 演示2：多个nextTick调用
console.log('\n📋 演示2：多个nextTick调用')
vm.message = 'Multiple'
console.log('更新message为:', vm.message)

vm.$nextTick(() => {
  console.log('✅ 第一个nextTick回调')
})

vm.$nextTick(() => {
  console.log('✅ 第二个nextTick回调')
})

vm.$nextTick(() => {
  console.log('✅ 第三个nextTick回调')
})

// 演示3：Promise方式
console.log('\n📋 演示3：Promise方式')
vm.message = 'Promise'
console.log('更新message为:', vm.message)

vm.$nextTick().then(() => {
  console.log('✅ Promise方式nextTick执行')
  console.log('DOM已更新，内容为:', vm.$el.textContent)
})

// 演示4：错误处理
console.log('\n📋 演示4：错误处理')
vm.message = 'Error'
console.log('更新message为:', vm.message)

vm.$nextTick(() => {
  console.log('✅ 正常回调')
  throw new Error('这是一个测试错误')
})

vm.$nextTick(() => {
  console.log('✅ 错误后的回调仍然会执行')
})

// 演示5：批量处理
console.log('\n📋 演示5：批量处理')
console.log('同时调用多个nextTick，观察是否只启动一次异步任务')

vm.message = 'Batch'
vm.$nextTick(() => console.log('1️⃣ 批量处理回调1'))
vm.$nextTick(() => console.log('2️⃣ 批量处理回调2'))
vm.$nextTick(() => console.log('3️⃣ 批量处理回调3'))

// 演示6：异步任务类型
console.log('\n📋 演示6：异步任务类型')
console.log('当前使用的异步任务类型:', isUsingMicroTask ? '微任务' : '宏任务')

// 3. 实际应用场景演示

console.log('\n🎯 实际应用场景演示')

// 场景1：等待列表更新后滚动到底部
console.log('\n📋 场景1：等待列表更新后滚动到底部')
const list = {
  items: ['Item 1', 'Item 2'],
  scrollTop: 0,
  scrollHeight: 100
}

console.log('当前列表项数:', list.items.length)
list.items.push('Item 3')
console.log('添加新项后列表项数:', list.items.length)

nextTick(() => {
  console.log('✅ 列表更新完成，滚动到底部')
  list.scrollTop = list.scrollHeight
  console.log('滚动位置:', list.scrollTop)
})

// 场景2：等待DOM更新后聚焦输入框
console.log('\n📋 场景2：等待DOM更新后聚焦输入框')
const input = {
  show: false,
  focused: false
}

console.log('当前输入框状态:', input.show ? '显示' : '隐藏')
input.show = true
console.log('设置输入框为显示状态')

nextTick(() => {
  console.log('✅ DOM更新完成，聚焦输入框')
  input.focused = true
  console.log('输入框已聚焦:', input.focused)
})

// 场景3：等待组件更新后获取尺寸
console.log('\n📋 场景3：等待组件更新后获取尺寸')
const component = {
  width: 50,
  height: 50
}

console.log('当前组件尺寸:', component.width, 'x', component.height)
component.width = 100
component.height = 100
console.log('更新组件尺寸为:', component.width, 'x', component.height)

nextTick(() => {
  console.log('✅ 组件更新完成，获取新尺寸')
  const rect = { width: component.width, height: component.height }
  console.log('获取到的尺寸:', rect.width, 'x', rect.height)
})

// 4. 性能对比演示

console.log('\n⚡ 性能对比演示')

// 对比：直接执行 vs nextTick
console.log('\n📋 对比：直接执行 vs nextTick')

// 直接执行
console.time('直接执行')
for (let i = 0; i < 1000; i++) {
  // 模拟一些操作
}
console.timeEnd('直接执行')

// nextTick执行
console.time('nextTick执行')
for (let i = 0; i < 1000; i++) {
  nextTick(() => {
    // 模拟一些操作
  })
}
console.timeEnd('nextTick执行')

// 5. 总结

console.log('\n📊 总结')
console.log('✅ Vue2的nextTick实现特点：')
console.log('1. 优先使用微任务（Promise/MutationObserver）')
console.log('2. 提供多种降级方案（setImmediate/setTimeout）')
console.log('3. 批量处理多个回调，提高性能')
console.log('4. 支持Promise和回调函数两种方式')
console.log('5. 统一的错误处理机制')
console.log('6. 确保DOM更新的时序性')

console.log('\n💡 使用建议：')
console.log('1. 在数据变化后需要操作DOM时使用nextTick')
console.log('2. 优先使用Promise方式，代码更清晰')
console.log('3. 注意错误处理，避免回调中的错误影响其他代码')
console.log('4. 避免在nextTick中再次调用nextTick，可能导致无限循环')

console.log('\n🎉 演示完成！')
