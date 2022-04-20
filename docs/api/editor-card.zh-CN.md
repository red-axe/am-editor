# Card

编辑卡片的相关操作

类型：`CardModelInterface`

## 使用

```ts
new Engine(...).card
```

## 构造函数

```ts
new (editor: EditorInterface): CardModelInterface
```

## 属性

### `classes`

所有的卡片类集合

### `components`

已实例化的卡片集合对象

### `active`

当前已激活的卡片

### `length`

已实例化的卡片集合对象长度

## 方法

### `init`

实例化

```ts
/**
 * 实例化卡片
 * @param cards 卡片集合
 */
init(cards: Array<CardEntry>): void;
```

### `add`

增加卡片

```ts
/**
 * 增加卡片
 * @param name 名称
 * @param clazz 类
 */
add(clazz: CardEntry): void;
```

### `each`

遍历所有已创建的卡片

```ts
/**
 * 遍历所有已创建的卡片
 * @param callback 回调函数
 */
each(callback: (card: CardInterface) => boolean | void): void;
```

### `closest`

查询父节点距离最近的卡片节点

```ts
/**
 * 查询父节点距离最近的卡片节点
 * @param selector 查询器
 * @param ignoreEditable 是否忽略可编辑节点
 */
closest(
    selector: Node | NodeInterface,
    ignoreEditable?: boolean,
): NodeInterface | undefined;
```

### `find`

根据选择器查找 Card

```ts
/**
 * 根据选择器查找Card
 * @param selector 卡片ID，或者子节点
 * @param ignoreEditable 是否忽略可编辑节点
 */
find<E extends CardValue = {}, T extends CardInterface<E> = CardInterface<E>>(
    selector: NodeInterface | Node | string,
    ignoreEditable?: boolean,
): T | undefined;
```

### `findBlock`

根据选择器查找 Block 类型 Card

```ts
/**
 * 根据选择器查找Block 类型 Card
 * @param selector 卡片ID，或者子节点
 */
findBlock<E extends CardValue = {}, T extends CardInterface<E> = CardInterface<E>>(
    selector: Node | NodeInterface,
): T | undefined;
```

### `getSingleCard`

获取光标选区中的单个卡片

```ts
/**
 * 获取单个卡片
 * @param range 光标范围
 */
getSingleCard<E extends CardValue = {}, T extends CardInterface<E> = CardInterface<E>>(
	range: RangeInterface,
): T | undefined;
```

### `getSingleSelectedCard`

获取选区选中一个节点时候的卡片

```ts
/**
 * 获取选区选中一个节点时候的卡片
 * @param rang 选区
 */
getSingleSelectedCard<
    E extends CardValue = {},
    T extends CardInterface<E> = CardInterface<E>,
>(
    rang: RangeInterface,
): T | undefined;
```

### `insertNode`

插入卡片节点

```ts
/**
 * 插入卡片
 * @param range 选区
 * @param card 卡片
 */
insertNode<
    E extends CardValue = {},
    T extends CardInterface<E> = CardInterface<E>,
>(
    range: RangeInterface,
    card: T,
    ...args: any
): T;
```

### `removeNode`

移除卡片节点

```ts
/**
 * 移除卡片节点
 * @param card 卡片
 */
removeNode(card: CardInterface): void;
```

### `replaceNode`

将指定节点替换成等待创建的 Card DOM 节点

```ts
/**
 * 将指定节点替换成等待创建的Card DOM 节点
 * @param node 节点
 * @param name 卡片名称
 * @param value 卡片值
 */
replaceNode<V extends CardValue>(
    node: NodeInterface,
    name: string,
    value?: Partial<V>,
): NodeInterface;
```

### `updateNode`

更新卡片重新渲染

```ts
/**
 * 更新卡片重新渲染
 * @param card 卡片
 * @param value 值
 * @param args 更新时渲染时额外的参数
 */
updateNode<
    E extends CardValue = {},
    T extends CardInterface<E> = CardInterface<E>,
>(
    card: T,
    value: Partial<E>,
    ...args: any
): void;
```

### `activate`

激活卡片节点所在的卡片

```ts
/**
 * 激活卡片节点所在的卡片
 * @param node 节点
 * @param trigger 激活方式
 * @param event 事件
 */
activate(
    node: NodeInterface,
    trigger?: CardActiveTrigger,
    event?: MouseEvent,
): void;
```

