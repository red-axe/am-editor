# 事件

在引擎中我们默认处理了很多事件，例如：文字输入、删除、复制、粘贴、左右方向键、markdown 语法输入监听、插件快捷键等等。这些事件在不同光标位置可能会有不同的处理逻辑，大多数操作都是修改 DOM 树结构、修复光标位置。另外，我们还把这些事件暴露给插件自行处理。

方法签名

```ts
/**
* 绑定事件
* @param eventType 事件类型
* @param listener 事件回调
* @param rewrite 是否重写
*/
on(eventType: string, listener: EventListener, rewrite?: boolean): void;
/**
 * 移除绑定事件
 * @param eventType 事件类型
 * @param listener 事件回调
 */
off(eventType: string, listener: EventListener): void;
/**
 * 触发事件
 * @param eventType 事件名称
 * @param args 触发参数
 */
trigger(eventType: string, ...args: any): any;
```

### 元素事件

在 javascript 中我们通常使用 document.addEventListener document.removeEventListener 绑定 DOM 元素事件。在引擎中，我们抽象了一个 `EventInterface` 类型接口，并且 `NodeInterface` 类型的元素绑定了`EventInterface`类型的属性 event。所以只要是 `NodeInterface` 类型的元素都可以通过 on off trigger，绑定、移除、触发事件。不仅可以绑定 DOM 原生事件，还可以绑定自定义事件

```ts
const node = $('<div></div>');
//原生事件
node.on('click', () => alert('click'));
//自定义事件
node.on('customer', () => alert('customer'));
node.trigger('customer');
```

### 编辑器事件

我们对特定的组合按键进行了处理，以下是我们暴露出来的一些事件，在编辑模式和阅读模式都有效

```ts
//引擎
engine.on('事件名称', '处理方法');
//阅读
view.on('事件名称', '处理方法');
```

### `keydown:all`

全选 ctrl+a 键按下，如果返回 false，终止处理其它监听

```ts
/**
 * @param event 按键事件
 * */
(event: KeyboardEvent) => boolean | void
```

### `card:minimiz`

卡片最小化时触发

```ts
/**
 * @param card 卡片实例
 * */
(card: CardInterface) => void
```

### `card:maximize`

卡片最大化时触发

```ts
/**
 * @param card 卡片实例
 * */
(card: CardInterface) => void
```

### `parse:value-before`

解析 DOM 节点，生成符合标准的编辑器值之前触发

```ts
/**
* @param root DOM根节点
*/
(root: NodeInterface) => void
```

### `parse:value`

解析 DOM 节点，生成符合标准的编辑器值，遍历子节点时触发。返回 false 跳过当前节点

```ts
/**
* @param node 当前遍历的节点
* @param attributes 当前节点已过滤后的属性
* @param styles 当前节点已过滤后的样式
* @param value 当前已经生成的编辑器值集合
*/
(
    node: NodeInterface,
    attributes: { [key: string]: string },
    styles: { [key: string]: string },
    value: Array<string>,
) => boolean | void
```

### `parse:text`

解析 DOM 节点，生成文本，遍历子节点时触发。返回 false 跳过当前节点

```ts
/**
* @param node 当前遍历的节点
* @param attributes 当前节点已过滤后的属性
* @param styles 当前节点已过滤后的样式
* @param value 当前已经生成的文本集合
*/
(
    node: NodeInterface,
    attributes: { [key: string]: string },
    styles: { [key: string]: string },
    value: Array<string>,
) => boolean | void
```

### `parse:value-after`

解析 DOM 节点，生成符合标准的编辑器值。生成 xml 代码结束后触发

```ts
/**
* @param value xml代码
*/
(value: Array<string>) => void
```

### `parse:html-before`

转换为 HTML 代码之前触发

```ts
/**
* @param root 需要转换的根节点
*/
(root: NodeInterface) => void
```

### `parse:html`

转换为 HTML 代码

```ts
/**
* @param root 需要转换的根节点
*/
(root: NodeInterface) => void
```

### `parse:html-after`

转换为 HTML 代码之后触发

```ts
/**
* @param root 需要转换的根节点
*/
(root: NodeInterface) => void
```

### `copy`

复制 DOM 节点时触发

