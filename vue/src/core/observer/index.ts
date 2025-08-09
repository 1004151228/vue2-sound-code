import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  isArray,
  hasProto,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering,
  hasChanged,
  noop
} from '../util/index'
import { isReadonly, isRef, TrackOpTypes, TriggerOpTypes } from '../../v3'

// 获取数组方法的所有属性名，用于在无法使用__proto__的环境中手动添加方法
const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

// 用于标识没有初始值的情况
const NO_INITIAL_VALUE = {}

/**
 * 控制是否应该进行响应式观察的标志
 * 在某些情况下，我们可能想要在组件的更新计算中禁用观察
 */
export let shouldObserve: boolean = true

/**
 * 切换是否进行响应式观察
 * @param value 是否启用观察
 */
export function toggleObserving(value: boolean) {
  shouldObserve = value
}

// SSR环境下的模拟依赖对象，所有方法都是空操作
const mockDep = {
  notify: noop,
  depend: noop,
  addSub: noop,
  removeSub: noop
} as Dep

/**
 * Observer类，用于附加到每个被观察的对象上
 * 一旦附加，观察者会将目标对象的属性键转换为getter/setter
 * 这些getter/setter会收集依赖关系并分发更新
 */
export class Observer {
  dep: Dep // 依赖收集器
  vmCount: number // 将此对象作为根$data的Vue实例数量

  constructor(public value: any, public shallow = false, public mock = false) {
    // this.value = value
    // 根据是否为mock模式创建依赖收集器
    this.dep = mock ? mockDep : new Dep()
    this.vmCount = 0
    // 在对象上定义__ob__属性，指向当前Observer实例
    def(value, '__ob__', this)
    
    if (isArray(value)) {
      // 处理数组类型
      if (!mock) {
        if (hasProto) {
          // 如果支持__proto__，直接修改原型链
          /* eslint-disable no-proto */
          ;(value as any).__proto__ = arrayMethods
          /* eslint-enable no-proto */
        } else {
          // 如果不支持__proto__，手动为每个数组方法添加属性
          for (let i = 0, l = arrayKeys.length; i < l; i++) {
            const key = arrayKeys[i]
            def(value, key, arrayMethods[key])
          }
        }
      }
      // 如果不是浅观察模式，递归观察数组中的每个元素
      if (!shallow) {
        this.observeArray(value)
      }
    } else {
      /**
       * 遍历所有属性并将它们转换为getter/setter
       * 此方法应该只在值类型为Object时调用
       */
      const keys = Object.keys(value)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        defineReactive(value, key, NO_INITIAL_VALUE, undefined, shallow, mock)
      }
    }
  }

  /**
   * 观察数组中的每个元素
   * @param value 要观察的数组
   */
  observeArray(value: any[]) {
    for (let i = 0, l = value.length; i < l; i++) {
      observe(value[i], false, this.mock)
    }
  }
}

// 辅助函数

/**
 * 尝试为值创建一个观察者实例
 * 如果成功观察则返回新的观察者，
 * 如果值已经有观察者则返回现有的观察者
 * @param value 要观察的值
 * @param shallow 是否进行浅观察
 * @param ssrMockReactivity 是否为SSR模拟响应式
 * @returns Observer实例或undefined
 */