### `select`

选中卡片

```ts
/**
 * 选中卡片
 * @param card 卡片
 * @param event 触发事件
 */
select(card: CardInterface, event?: MouseEvent | KeyboardEvent): void;
```

### `focus`

聚焦卡片

```ts
/**
 * 聚焦卡片
 * @param card 卡片
 * @param toStart 是否聚焦到开始位置
 */
focus(card: CardInterface, toStart?: boolean): void;
```

### `insert`

插入卡片

```ts
/**
 * 插入卡片
 * @param name 卡片名称
 * @param value 卡片值
 * @param args 插入时渲染时额外的参数
 */
insert<
    E extends CardValue = {},
    T extends CardInterface<E> = CardInterface<E>,
>(
    name: string,
    value?: Partial<E>,
    ...args: any
): T;
```

### `update`

更新卡片

```ts
/**
 * 更新卡片
 * @param selector 卡片选择器
 * @param value 要更新的卡片值
 * @param args 更新时渲染时额外的参数
 */
update<V extends CardValue = CardValue>(
    selector: NodeInterface | Node | string,
    value: Partial<V>,
    ...args: any
): void;
```

### `replace`

把一个卡片所在位置替换成另一个指定的待渲染卡片

```ts
/**
 * 替换卡片
 * @param source 源卡片
 * @param name 新卡片名称
 * @param value 新卡片值
 * @param args 替换时渲染时额外的参数
 */
replace<
    E extends CardValue = {},
    T extends CardInterface<E> = CardInterface<E>,
>(
    source: CardInterface,
    name: string,
    value?: Partial<E>,
    ...args: any
): T;
```

### `remove`

移除卡片

```ts
/**
 * 移除卡片
 * @param selector 卡片选择器
 * @param hasModify 是否触发修改事件
 */
remove(selector: NodeInterface | Node | string, hasModify?: boolean): void;

```

### `removeRemote`

协作者移除卡片

```ts
/**
* 协作者移除卡片
* @param selector 卡片选择器
*/
removeRemote(selector: NodeInterface | Node | string): void;
```

### `create`

创建卡片

```ts
/**
 * 创建卡片
 * @param name 插件名称
 * @param options 选项
 */
create<
    E extends CardValue = {},
    T extends CardInterface<E> = CardInterface<E>,
>(
    name: string,
    options?: {
        value?: Partial<E>;
        root?: NodeInterface;
    },
): T;
```

### `render`

渲染卡片

```ts
/**
 * 渲染
 * @param container 需要重新渲染包含卡片的节点，如果不传，则渲染全部待创建的卡片节点
 * @param callback 渲染完成后回调
 * @param lazyRender 是否懒渲染，默认取决于editor的lazyRender属性
 */
render(
    container?: NodeInterface,
    callback?: (count: number) => void,
    lazyRender?: boolean,
): void;
```

### `renderComponent`

渲染单个卡片

```ts
/**
* 渲染单个卡片
* @param card 卡片实例
* @param args 渲染自定义参数
*/
renderComponent(card: CardInterface, ...args: any): void;
```

### `reRender`

重新渲染卡片

```ts
/**
* 重新渲染卡片
* @param cards 卡片集合
*/
reRender(...cards: Array<CardInterface>): void;
```

### `focusPrevBlock`

聚焦卡片所在位置的前一个块级节点

```ts
/**
 * 聚焦卡片所在位置的前一个块级节点
 * @param card 卡片
 * @param range 光标
 * @param hasModify 没有节点时，是否创建一个空节点并聚焦
 */
focusPrevBlock(card: CardInterface, range: RangeInterface, hasModify: boolean): void;
```

### `focusNextBlock`

聚焦卡片所在位置的下一个块级节点

```ts
/**
 * 聚焦卡片所在位置的下一个块级节点
 * @param card 卡片
 * @param range 光标
 * @param hasModify 没有节点时，是否创建一个空节点并聚焦
 */
focusNextBlock(card: CardInterface, range: RangeInterface, hasModify: boolean): void;
```

### `gc`

释放卡片

```ts
/**
 * 释放卡片
 */
gc(): void;
```

### `destroy`

销毁

```ts
/**
 * 销毁
 */
destroy(): void;
```
