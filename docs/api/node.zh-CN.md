# NodeInterface

在 DOM 的 `Node` 节点上进行扩展

类型：`NodeInterface`

## 创建 `NodeInterface` 对象

使用引擎内提供的 `$` 节点选择器来实例化 `NodeInterface` 对象

```ts
import { $ } from '@aomao/engine';
//使用CSS选择器查找节点
const content = $('.content');
//创建节点
const div = $('<div></div>');
document.body.append(div[0]);
//转换
const p = $(document.querySelector('p'));
const target = $(event.target);
```

## 属性

### `length`

Node 节点集合长度

类型：`number`

### `events`

当前对象中所有 Node 节点的事件对象集合

类型：`EventInterface[]`

### `document`

当前 Node 节点所在的 Document 对象。在使用 iframe 中，不同框架中的 document 并是不一致的，还有一些其它环境中也是如此，所以我们需要跟随这个对象。

类型：`Document | null`

### `window`

当前 Node 节点所在的 Window 对象。在使用 iframe 中，不同框架中的 window 并是不一致的，还有一些其它环境中也是如此，所以我们需要跟随这个对象。

类型：`Window | null`

### `context`

上下文节点

类型：`Context | undefined`

### `name`

节点名称

类型：`string`

### `type`

节点类型，与 `Node.nodeType` 一致 [API](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType)

类型：`number | undefined`

### `display`

节点显示状态

类型：`string | undefined`

### `fragment`

当前对象中的 Node 节点集合是否是框架片段

类型：`DocumentFragment`

### `[n: number]`

Node 节点集合，可以通过下标索引访问

返回类型：Node

## 方法

### `each`

遍历当前对象内的所有 Node 节点

```ts
/**
* 遍历
* @param {Function} callback 回调函数
* @return {NodeInterface} 返回当前实例
*/
each(
    callback: (node: Node, index: number) => boolean | void,
): NodeInterface;
```

### `toArray`

把当前对象内的所有 Node 节点转换为数组

```ts
toArray(): Array<NodeInterface>;
```

### `isElement`

当前节点是否为 Node.ELEMENT_NODE 节点类型

```ts
isElement(): boolean;
```

### `isText`

当前节点是否为 Node.TEXT_NODE 节点类型

```ts
isText(): boolean;
```

### `isCard`

当前节点是否为 Card 组件

```ts
isCard(): boolean;
```

### `isBlockCard`

当前节点是否为 block 类型的 Card 组件

```ts
isBlockCard(): boolean;
```

### `isInlineCard`

当前节点是否为 inline 类型的 Card 组件

```ts
isInlineCard(): boolean;
```

### `isEditableCard`

是否是可编辑的卡片

```ts
isEditableCard(): boolean;
```

### `isRoot`

是否为根节点

```ts
/**
 * 判断当前节点是否为根节点
 * @param {Node} root 根节点
 */
isRoot(root?: Node | NodeInterface): boolean;
```

### `isEditable`

是否为可编辑节点

```ts
isEditable(): boolean;
```

### `inEditor`

是否在根节点内

```ts
/**
 * 判断当前是否在根节点内
 * @param {Node} root 根节点
 */
inEditor(root?: Node | NodeInterface): boolean;
```

### `isCursor`

是否是光标标记节点

```ts
isCursor(): boolean
```

### `get`

获取当前 Node 节点

```ts
get<E extends Node>(): E | null;
```

### `eq`

获取当前第 index 个节点

```ts
/**
 * 获取当前第 index 节点
 * @param {number} index
 * @return {NodeInterface|undefined} NodeInterface 类，或 undefined
 */
eq(index: number): NodeInterface | undefined;
```

### `index`

获取当前节点所在父节点中的索引，仅计算节点类型为 ELEMENT_NODE 的节点

```ts
/**
 * 获取当前节点所在父节点中的索引，仅计算节点类型为ELEMENT_NODE的节点
 * @return {number} 返回索引
 */
index(): number;
```

### `parent`

获取当前节点父节点

```ts
/**
 * 获取当前节点父节点
 * @return {NodeInterface} 父节点
 */
parent(): NodeInterface | undefined;
```

### `children`

查询当前节点的所有子节点

