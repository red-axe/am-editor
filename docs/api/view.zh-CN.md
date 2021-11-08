# 阅读器

类型：`ViewInterface`

## 方法

### `render`

渲染内容

```ts
/**
 * 渲染内容
 * @param content 渲染的内容
 * @param trigger 是否触发渲染完成事件，用来展示插件的效果。例如在heading插件中，展示锚点显示功能。默认为 true
 */
render(content: string, trigger?: boolean): void;
```

### `trigger`

触发事件，可以主动触发 `render` 事件 `trigger("render","需要渲染的节点")`

```ts
/**
 * 触发事件
 * @param eventType 事件名称
 * @param args 参数
 */
trigger(eventType: string, ...args: any): any;
```
