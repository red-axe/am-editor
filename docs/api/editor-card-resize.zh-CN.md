# 调整大小

可以调整卡片内容区域大小的工具

类型：`ResizeInterface`

## 构造函数

```ts
new (editor: EditorInterface, card: CardInterface): ResizeInterface
```

## 方法

### `create`

创建并绑定事件

```ts
/**
 * 创建并绑定事件
 * @param options 可选项
 */
create(options: ResizeCreateOptions): void;
```

### `render`

渲染工具

```ts
/**
 * 渲染
 * @param container 渲染到的目标节点，默认为当前卡片根节点
 * @param minHeight 最小高度，默认80px
 */
render(container?: NodeInterface, minHeight?: number): void;
```

### `dragStart`

拉动开始

```ts
/**
 * 拉动开始
 * @param event 事件
 */
dragStart(event: MouseEvent): void;
```

### `dragMove`

拉动移动中

```ts
/**
 * 拉动移动中
 * @param event 事件
 */
dragMove(event: MouseEvent): void;
```

### `dragEnd`

拉动结束

```ts
/**
 * 拉动结束
 */
dragEnd(event: MouseEvent): void;
```

### `show`

展示

```ts
/**
 * 展示
 */
show(): void;
```

### `hide`

隐藏

```ts
/**
 * 隐藏
 */
hide(): void;
```

### `destroy`

注销

```ts
/**
 * 注销
 */
destroy(): void;
```