```ts
/**
 *
 * @param {Node | string} selector 查询器
 * @return {NodeInterface} 符合条件的子节点
 */
children(selector?: string): NodeInterface;
```

### `first`

获取当前节点第一个子节点

```ts
/**
 * 获取当前节点第一个子节点
 * @return {NodeInterface} NodeInterface 子节点
 */
first(): NodeInterface | null;
```

### `last`

获取当前节点最后一个子节点

```ts
/**
 * 获取当前节点最后一个子节点
 * @return {NodeInterface} NodeInterface 子节点
 */
last(): NodeInterface | null;
```

### `prev`

返回节点之前的兄弟节点（包括文本节点、注释节点）

```ts
/**
 * 返回节点之前的兄弟节点（包括文本节点、注释节点）
 * @return {NodeInterface} NodeInterface 节点
 */
prev(): NodeInterface | null;
```

### `next`

返回节点之后的兄弟节点（包括文本节点、注释节点）

```ts
/**
 * 返回节点之后的兄弟节点（包括文本节点、注释节点）
 * @return {NodeInterface} NodeInterface 节点
 */
next(): NodeInterface | null;
```

### `prevElement`

返回节点之前的兄弟节点（不包括文本节点、注释节点）

```ts
/**
 * 返回节点之前的兄弟节点（不包括文本节点、注释节点）
 * @return {NodeInterface} NodeInterface 节点
 */
prevElement(): NodeInterface | null;
```

### `nextElement`

返回节点之后的兄弟节点（不包括文本节点、注释节点）

```ts
/**
 * 返回节点之后的兄弟节点（不包括文本节点、注释节点）
 * @return {NodeInterface} NodeInterface 节点
 */
nextElement(): NodeInterface | null;
```

### `getPath`

返回节点所在根节点路径，默认根节点为 document.body

```ts
/**
 * 返回元素节点所在根节点路径，默认根节点为 document.body
 * @param context 根节点，默认为 document.body
 * @param filter 获取index的时候过滤
 * @param callback 获取index的时候回调
 * @return 路径
 */
getPath(
    context?: Node | NodeInterface,
    filter?: (node: Node) => boolean,
    callback?: (
        index: number,
        path: number[],
        node: NodeInterface,
    ) => number[] | undefined,
): Array<number>;
```

### `contains`

判断节点是否包含要查询的节点

```ts
/**
 * 判断节点是否包含要查询的节点
 * @param {NodeInterface | Node} node 要查询的节点
 * @return {Boolean} 是否包含
 */
contains(node: NodeInterface | Node): boolean;
```

### `find`

根据查询器查询当前节点

```ts
/**
 * 根据查询器查询当前节点
 * @param {String} selector 查询器
 * @return {NodeInterface} 返回一个 NodeInterface 实例
 */
find(selector: string): NodeInterface;
```

### closest

根据查询器查询符合条件的离当前节点最近的父节点

```ts
/**
 * 根据查询器查询符合条件的离当前节点最近的父节点
 * @param {string} selector 查询器
 * @return {NodeInterface} 返回一个 NodeInterface 实例
 */
closest(
    selector: string,
    callback?: (node: Node) => Node | undefined,
): NodeInterface;
```

### `on`

为当前节点绑定事件

```ts
/**
 * 为当前元素节点绑定事件
 * @param {String} eventType 事件类型
 * @param {Function} listener 事件函数
 * @return {NodeInterface} 返回当前实例
 */
on<R = any, F extends EventListener<R> = EventListener<R>>(
    eventType: string,
    listener: F,
    options?: boolean | AddEventListenerOptions,
): NodeInterface;
```

### `off`

移除当前节点事件

```ts
/**
 * 移除当前元素节点事件
 * @param {String} eventType 事件类型
 * @param {Function} listener 事件函数
 * @return {NodeInterface} 返回当前实例
 */
off(
    eventType: string,
    listener: EventListener,
    options?: boolean | EventListenerOptions,
): NodeInterface;
```

### `getBoundingClientRect`

获取当前节点相对于视口的位置

```ts
/**
 * 获取当前节点相对于视口的位置
 * @param {Object} defaultValue 默认值
 * @return {Object}
 * {
 *  top,
 *  bottom,
 *  left,
 *  right
 * }
 */
getBoundingClientRect(defaultValue?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
}):
    | { top: number; bottom: number; left: number; right: number }
    | undefined;
```

