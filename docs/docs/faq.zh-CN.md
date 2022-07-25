# FAQ

## am-editor 支持 Vue2 吗？

引擎库 `@aomao/engine` 本身是 javascript 编写的，不涉及到前端框架。主要在于一些插件我们使用了前端框架渲染

下面这三个插件有区别

-   `@aomao/toolbar-vue` 编辑器工具栏。按钮、图标、下拉框、颜色选择器等都是复杂的 UI

-   `@aomao/plugin-codeblock-vue` 选择代码语言的下拉框具有搜索功能，使用前端库现有的 UI 是比较好的选择

-   `@aomao/plugin-link-vue` 链接输入、文本输入，使用前端库现有的 UI 是比较好的选择

这三个插件都有 vue3 的依赖，并且使用的是 antd UI 库。其它插件没有依赖任何前端框架

[Vue2 插件](https://github.com/zb201307/am-editor-vue2/tree/main/packages)

## window is not defined, document is not defined, navigator is not defined

SSR 因为会在服务端执行 render 渲染方法，而服务端没有 DOM/BOM 变量和方法。不支持服务端渲染

## 提高粘贴效率/过滤粘贴样式

在粘贴的时候外部复制过来由很多样式，比如字体、字体大小、字体颜色等，类似 word 几乎每几个字都有携带这些样式，这些样式不仅会影响粘贴的效率，也有可能是不需要的。

```ts
// 监听粘贴获取schema事件
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

## 导入/导出

使用 `engine` 实例提供的 `getHtml` 和 `setHtml` 两个方法，以 `html` 为中介进行转换

可以使用第三方库或者后端 api 读取其它文档并转换为`html`标准格式后传回前端，调用 `setHtml` 设置到编辑器中

转化为其它文档格式同理，使用 `getHtml` 获取到 `html` 后进行转换

有些卡片可能需要额外的属性才能使 `html` 正确的还原，可以查看具体卡片插件中的 `pasteHtml` 方法中有哪些转换条件

## 导出 Markdown

使用 `engine` 实例提供的 `getHtml` 方法获取到 html，然后使用 [turndown](https://github.com/mixmark-io/turndown) 这个库进行转换

## 禁用/自定义 Markdown

所有的`markdown`语法均使用 [markdown-it](https://github.com/markdown-it/markdown-it) 处理转换。

可以通过监听 markdown-it 和 markdown-it-token 的事件，来自定义 markdown 转换

```ts
engine.on('markdown-it', (markdown) => {
	// 使用 markdown-it api 启用插件
	markdown.enable('markdown-it 插件名称');
	// 使用 markdown-it api 禁用插件
	markdown.disable('markdown-it 插件名称');
	// 或者 新增插件
	markdown.use(markdown - it插件);
});
// 默认会使用markdown-ti设置好的插件进行转换，如果有额外需求可以监听这个事件拦截，并自行调用 callback 返回字符串。如果有更复制的需求，建议使用 markdown-it 的api制作插件。
engine.on('markdown-it-token', ({ token, markdown, callback }) => {
	// token 为当前处理的 token
	// markdown 为当前markdown-it实例
	// callback 为当前处理的回调
	if (token.type === 'paragraph_open') {
		callback('<p>');
		// 必须返回 flase
		return false;
	}
	return true;
});
```

## icon 丢失

icon 图标是直接通过 [iconfont](https://at.alicdn.com/t/project/1456030/0cbd04d3-3ca1-4898-b345-e0a9150fcc80.html?spm=a313x.7781069.1998910419.35) 引入的字体图标。

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

如果出现不能访问的情况，我们可以把这三个文件下载下来，然后在 css 中重新定义 @font-face 并引入新的字体文件

## 如何定制卡片工具栏

在卡片组件的插件配置项中，配置 `cardToolbars` 选项

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
