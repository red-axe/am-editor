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

SSR will execute the render method on the server side, and the server side does not have DOM/BOM variables and methods. Does not support server-side rendering

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

## Import and Export

Use the two methods `getHtml` and `setHtml` provided by the engine instance, and use `html` as the intermediary for conversion

You can use third-party libraries or back-end APIs to read other documents and convert them to the standard format of `html` and then transfer them back to the front-end, call `setHtml` to set them in the editor

Convert to other document formats in the same way, use `getHtml` to obtain `html` and then convert

Some cards may require additional attributes to restore the `html` correctly. You can check the conversion conditions in the `pasteHtml` method in the specific card plugin

## Export Markdown

Use the `getHtml` method provided by the `engine` instance to get the html, and then use the [turndown](https://github.com/mixmark-io/turndown) library to convert

## Disable/Customize Markdown

All `markdown` syntax uses [markdown-it](https://github.com/markdown-it/markdown-it) to handle transformations.

You can customize markdown transitions by listening to the events of markdown-it and markdown-it-token

```ts
engine.on('markdown-it', markdown => {
 // enable plugin using markdown-it api
 markdown.enable('markdown-it plugin name')
 // disable plugin using markdown-it api
 markdown.disable('markdown-it plugin name')
 // or add a plugin
 markdown.use (markdown-it plugin)
})
// By default, the plugin set by markdown-ti will be used for conversion. If there are additional requirements, you can listen to this event interception and call the callback to return the string by yourself. If there is a need for more replication, it is recommended to use the api of markdown-it to make plugins.
engine.on('markdown-it-token', ({ token, markdown, callback }) => {
 // token is the currently processed token
 // markdown is the current markdown-it instance
 // callback is the currently processed callback
 if(token.type === 'paragraph_open') {
  callback('<p>')
  // must return false
  return false
 }
 return true
})
```

## Icon missing

icon icon is a font icon introduced directly through [iconfont](https://at.alicdn.com/t/project/1456030/0cbd04d3-3ca1-4898-b345-e0a9150fcc80.html?spm=a313x.7781069.1998910419.35).

```css
@font-face {
	font-family: 'data-icon'; /* Project id 1456030 */
	src: url('//at.alicdn.com/t/font_1456030_mvh913k905.woff2?t=1629619375484')
			format('woff2'), url('//at.alicdn.com/t/font_1456030_mvh913k905.woff?t=1629619375484')
			format('woff'),
		url('//at.alicdn.com/t/font_1456030_mvh913k905.ttf?t=1629619375484')
			format('truetype');
}
```

If there is no access, we can download these three files, and then redefine @font-face in css and introduce a new font file

## How to customize the card toolbar

In the plugin configuration item of the card component, configure the `cardToolbars` option

```ts
new Engine(container, {
	config: {
		codeblock: {
			cardToolbars: (items, editor) => {
				console.log(items);
				return items.filter((item) => item.key === 'copy');
			},
		},
	},
});
```