### `removeAllEvents`

移除当前节点所有已绑定的事件

```ts
/**
 * 移除当前节点所有已绑定的事件
 * @return {NodeInterface} 当前 NodeInterface 实例
 */
removeAllEvents(): NodeInterface;
```

### `attributes`

获取或设置节点属性

```ts
/**
 * 获取或设置节点属性
 * @param {string|undefined} key 属性名称，key为空获取所有属性，返回Map
 * @param {string|undefined} val 属性值，val为空获取当前key的属性，返回string|null
 * @return {NodeInterface|{[k:string]:string}} 返回值或当前实例
 */
attributes(): { [k: string]: string };
attributes(key: { [k: string]: string }): string;
attributes(key: string, val: string | number): NodeInterface;
attributes(key: string): string;
attributes(
    key?: string | { [k: string]: string },
    val?: string | number,
): NodeInterface | { [k: string]: string } | string;
```

### `removeAttributes`

移除节点属性

```ts
/**
 * 移除节点属性
 * @param {String} key 属性名称
 * @return {NodeInterface} 返当前实例
 */
removeAttributes(key: string): NodeInterface;
```

### `hasClass`

判断节点是否包含某个 class

```ts
/**
 * 判断节点是否包含某个 class
 * @param {String} className 样式名称
 * @return {Boolean} 是否包含
 */
hasClass(className: string): boolean;
```

### `addClass`

为节点增加一个 class

```ts
/**
 *
 * @param {string} className
 * @return {NodeInterface} 返当前实例
 */
addClass(className: string): NodeInterface;
```

### `removeClass`

移除节点 class

```ts
/**
 * 移除节点 class
 * @param {String} className
 * @return {NodeInterface} 返当前实例
 */
removeClass(className: string): NodeInterface;
```

### `css`

获取或设置节点样式

```ts
/**
 * 获取或设置节点样式
 * @param {String|undefined} key 样式名称
 * @param {String|undefined} val 样式值
 * @return {NodeInterface|{[k:string]:string}} 返回值或当前实例
 */
css(): { [k: string]: string };
css(key: { [k: string]: string | number }): NodeInterface;
css(key: string): string;
css(key: string, val: string | number): NodeInterface;
css(
    key?: string | { [k: string]: string | number },
    val?: string | number,
): NodeInterface | { [k: string]: string } | string;
```

### `width`

获取节点宽度

```ts
/**
 * 获取节点宽度
 * @return {number} 宽度
 */
width(): number;
```

### `height`

获取节点高度

```ts
/**
 * 获取节点高度
 * @return {Number} 高度
 */
height(): number;
```

### `html`

获取或设置节点 html 文本

```ts
/**
 * 获取或设置节点html文本
 */
html(): string;
html(html: string): NodeInterface;
html(html?: string): NodeInterface | string;
```

### `text`

```ts
/**
 * 获取或设置节点文本
 */
text(): string;
text(text: string): NodeInterface;
text(text?: string): string | NodeInterface;
```

### `show`

设置节点为显示状态

```ts
/**
 * 设置节点为显示状态
 * @param {String} display display值
 * @return {NodeInterface} 当前实例
 */
show(display?: string): NodeInterface;
```

### `hide`

设置节点为隐藏状态

```ts
/**
 * 设置节点为隐藏状态
 * @return {NodeInterface} 当前实例
 */
hide(): NodeInterface;
```

### `remove`

移除当前实例所有节点

```ts
/**
 * 移除当前实例所有节点
 * @return {NodeInterface} 当前实例
 */
remove(): NodeInterface;
```

### `empty`

清空节点下的所有子节点，包括文本

```ts
/**
 * 清空节点下的所有子节点
 * @return {NodeInterface} 当前实例
 */
empty(): NodeInterface;
```

### `equal`

比较两个节点是否相同，包括引用地址

```ts
/**
* 比较两个节点是否相同
* @param {NodeInterface|Node} node 比较的节点
* @return {Boolean} 是否相同
*/
equal(node: NodeInterface | Node): boolean;
```

### `clone`

复制节点

```ts
/**
 * 复制节点
 * @param deep 是否深度复制
 */
clone(deep?: boolean): NodeInterface;
```