export function observe(
  value: any,
  shallow?: boolean,
  ssrMockReactivity?: boolean
): Observer | void {
  // 如果值已经有__ob__属性且是Observer实例，直接返回
  if (value && hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    return value.__ob__
  }
  
  // 检查是否应该进行观察的条件：
  // 1. shouldObserve为true
  // 2. 不是SSR环境或允许SSR模拟响应式
  // 3. 值是数组或普通对象
  // 4. 对象是可扩展的
  // 5. 没有跳过响应式标记
  // 6. 不是ref对象
  // 7. 不是VNode实例
  if (
    shouldObserve &&
    (ssrMockReactivity || !isServerRendering()) &&
    (isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value.__v_skip /* ReactiveFlags.SKIP */ &&
    !isRef(value) &&
    !(value instanceof VNode)
  ) {
    return new Observer(value, shallow, ssrMockReactivity)
  }
}

/**
 * 在对象上定义响应式属性
 * @param obj 目标对象
 * @param key 属性键
 * @param val 属性值
 * @param customSetter 自定义setter函数
 * @param shallow 是否进行浅观察
 * @param mock 是否为mock模式
 * @param observeEvenIfShallow 即使在浅观察模式下也进行观察
 * @returns 依赖收集器
 */
export function defineReactive(
  obj: object,
  key: string,
  val?: any,
  customSetter?: Function | null,
  shallow?: boolean,
  mock?: boolean,
  observeEvenIfShallow = false
) {
  // 为每个属性创建独立的依赖收集器
  const dep = new Dep()

  // 获取属性的描述符
  const property = Object.getOwnPropertyDescriptor(obj, key)
  // 如果属性不可配置，直接返回
  if (property && property.configurable === false) {
    return
  }

  // 处理预定义的getter/setter
  const getter = property && property.get
  const setter = property && property.set
  
  // 如果没有getter或没有setter，且没有提供初始值，则从对象中获取当前值
  if (
    (!getter || setter) &&
    (val === NO_INITIAL_VALUE || arguments.length === 2)
  ) {
    val = obj[key]
  }

  // 创建子观察者（如果不是浅观察模式）
  let childOb = shallow ? val && val.__ob__ : observe(val, false, mock)
  
  // 使用Object.defineProperty定义响应式属性
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      // 获取属性值
      const value = getter ? getter.call(obj) : val
      
      // 如果有依赖目标（当前正在执行的watcher），收集依赖
      if (Dep.target) {
        if (__DEV__) {
          // 开发环境下，传递更多信息用于调试
          dep.depend({
            target: obj,
            type: TrackOpTypes.GET,
            key
          })
        } else {
          // 生产环境下，简单收集依赖
          dep.depend()
        }
        
        // 如果子对象也是响应式的，也要收集其依赖
        if (childOb) {
          childOb.dep.depend()
          // 如果值是数组，需要特殊处理数组依赖
          if (isArray(value)) {
            dependArray(value)
          }
        }
      }
      
      // 如果值是ref且不是浅观察，返回其.value
      return isRef(value) && !shallow ? value.value : value
    },
    set: function reactiveSetter(newVal) {
      // 获取旧值
      const value = getter ? getter.call(obj) : val
      
      // 如果新值与旧值相同，不触发更新
      if (!hasChanged(value, newVal)) {
        return
      }
      
      // 开发环境下调用自定义setter
      if (__DEV__ && customSetter) {
        customSetter()
      }
      
      // 如果存在预定义的setter，调用它
      if (setter) {
        setter.call(obj, newVal)
      } else if (getter) {
        // #7981: 对于没有setter的访问器属性，直接返回
        return
      } else if (!shallow && isRef(value) && !isRef(newVal)) {
        // 如果旧值是ref且新值不是ref，更新ref的value
        value.value = newVal
        return
      } else {
        // 更新内部值
        val = newVal
      }
      
      // 为新值创建子观察者
      childOb = shallow ? newVal && newVal.__ob__ : observe(newVal, false, mock)
      
      // 通知所有依赖进行更新
      if (__DEV__) {
        // 开发环境下，传递更多信息用于调试
        dep.notify({
          type: TriggerOpTypes.SET,
          target: obj,
          key,
          newValue: newVal,
          oldValue: value
        })
      } else {
        // 生产环境下，简单通知更新
        dep.notify()
      }
    }
  })

  return dep
}

/**
 * 在对象上设置属性。如果属性不存在则添加新属性，
 * 并触发变更通知
 * @param array 数组类型重载
 * @param key 数组索引
 * @param value 要设置的值
 * @param object 对象类型重载
 * @param target 目标对象或数组
 * @param key 属性键或索引
 * @param val 要设置的值
 * @returns 设置的值
 */
