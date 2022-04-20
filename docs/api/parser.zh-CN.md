# 解析器

类型：`ParserInterface`

## 构造函数

```ts
/**
 * @param source 值或者节点最终为解析为DOM树
 * @param editor 编辑器实例
 * @param paserBefore 解析前回调
 * */
new (source: string | Node | NodeInterface, editor: EditorInterface, paserBefore?: (node: NodeInterface) => void): ParserInterface
```

## 方法

### `normalize`

标准化节点

```ts
/**
* 标准化节点
* @param root 根节点
* @param schema Schema
* @param conversion 转换规则
*/
normalize(
    root: NodeInterface,
    schema: SchemaInterface,
    conversion: ConversionInterface | null,
): void;
```

### `traverse`

遍历节点

```ts
/**
 * 遍历节点
 * @param node 根节点
 * @param conversionRules 标签名称转换器
 * @param callbacks 回调
 * @param isCardNode 是否是卡片
 * @param includeCard 是否包含卡片
 */
traverse(
    node: NodeInterface,
    conversionRules: any,
    callbacks: Callbacks,
    isCardNode?: boolean,
    includeCard?: boolean,
): void
```

### `toValue`

遍历 DOM 树，生成符合标准的编辑器值

```ts
/**
 * 遍历 DOM 树，生成符合标准的编辑器值
 * @param schemaRules 标签保留规则
 * @param conversionRules 标签转换规则
 * @param replaceSpaces 是否替换空格
 * @param customTags 是否将光标、卡片节点转换为标准代码
 */
toValue(
    schema?: SchemaInterface | null,
    conversionRules?: ConversionInterface,
    replaceSpaces?: boolean,
    customTags?: boolean,
): string
```

### `toHTML`

转换为 HTML 代码

```ts
/**
 * 转换为HTML代码
 * @param inner 内包裹节点
 * @param outter 外包裹节点
 */
toHTML(inner?: Node, outter?: Node): { html: string, text: string}
```

### `toDOM`

返回 DOM 树

```ts
/**
 * 返回DOM树
 */
toDOM(schema?: SchemaInterface | null, conversionRules?: ConversionInterface): DocumentFragment
```

### `toText`

转换为文本

```ts
/**
 * 转换为文本
 * @param schema Schema 规则
 * @param includeCard 是否遍历卡片内部，默认不遍历
 * @param formatOL 是否格式化有序列表，<ol><li>a</li><li>b</li></ol>  ->  1. a  2. b 默认转换
 */
toText(
    schema?: SchemaInterface,
    includeCard?: boolean,
    formatOL?: boolean,
): string;
```