### `prepend`

在节点的开头插入指定内容

```ts
/**
 * 在节点的开头插入指定内容
 * @param {Selector} selector 选择器或节点
 * @return {NodeInterface} 当前实例
 */
prepend(selector: Selector): NodeInterface;
```

### `append`

在节点的结尾插入指定内容

```ts
/**
 * 在节点的结尾插入指定内容
 * @param {Selector} selector 选择器或节点
 * @return {NodeInterface} 当前实例
 */
append(selector: Selector): NodeInterface;
```

### `before`

在节点前插入新的节点

```ts
/**
 * 在节点前插入新的节点
 * @param {Selector} selector 选择器或节点
 * @return {NodeInterface} 当前实例
 */
before(selector: Selector): NodeInterface;
```

### `after`

在节点后插入内容

```ts
/**
 * 在节点后插入内容
 * @param {Selector} selector 选择器或节点
 * @return {NodeInterface} 当前实例
 */
after(selector: Selector): NodeInterface;
```

### `replaceWith`

将节点替换为新的内容

```ts
/**
 * 将节点替换为新的内容
 * @param {Selector} selector 选择器或节点
 * @return {NodeInterface} 当前实例
 */
replaceWith(selector: Selector): NodeInterface;
```

### `getRoot`

获取节点所在编辑区域的根节点

```ts
/**
 * 获取节点所在编辑区域的根节点
 */
getRoot(): NodeInterface;
```

### `traverse`

遍历所有子节点

```ts
/**
 * 遍历所有子节点
 * @param callback 回调函数，false：停止遍历 ，true：停止遍历当前节点及子节点，继续遍历下一个兄弟节点
 * @param order true:顺序 ，false:倒序，默认 true
 * @param includeEditableCard 是否包含可编辑器卡片
 * @param onStart 开始遍历一个节点时的回调函数
 * @param onEnd 遍历完(包括所有子节点)一个节点时的回调函数
 */
traverse(
    callback: (
        node: NodeInterface,
    ) => boolean | void | null | NodeInterface,
    order?: boolean,
    includeCard?: boolean | 'editable',
    onStart?: (node: NodeInterface) => void,
    onEnd?: (node: NodeInterface, next: NodeInterface | null) => void,
): void;
```

### `getChildByPath`

根据路径获取子节点

```ts
/**
 * 根据路径获取子节点
 * @param path 路径
 */
getChildByPath(path: Path, filter?: (node: Node) => boolean): Node;
```

### `getIndex`

获取当前节点所在父节点中的索引

```ts
/**
 * 获取当前节点所在父节点中的索引
 */
getIndex(filter?: (node: Node) => boolean): number;
```

### `findParent`

在指定容器里获取父节点

```ts
/**
 * 在指定容器里获取父节点
 * @param container 容器节点，默认为编辑器根节点
 */
findParent(container?: Node | NodeInterface): NodeInterface | null;
```

### `allChildren`

获取节点下的所有子节点

```ts
/**
 * 获取节点下的所有子节点
 * @param includeCard 是否包含卡片的节点
 */
allChildren(includeCard?: boolean | 'editable'): Array<NodeInterface>;
```

### `getViewport`

返回当前节点或者传入的节点所在当前节点的顶级 window 对象的视图边界

```ts
/**
 * 返回当前节点所在当前节点的顶级window对象的视图边界
 */
getViewport(): { top: number; left: number; bottom: number; right: number };
```

### `inViewport`

判断 view 是否在 node 节点根据当前节点的顶级 window 对象计算的视图边界内

```ts
/**
 * 判断view是否在node节点根据当前节点的顶级window对象计算的视图边界内
 * @param view 是否在视图的节点
 * @param simpleMode 简单模式，任一边界超出编辑器范围时，返回 true
 */
inViewport(view: NodeInterface, simpleMode?: boolean): boolean;
```

### `scrollIntoView`

如果 view 节点不可见，将滚动到 align 位置，默认为 nearest

```ts
/**
 * 如果view节点不可见，将滚动到align位置，默认为nearest
 * @param view 视图节点
 * @param align 位置
 */
scrollIntoView(
    view: NodeInterface,
    align?: 'start' | 'center' | 'end' | 'nearest',
): void;
```
