# 工具栏

卡片工具栏

类型：`CardToolbarInterface`

## 构造函数

```ts
new (editor: EditorInterface, card: CardInterface): CardToolbarInterface
```

## 方法

### `create`

创建卡片的 toolbar

```ts
/**
 * 创建卡片的toolbar
 */
create(): void;
```

### `hide`

隐藏 toolbar，包含 dnd

```ts
/**
* 隐藏toolbar，包含dnd
*/
hide(): void;
```

### `show`

展示 toolbar，包含 dnd

```ts
/**
 * 展示toolbar，包含dnd
 * @param event 鼠标事件，用于定位
 */
show(event?: MouseEvent): void;
```

### `hideCardToolbar`

只隐藏卡片的 toolbar，不包含 dnd

```ts
/**
 * 只隐藏卡片的toolbar，不包含dnd
 */
hideCardToolbar(): void;
```

### `showCardToolbar`

只显示卡片的 toolbar，不包含 dnd

```ts
/**
 * 只显示卡片的toolbar，不包含dnd
 * @param event 鼠标事件，用于定位
 */
showCardToolbar(event?: MouseEvent): void;
```

### `getContainer`

获取工具栏容器

```ts
/**
 * 获取工具栏容器
 */
getContainer(): NodeInterface | undefined;
```

### `setOffset`

设置工具栏偏移量[上 x，上 y，下 x，下 y]

```ts
/**
  * 设置工具栏偏移量[上x，上y，下x，下y]
  * @param offset 偏移量 [tx,ty,bx,by]
  */
setOffset(offset: Array<number>): void;
```

### `setDefaultAlign`

设置默认对齐方式

```ts
/**
  * 设置默认对齐方式
  * @param align
  */
setDefaultAlign(align: Placement): void;
```

### `update`

更新位置

```ts
/**
  * 更新位置
  */
update(): void;
```

### `destroy`

销毁

```ts
/**
  * 销毁
  */
destroy(): void;
```
