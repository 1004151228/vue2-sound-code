// Vue2 数组方法重写演示
// 这个示例展示了Vue2是如何重写数组方法的

// 1. 模拟Vue2的数组方法重写机制

// 保存原始数组原型
const arrayProto = Array.prototype

// 创建新的数组方法对象，继承自Array.prototype
const arrayMethods = Object.create(arrayProto)

// 需要重写的方法
const methodsToPatch = [
  'push',
  'pop', 
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

// 重写数组方法
methodsToPatch.forEach(function (method) {
  // 缓存原始方法
  const original = arrayProto[method]
  
  // 定义重写的方法
  Object.defineProperty(arrayMethods, method, {
    value: function mutator(...args) {
      console.log(`🔄 调用重写的 ${method} 方法，参数:`, args)
      
      // 调用原始方法
      const result = original.apply(this, args)
      
      // 获取Observer实例（这里模拟）
      const ob = this.__ob__
      
      // 处理新增的元素
      let inserted
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args
          break
        case 'splice':
          inserted = args.slice(2)
          break
      }
      
      // 对新元素进行响应式处理（这里模拟）
      if (inserted && inserted.length > 0) {
        console.log(`📝 新增元素需要响应式处理:`, inserted)
        if (ob && ob.observeArray) {
          ob.observeArray(inserted)
        }
      }
      
      // 通知依赖更新（这里模拟）
      if (ob && ob.dep) {
        console.log(`🔔 通知依赖更新`)
        ob.dep.notify()
      }
      
      return result
    },
    enumerable: false,
    writable: true,
    configurable: true
  })
})

// 2. 模拟Observer类
class Observer {
  constructor(value) {
    this.value = value
    this.dep = {
      notify: () => console.log('📢 依赖更新通知')
    }
    
    // 将Observer实例挂载到数组上
    Object.defineProperty(value, '__ob__', {
      value: this,
      enumerable: false,
      writable: true,
      configurable: true
    })
    
    if (Array.isArray(value)) {
      // 重写数组的原型链
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(value, arrayMethods)
      } else {
        // 兼容性处理
        for (let i = 0, l = methodsToPatch.length; i < l; i++) {
          const key = methodsToPatch[i]
          Object.defineProperty(value, key, {
            value: arrayMethods[key],
            enumerable: false,
            writable: true,
            configurable: true
          })
        }
      }
      
      // 对现有元素进行响应式处理
      this.observeArray(value)
    }
  }
  
  observeArray(items) {
    for (let i = 0, l = items.length; i < l; i++) {
      console.log(`👀 观察数组元素:`, items[i])
    }
  }
}

// 3. 演示使用

console.log('🚀 Vue2 数组方法重写演示')
console.log('========================')

// 创建原始数组
const originalArray = [1, 2, 3]
console.log('📋 原始数组:', originalArray)

// 创建Observer实例
const observer = new Observer(originalArray)
console.log('🔍 Observer实例:', observer)

// 测试重写的数组方法
console.log('\n🧪 测试重写的数组方法:')

// 测试push方法
console.log('\n1. 测试 push 方法:')
originalArray.push(4)
console.log('   结果:', originalArray)

// 测试splice方法
console.log('\n2. 测试 splice 方法:')
originalArray.splice(1, 1, 'new')
console.log('   结果:', originalArray)

// 测试pop方法
console.log('\n3. 测试 pop 方法:')
originalArray.pop()
console.log('   结果:', originalArray)

// 测试unshift方法
console.log('\n4. 测试 unshift 方法:')
originalArray.unshift(0)
console.log('   结果:', originalArray)

// 测试sort方法
console.log('\n5. 测试 sort 方法:')
originalArray.sort()
console.log('   结果:', originalArray)

// 4. 对比原始数组方法

console.log('\n🔍 对比原始数组方法:')
const normalArray = [1, 2, 3]
console.log('   原始数组:', normalArray)

// 这些操作不会触发响应式更新
normalArray.push(4)
console.log('   原始push后:', normalArray)

// 5. 总结

console.log('\n📊 总结:')
console.log('✅ Vue2通过重写数组方法实现了响应式更新')
console.log('✅ 重写的方法包括: push, pop, shift, unshift, splice, sort, reverse')
console.log('✅ 每次调用重写方法时都会:')
console.log('   1. 执行原始方法')
console.log('   2. 处理新增元素（如果有）')
console.log('   3. 通知依赖更新')
console.log('❌ 直接索引赋值和修改length不会触发更新')
console.log('💡 解决方案: 使用Vue.set或数组方法')

// 6. 实际Vue2中的使用示例

console.log('\n🎯 实际Vue2中的使用示例:')
console.log(`
// Vue实例
const vm = new Vue({
  data: {
    list: [1, 2, 3]
  }
})

// 这些会触发响应式更新
vm.list.push(4)        // ✅ 会触发更新
vm.list.splice(0, 1)   // ✅ 会触发更新
vm.list.sort()         // ✅ 会触发更新

// 这些不会触发响应式更新
vm.list[0] = 5         // ❌ 不会触发更新
vm.list.length = 0     // ❌ 不会触发更新

// 解决方案
Vue.set(vm.list, 0, 5) // ✅ 使用Vue.set
vm.$set(vm.list, 0, 5) // ✅ 使用vm.$set
vm.list.splice(0, 1, 5) // ✅ 使用数组方法
`)
