# FAQ

## Does am-editor support Vue2?

The engine library `@aomao/engine` itself is written in javascript and does not involve the front-end framework. Mainly because some plugins we use front-end frame rendering

The following three plugins are different

-   `@aomao/toolbar-vue` editor toolbar. Buttons, icons, drop-down boxes, color pickers, etc. are all complex UIs

-   `@aomao/plugin-codeblock-vue` The drop-down box for selecting the code language has a search function. It is a better choice to use the existing UI of the front-end library

-   `@aomao/plugin-link-vue` link input, text input, using the existing UI of the front-end library is a better choice

These three plugins all have vue3 dependencies and use the antv UI library. Other plugins do not rely on any front-end framework

[Vue2 Plugins](https://github.com/zb201307/am-editor-vue2/tree/main/packages)

## window is not defined, document is not defined, navigator is not defined

SSR will execute the render method on the server side, and the server side does not have DOM/BOM variables and methods

In the editing mode, there is basically no need for server-side rendering. Mainly lies in the view rendering. If pure html is used, the dynamic interaction of the content of `Card` will be lacking.

1. Use the built-in window object of jsdom. You can use the getWindow object to get this \_\_amWindow object inside the engine or plug-in. But it cannot solve the problem of third-party packages relying on the window object

```ts
const { JSDOM } = require('jsdom');

const { window } = new JSDOM(`<html><body></body></html>`);
global.__amWindow = window;
```

2. Introduce third-party packages dynamically or use `isServer` to determine whether there is a window object. This can solve the problem of no errors when running, but the content cannot be completely rendered on the server side. You can output html on the server to meet the needs of seo. Re-render the view reader after loading into the browser

## Improve paste efficiency/filter paste style

When pasting, there are many styles that are copied externally, such as font, font size, font color, etc. Almost every few words like Word carry these styles. These styles will not only affect the efficiency of pasting, but may also be unnecessary.

```ts
// Listen to paste to get schema events
engine.on('paste:schema', (schema) => {
	const plugins = ['fontsize', 'fontcolor', 'fontfamily'];
	plugins.forEach((pluginName) => {
		const plugin = engine.plugin.components[pluginName];
		if (!plugin || plugin.kind !== 'mark') return;
		const pluginSchema = (plugin as MarkPlugin).schema();
		const schemas: SchemaMark[] = [];
		if (Array.isArray(pluginSchema)) {
			pluginSchema.forEach((schema) => schemas.push(schema));
		} else {
			schemas.push(pluginSchema);
		}
		schemas.forEach((rule) => {
			schema.remove(rule);
		});
	});
});
```
