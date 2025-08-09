# Vue2 DOM转AST语法树分析

## 1. 概述

Vue2的编译器系统将模板字符串转换为渲染函数的过程中，第一步就是将DOM模板解析为AST（抽象语法树）。这个过程是Vue2编译器的核心环节，为后续的优化和代码生成奠定基础。

### 1.1 什么是AST

AST（Abstract Syntax Tree，抽象语法树）是源代码语法结构的一种抽象表示。它以树状的形式表现编程语言的语法结构，树上的每个节点都表示源代码中的一种结构。

### 1.2 Vue2中的AST

在Vue2中，AST主要用于表示模板的结构，包括：
- 元素节点（ASTElement）
- 文本节点（ASTText）
- 表达式节点（ASTExpression）

## 2. AST节点类型

### 2.1 节点类型定义

```typescript
// AST节点类型枚举
const ASTNodeTypes = {
  ELEMENT: 1,    // 元素节点
  EXPRESSION: 2, // 表达式节点
  TEXT: 3        // 文本节点
}
```

### 2.2 ASTElement（元素节点）

元素节点表示HTML标签，包含标签名、属性、子节点等信息：

```typescript
interface ASTElement {
  type: 1                    // 节点类型：元素节点
  tag: string                // 标签名
  attrsList: Array<ASTAttr>  // 属性列表
  attrsMap: { [key: string]: any }  // 属性映射
  parent: ASTElement | void  // 父节点
  children: Array<ASTNode>   // 子节点数组
  
  // 静态相关
  static?: boolean           // 是否为静态节点
  staticRoot?: boolean       // 是否为静态根节点
  
  // 指令相关
  directives?: Array<ASTDirective>  // 指令数组
  events?: { [key: string]: ASTElementHandler }  // 事件处理器
  
  // 组件相关
  component?: string         // 组件名
  key?: string              // key属性
  ref?: string              // ref属性
  
  // 条件渲染
  if?: string               // v-if条件
  ifConditions?: ASTIfConditions  // 条件渲染数组
  
  // 列表渲染
  for?: string              // v-for表达式
  alias?: string            // v-for别名
  iterator1?: string        // v-for迭代器1
  iterator2?: string        // v-for迭代器2
}
```

### 2.3 ASTText（文本节点）

文本节点表示纯文本内容：

```typescript
interface ASTText {
  type: 3        // 节点类型：文本节点
  text: string   // 文本内容
  static?: boolean  // 是否为静态文本
}
```

### 2.4 ASTExpression（表达式节点）

表达式节点表示插值表达式，如`{{message}}`：

```typescript
interface ASTExpression {
  type: 2                    // 节点类型：表达式节点
  expression: string         // 表达式字符串
  text: string              // 原始文本
  tokens: Array<string | Object>  // 词法单元
  static?: boolean          // 是否为静态表达式
}
```

## 3. 解析过程

### 3.1 解析器架构

Vue2的HTML解析器采用基于正则表达式的解析方式，主要包含以下组件：

```typescript
// 核心正则表达式
const startTagOpen = /^<([a-zA-Z_][\w\-\.]*)/     // 开始标签开始
const startTagClose = /^\s*(\/?)>/                // 开始标签结束
const endTag = /^<\/([a-zA-Z_][\w\-\.]*)>/        // 结束标签
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/  // 属性
```

### 3.2 解析流程

#### 3.2.1 主解析函数

```typescript
function parse(template: string, options: CompilerOptions): ASTElement {
  let root = null
  let currentParent = null
  const stack = []

  // 解析HTML
  parseHTML(template, {
    start(tag, attrs, unary, start, end) {
      // 处理开始标签
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
      // 处理结束标签
      if (stack.length > 0) {
        const element = stack.pop()
        currentParent = stack.length > 0 ? stack[stack.length - 1] : null
        closeElement(element)
      }
    },
    chars(text, start, end) {
      // 处理文本内容
      if (currentParent && text.trim()) {
        const child = createASTText(text)
        currentParent.children.push(child)
      }
    }
  })

  return root
}
```

#### 3.2.2 HTML解析器

```typescript
function parseHTML(html: string, options: HTMLParserOptions) {
  const stack = []
  let index = 0
  let currentParent = null
  let root = null

  function advance(n: number) {
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

  // 开始解析
  while (html) {
    let textEnd = html.indexOf('<')
    if (textEnd === 0) {
      // 处理标签
      const endTagMatch = html.match(endTag)
      if (endTagMatch) {
        advance(endTagMatch[0].length)
        parseEndTag(endTagMatch[1])
        continue
      }

      const startTagMatch = parseStartTag()
      if (startTagMatch) {
        handleStartTag(startTagMatch)
        continue
      }
    }

    // 处理文本
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
```

## 4. 实际示例分析

### 4.1 简单元素解析

**模板：**
```html
<div>Hello World</div>
```

**AST结构：**
```json
{
  "type": 1,
  "tag": "div",
  "attrsList": [],
  "attrsMap": {},
  "parent": null,
  "children": [
    {
      "type": 3,
      "text": "Hello World",
      "static": true
    }
  ],
  "plain": true,
  "static": false,
  "staticRoot": false
}
```