```ts
/**
* @param node 当前遍历的子节点
*/
(root: NodeInterface) => void
```

## 引擎事件

### `change`

编辑器值改变事件

```ts
/**
 * @param value 编辑器值
 * */
(value: string) => void
```

### `select`

编辑器光标选中触发

```ts
() => void
```

### `focus`

编辑器聚焦点时触发

```ts
() => void
```

### `blur`

编辑器失去焦点时触发

```ts
() => void
```

### `beforeCommandExecute`

在编辑器执行命令之前触发

```ts
/**
 * @param name 执行插件命令名称
 * @param args 命令执行参数
 * */
(name: string, ...args: any) => void
```

### `afterCommandExecute`

在编辑器执行命令之后触发

```ts
/**
 * @param name 执行插件命令名称
 * @param args 命令执行参数
 * */
(name: string, ...args: any) => void
```

### `drop:files`

拖动文件到编辑器时触发

```ts
/**
 * @param files 文件集合
 * */
(files: Array<File>) => void
```

### `beforeSetValue`

在给编辑器赋值前触发

```ts
/**
 * @param value 编辑器值
 * */
(value: string) => void
```

### `afterSetValue`

在给编辑器赋值后触发

```ts
/**
 * @param value 编辑器值
 * */
(value: string) => void
```

### `readonly`

编辑器只读属性变更后触发

```ts
/**
 * @param readonly 是否只读
 * */
(readonly: boolean) => void
```

### `paste:event`

当粘贴到编辑器事件发生时触发，如果返回 false，将不在处理粘贴

```ts
/**
 * @param data 粘贴板相关数据
 * @param source 粘贴的富文本
 * */
(data: ClipboardData & { isPasteText: boolean }, source: string) => boolean | void
```

### `paste:schema`

设置本次粘贴所需保留 DOM 元素的结构规则，以及属性所需保留的结构规则

```ts
/**
 * @param schema Schema对象，可以对结构规则增加修改删除等操作
 * */
(schema: SchemaInterface) => void
```

### `paste:origin`

解析粘贴数据，还未生成符合编辑器数据的片段之前触发

```ts
/**
 * @param root 粘贴的DOM节点
 * */
(root: NodeInterface) => void
```

### `paste:each`

解析粘贴数据，生成符合编辑器数据的片段之后循环整理子元素阶段触发

```ts
/**
 * @param node 粘贴片段遍历的元素子节点
 * */
(root: NodeInterface) => void,
```

### `paste:each-after`

解析粘贴数据，生成符合编辑器数据的片段之后循环整理子元素阶段后触发

```ts
/**
 * @param node 粘贴片段遍历的元素子节点
 * */
(root: NodeInterface) => void
```

### `paste:before`

由粘贴数据生成 DOM 片段后，还未写入到编辑器之前触发

```ts
/**
 * @param fragment 粘贴的片段
 * */
(fragment: DocumentFragment) => void
```

### `paste:insert`

插入当前粘贴的片段后触发，此时还未渲染卡片

```ts
/**
 * @param range 当前插入后的光标实例
 * */
(range: RangeInterface) => void
```

### `paste:after`

粘贴动作完成后触发

```ts
() => void
```

### `operations`

DOM 改变触发，这些操作改变通常用于发送到协同服务端交互

```ts
/**
 * @param operations 操作项
 * */
(operations: Operation[]) => void
```

### `keydown:enter`

回车键按下，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:backspace`

删除键按下，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:tab`

Tab 键按下，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:shift-tab`

Shift-Tab 键按下，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:at`

@ 符合键按下，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:space`

空格键按下，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:slash`

反斜杠键按下，唤出 Toolbar，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:left`

左方向键按下，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:right`

右方向键按下，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:up`

上方向键按下，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:down`

下方向键按下，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keyup:enter`

回车键按下弹起，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keyup:backspace`

删除键按下弹起，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keyup:tab`

Tab 键按下弹起，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

### `keyup:space`

空格键按下弹起，如果返回 false，终止处理其它监听

```ts
(event: KeyboardEvent) => boolean | void
```

## 阅读器事件

### `render`

在阅读器渲染完成后触发

```ts
/**
 * @param node 渲染根节点
 * */
(node: NodeInterface) => void
```