export function set<T>(array: T[], key: number, value: T): T
export function set<T>(object: object, key: string | number, value: T): T
export function set(
  target: any[] | Record<string, any>,
  key: any,
  val: any
): any {
  // 开发环境下检查目标是否有效
  if (__DEV__ && (isUndef(target) || isPrimitive(target))) {
    warn(
      `Cannot set reactive property on undefined, null, or primitive value: ${target}`
    )
  }
  
  // 检查目标是否为只读
  if (isReadonly(target)) {
    __DEV__ && warn(`Set operation on key "${key}" failed: target is readonly.`)
    return
  }
  
  // 获取目标的观察者实例
  const ob = (target as any).__ob__
  
  // 处理数组类型
  if (isArray(target) && isValidArrayIndex(key)) {
    // 确保数组长度足够
    target.length = Math.max(target.length, key)
    // 使用splice方法设置值，这会自动触发响应式更新
    target.splice(key, 1, val)
    // 在SSR模拟模式下，数组方法没有被劫持，需要手动观察新值
    if (ob && !ob.shallow && ob.mock) {
      observe(val, false, true)
    }
    return val
  }
  
  // 如果属性已存在且不在Object.prototype上，直接设置
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  
  // 避免在Vue实例或其根$data上添加响应式属性
  if ((target as any)._isVue || (ob && ob.vmCount)) {
    __DEV__ &&
      warn(
        'Avoid adding reactive properties to a Vue instance or its root $data ' +
          'at runtime - declare it upfront in the data option.'
      )
    return val
  }
  
  // 如果目标没有观察者，直接设置属性
  if (!ob) {
    target[key] = val
    return val
  }
  
  // 定义响应式属性
  defineReactive(ob.value, key, val, undefined, ob.shallow, ob.mock)
  
  // 通知依赖进行更新
  if (__DEV__) {
    ob.dep.notify({
      type: TriggerOpTypes.ADD,
      target: target,
      key,
      newValue: val,
      oldValue: undefined
    })
  } else {
    ob.dep.notify()
  }
  
  return val
}

/**
 * 删除属性并在必要时触发变更通知
 * @param array 数组类型重载
 * @param key 数组索引
 * @param object 对象类型重载
 * @param target 目标对象或数组
 * @param key 要删除的属性键或索引
 */
export function del<T>(array: T[], key: number): void
export function del(object: object, key: string | number): void
export function del(target: any[] | object, key: any) {
  // 开发环境下检查目标是否有效
  if (__DEV__ && (isUndef(target) || isPrimitive(target))) {
    warn(
      `Cannot delete reactive property on undefined, null, or primitive value: ${target}`
    )
  }
  
  // 处理数组类型，使用splice删除元素
  if (isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  
  // 获取目标的观察者实例
  const ob = (target as any).__ob__
  
  // 避免删除Vue实例或其根$data上的属性
  if ((target as any)._isVue || (ob && ob.vmCount)) {
    __DEV__ &&
      warn(
        'Avoid deleting properties on a Vue instance or its root $data ' +
          '- just set it to null.'
      )
    return
  }
  
  // 检查目标是否为只读
  if (isReadonly(target)) {
    __DEV__ &&
      warn(`Delete operation on key "${key}" failed: target is readonly.`)
    return
  }
  
  // 如果属性不存在，直接返回
  if (!hasOwn(target, key)) {
    return
  }
  
  // 删除属性
  delete target[key]
  
  // 如果没有观察者，不需要通知更新
  if (!ob) {
    return
  }
  
  // 通知依赖进行更新
  if (__DEV__) {
    ob.dep.notify({
      type: TriggerOpTypes.DELETE,
      target: target,
      key
    })
  } else {
    ob.dep.notify()
  }
}

/**
 * 当数组被访问时收集数组元素的依赖关系
 * 因为我们无法像属性getter那样拦截数组元素访问
 * @param value 要收集依赖的数组
 */
function dependArray(value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    // 如果数组元素有观察者，收集其依赖
    if (e && e.__ob__) {
      e.__ob__.dep.depend()
    }
    // 如果数组元素也是数组，递归收集依赖
    if (isArray(e)) {
      dependArray(e)
    }
  }
}