### 4.2 带属性的元素解析

**模板：**
```html
<div class="container" id="app">Hello World</div>
```

**AST结构：**
```json
{
  "type": 1,
  "tag": "div",
  "attrsList": [
    {
      "name": "class",
      "value": "container"
    },
    {
      "name": "id",
      "value": "app"
    }
  ],
  "attrsMap": {
    "class": "container",
    "id": "app"
  },
  "parent": null,
  "children": [
    {
      "type": 3,
      "text": "Hello World",
      "static": true
    }
  ],
  "plain": false,
  "static": false,
  "staticRoot": false
}
```

### 4.3 嵌套元素解析

**模板：**
```html
<div>
  <p>Hello</p>
  <span>World</span>
</div>
```

**AST结构：**
```json
{
  "type": 1,
  "tag": "div",
  "attrsList": [],
  "attrsMap": {},
  "parent": null,
  "children": [
    {
      "type": 1,
      "tag": "p",
      "attrsList": [],
      "attrsMap": {},
      "parent": {
        "type": 1,
        "tag": "div"
      },
      "children": [
        {
          "type": 3,
          "text": "Hello",
          "static": true
        }
      ],
      "plain": true,
      "static": false,
      "staticRoot": false
    },
    {
      "type": 1,
      "tag": "span",
      "attrsList": [],
      "attrsMap": {},
      "parent": {
        "type": 1,
        "tag": "div"
      },
      "children": [
        {
          "type": 3,
          "text": "World",
          "static": true
        }
      ],
      "plain": true,
      "static": false,
      "staticRoot": false
    }
  ],
  "plain": true,
  "static": false,
  "staticRoot": false
}
```

### 4.4 Vue指令解析

**模板：**
```html
<div v-if="show" v-for="item in items" :key="item.id">
  {{item.name}}
</div>
```

**AST结构：**
```json
{
  "type": 1,
  "tag": "div",
  "attrsList": [
    {
      "name": "v-if",
      "value": "show"
    },
    {
      "name": "v-for",
      "value": "item in items"
    },
    {
      "name": ":key",
      "value": "item.id"
    }
  ],
  "attrsMap": {
    "v-if": "show",
    "v-for": "item in items",
    ":key": "item.id"
  },
  "parent": null,
  "children": [
    {
      "type": 2,
      "expression": "_s(item.name)",
      "text": "{{item.name}}",
      "tokens": ["{{", "item.name", "}}"],
      "static": false
    }
  ],
  "plain": false,
  "static": false,
  "staticRoot": false,
  "if": "show",
  "for": "item in items",
  "alias": "item",
  "key": "item.id"
}
```

## 5. 关键实现细节

### 5.1 栈结构维护

解析器使用栈结构来维护节点的层级关系：

```typescript
const stack = []
let currentParent = null

// 遇到开始标签时入栈
if (!unary) {
  currentParent = element
  stack.push(element)
}

// 遇到结束标签时出栈
if (stack.length > 0) {
  const element = stack.pop()
  currentParent = stack.length > 0 ? stack[stack.length - 1] : null
}
```

### 5.2 属性解析

属性解析支持多种格式：

```typescript
// 支持的属性格式
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/

// 示例
class="container"     // 双引号
id='app'             // 单引号
disabled             // 无值属性
:key="item.id"       // 动态属性
@click="handleClick" // 事件属性
```

### 5.3 文本处理

文本处理需要考虑空白字符和插值表达式：

```typescript
function processText(text: string) {
  if (text.trim()) {
    // 检查是否为插值表达式
    if (text.includes('{{') && text.includes('}}')) {
      return createASTExpression(text)
    } else {
      return createASTText(text)
    }
  }
  return null
}
```

## 6. 优化策略

### 6.1 静态节点标记

解析完成后，优化器会标记静态节点：

```typescript
function markStatic(node: ASTNode) {
  node.static = isStatic(node)
  if (node.type === 1) {
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i]
      markStatic(child)
      if (!child.static) {
        node.static = false
      }
    }
  }
}
```

### 6.2 静态根节点标记

标记静态根节点，用于优化渲染：

```typescript
function markStaticRoots(node: ASTNode, isInFor: boolean) {
  if (node.type === 1) {
    if (node.static || node.once) {
      node.staticInFor = isInFor
    }
    if (node.static && node.children.length && !(
      node.children.length === 1 &&
      node.children[0].type === 3
    )) {
      node.staticRoot = true
      return
    } else {
      node.staticRoot = false
    }
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for)
      }
    }
  }
}
```

## 7. 总结

DOM转AST语法树是Vue2编译器系统的核心环节，它：

1. **结构化了模板**：将字符串形式的模板转换为树形结构
2. **便于后续处理**：为优化和代码生成提供了数据结构基础
3. **支持复杂语法**：能够解析Vue指令、插值表达式等复杂语法
4. **性能优化**：通过静态节点标记等策略提升渲染性能

这个过程体现了Vue2编译器设计的精妙之处，通过将模板解析为AST，实现了模板到渲染函数的转换，为Vue2的响应式系统提供了强大的编译时优化能力。
