// Vue2 DOM转AST语法树演示

/**
 * Vue2中DOM转换为AST语法树的完整过程
 * 
 * 1. 模板字符串 → HTML解析器 → AST节点树
 * 2. AST节点类型：ASTElement、ASTText、ASTExpression
 * 3. 解析过程：标签解析、属性解析、指令解析、文本解析
 */

// AST节点类型定义
const ASTNodeTypes = {
  ELEMENT: 1,    // 元素节点
  EXPRESSION: 2, // 表达式节点
  TEXT: 3        // 文本节点
}

// 创建AST元素节点
function createASTElement(tag, attrs = [], parent = null) {
  return {
    type: ASTNodeTypes.ELEMENT,
    tag,
    attrsList: attrs,
    attrsMap: makeAttrsMap(attrs),
    parent,
    children: [],
    plain: true,
    static: false,
    staticRoot: false
  }
}

// 创建AST文本节点
function createASTText(text) {
  return {
    type: ASTNodeTypes.TEXT,
    text,
    static: true
  }
}

// 将属性数组转换为Map
function makeAttrsMap(attrs) {
  const map = {}
  for (let i = 0; i < attrs.length; i++) {
    map[attrs[i].name] = attrs[i].value
  }
  return map
}

// 简化的HTML解析器
function parseHTML(html, options) {
  const stack = []
  let index = 0
  let currentParent = null
  let root = null

  // 正则表达式
  const startTagOpen = /^<([a-zA-Z_][\w\-\.]*)/
  const startTagClose = /^\s*(\/?)>/
  const endTag = /^<\/([a-zA-Z_][\w\-\.]*)>/
  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/

  function advance(n) {
    index += n
    html = html.substring(n)
  }

  function parseStartTag() {
    const start = html.match(startTagOpen)
    if (start) {
      const match = {
        tagName: start[1],
        attrs: [],
        start: index
      }
      advance(start[0].length)
      
      let end, attr
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length)
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5] || ''
        })
      }
      
      if (end) {
        match.unarySlash = end[1]
        advance(end[0].length)
        match.end = index
        return match
      }
    }
  }

  function handleStartTag(match) {
    const tagName = match.tagName
    const unarySlash = match.unarySlash
    const unary = !!unarySlash

    const attrs = match.attrs.map(attr => ({
      name: attr.name,
      value: attr.value
    }))

    const element = createASTElement(tagName, attrs, currentParent)
    
    if (!root) {
      root = element
    }

    if (!unary) {
      currentParent = element
      stack.push(element)
    } else {
      closeElement(element)
    }
  }

  function parseEndTag(tagName) {
    let pos
    for (pos = stack.length - 1; pos >= 0; pos--) {
      if (stack[pos].tag === tagName) {
        break
      }
    }
    if (pos >= 0) {
      for (let i = stack.length - 1; i >= pos; i--) {
        if (options.end) {
          options.end(stack[i].tag, stack[i].start, stack[i].end)
        }
      }
      stack.length = pos
      currentParent = stack[pos - 1] || null
    }
  }

  function closeElement(element) {
    if (currentParent && !element.forbidden) {
      currentParent.children.push(element)
      element.parent = currentParent
    }
  }

  // 开始解析
  while (html) {
    let textEnd = html.indexOf('<')
    if (textEnd === 0) {
      // 结束标签
      const endTagMatch = html.match(endTag)
      if (endTagMatch) {
        advance(endTagMatch[0].length)
        parseEndTag(endTagMatch[1])
        continue
      }

      // 开始标签
      const startTagMatch = parseStartTag()
      if (startTagMatch) {
        handleStartTag(startTagMatch)
        continue
      }
    }

    // 文本内容
    let text
    if (textEnd >= 0) {
      text = html.substring(0, textEnd)
    } else {
      text = html
    }

    if (text) {
      advance(text.length)
    }

    if (options.chars && text) {
      options.chars(text, index - text.length, index)
    }
  }

  return root
}

// 主解析函数
function parse(template, options = {}) {
  let root = null
  let currentParent = null
  const stack = []

  function closeElement(element) {
    if (currentParent && !element.forbidden) {
      currentParent.children.push(element)
      element.parent = currentParent
    }
  }

  parseHTML(template, {
    start(tag, attrs, unary, start, end) {
      const element = createASTElement(tag, attrs, currentParent)
      
      if (!root) {
        root = element
      }

      if (!unary) {
        currentParent = element
        stack.push(element)
      } else {
        closeElement(element)
      }
    },
    end(tag, start, end) {
      if (stack.length > 0) {
        const element = stack.pop()
        currentParent = stack.length > 0 ? stack[stack.length - 1] : null
        closeElement(element)
      }
    },
    chars(text, start, end) {
      if (currentParent && text.trim()) {
        const child = createASTText(text)
        currentParent.children.push(child)
      }
    }
  })

  return root
}

// 演示示例
console.log('=== Vue2 DOM转AST语法树演示 ===\n')

// 示例1：简单元素
console.log('1. 简单元素解析:')
const template1 = '<div>Hello World</div>'
const ast1 = parse(template1)
console.log('模板:', template1)
console.log('AST:', JSON.stringify(ast1, null, 2))
console.log('\n')

// 示例2：带属性的元素
console.log('2. 带属性的元素解析:')
const template2 = '<div class="container" id="app">Hello World</div>'
const ast2 = parse(template2)
console.log('模板:', template2)
console.log('AST:', JSON.stringify(ast2, null, 2))
console.log('\n')

// 示例3：嵌套元素
console.log('3. 嵌套元素解析:')
const template3 = '<div><p>Hello</p><span>World</span></div>'
const ast3 = parse(template3)
console.log('模板:', template3)
console.log('AST:', JSON.stringify(ast3, null, 2))
console.log('\n')

// 示例4：Vue指令（简化版）
console.log('4. Vue指令解析（简化版）:')
const template4 = '<div v-if="show" v-for="item in items" :key="item.id">{{item.name}}</div>'
const ast4 = parse(template4)
console.log('模板:', template4)
console.log('AST:', JSON.stringify(ast4, null, 2))
console.log('\n')

// 示例5：组件
console.log('5. 组件解析:')
const template5 = '<MyComponent :prop="value" @click="handleClick">Slot Content</MyComponent>'
const ast5 = parse(template5)
console.log('模板:', template5)
console.log('AST:', JSON.stringify(ast5, null, 2))

console.log('\n=== 解析完成 ===')

/**
 * 总结：
 * 
 * 1. DOM转AST的过程：
 *    - 模板字符串 → HTML解析器 → AST节点树
 *    - 使用正则表达式解析HTML标签、属性、文本
 *    - 构建树形结构的AST节点
 * 
 * 2. AST节点类型：
 *    - ASTElement (type: 1): 元素节点，包含标签、属性、子节点
 *    - ASTText (type: 3): 文本节点，包含纯文本内容
 *    - ASTExpression (type: 2): 表达式节点，包含插值表达式
 * 
 * 3. 关键属性：
 *    - tag: 标签名
 *    - attrsList: 属性列表
 *    - attrsMap: 属性映射
 *    - children: 子节点数组
 *    - parent: 父节点引用
 *    - static: 是否为静态节点
 *    - directives: 指令数组
 * 
 * 4. 解析过程：
 *    - 标签解析：识别开始标签、结束标签、自闭合标签
 *    - 属性解析：解析HTML属性和Vue指令
 *    - 文本解析：处理文本内容和插值表达式
 *    - 树构建：维护节点层级关系
 */
