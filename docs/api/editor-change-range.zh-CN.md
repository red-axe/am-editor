# Change Range

编辑器变更光标的相关操作

类型：`ChangeRangeInterface`

## 方法

### `get`

获取当前选区的范围

```ts
/**
 * 获取当前选区的范围
 */
get(): RangeInterface;
```

### `toTrusty`

获取安全可控的光标对象

```ts
/**
 * 获取安全可控的光标对象
 * @param range 默认当前光标
 */
toTrusty(range?: RangeInterface): RangeInterface;
```

### `select`

选中指定的范围

```ts
/**
 * 选中指定的范围
 * @param range 光标
 */
select(range: RangeInterface): void;
```

### `focus`

聚焦编辑器

```ts
/**
 * 聚焦编辑器
 * @param toStart true:开始位置,false:结束位置，默认为之前操作位置
 */
focus(toStart?: boolean): void;
```

### `blur`

取消焦点

```ts
	/**
 * 取消焦点
 */
blur(): void;
```

### `setLastBlurRange`

设置最后一次失焦的 range 位置

```ts
/**
 * 设置最后一次失焦的range位置
 * @param range
 */
setLastBlurRange(range?: RangeInterface): void;
```
