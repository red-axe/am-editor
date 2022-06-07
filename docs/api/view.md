# View

Type: `ViewInterface`

## Method

### `render`

Render content

```ts
/**
  * Render content
  * @param content rendered content
  * @param trigger Whether to trigger the rendering completion event, used to show the special effects of the plugin. For example, in the heading plugin, the anchor point display function is displayed. The default is true
  */
render(content: string, trigger?: boolean): void;
```

### `trigger`

Trigger events, you can actively trigger `render` events `trigger("render","nodes to be rendered")`

```ts
/**
  * trigger event
  * @param eventType event name
  * @param args parameters
  */
trigger(eventType: string, ...args: any): any;
```
