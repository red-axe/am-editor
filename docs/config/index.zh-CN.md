---
toc: menu
---

# 引擎配置

在实例化引擎时传入

```ts
//实例化引擎
const engine = new Engine(渲染节点, {
	...配置项,
});
```

### lang

-   类型: `string`
-   默认值：`zh-CN`
-   详细：语言配置，暂时支持 `zh-CN`、`en-US`。可使用 `locale` 配置

```ts
const engine = new Engine(渲染节点, {
	lang: 'zh-CN',
});
```

### locale

-   类型: `object`
-   默认值：`zh-CN`
-   详细：配置额外语言包

语言包，默认语言包 [https://github.com/big-camel/am-editor/blob/master/locale](https://github.com/big-camel/am-editor/blob/master/locale)

```ts
const engine = new Engine(渲染节点, {
	locale: {
		'zh-CN': {
			test: '测试',
			a: {
				b: 'B',
			},
		},
	},
});
console.log(engine.language.get<string>('test'));
```

### className

-   类型: `string`
-   默认值：`null`
-   详细：添加编辑器渲染节点额外样式

### tabIndex

-   类型: `number`
-   默认值：`null`
-   详细：当前编辑器位于第几个 tab 项

### root

-   类型: `Node`
-   默认值：当前编辑器渲染节点父节点
-   详细：编辑器根节点

### plugins

-   类型: `Array<Plugin>`
-   默认值：`[]`
-   详细：实现 `Plugin` 抽象类的插件集合

### cards

-   类型: `Array<Card>`
-   默认值：`[]`
-   详细：实现 `Card` 抽象类的卡片集合

### config

-   类型: `{ [key: string]: PluginOptions }` 或者 `(editor) => { [key: string]: PluginOptions }`
-   默认值：`{}`
-   详细：每个插件的配置项，key 为插件名称，详细配置请参考每个插件的说明。 [配置 DEMO](https://github.com/big-camel/am-editor/blob/master/examples/react/components/editor/config.tsx)

一些插件需要额外属性的配置:

```ts
// 图片上传
[ImageUploader.pluginName]: {
    file: {
        action: `${DOMAIN}/upload/image`,
        headers: { Authorization: 213434 },
    },
    remote: {
        action: `${DOMAIN}/upload/image`,
    },
    isRemote: (src: string) => src.indexOf(DOMAIN) < 0,
},
// 文件上传
[FileUploader.pluginName]: {
    action: `${DOMAIN}/upload/file`,
},
// 视频上传
[VideoUploader.pluginName]: {
    action: `${DOMAIN}/upload/video`,
},
// 数学公式生成地址，项目在：https://drawing.aomao.com
[Math.pluginName]: {
    action: `https://g.aomao.com/latex`,
    parse: (res: any) => {
        if (res.success) return { result: true, data: res.svg };
        return { result: false };
    },
},
// 提交插件配置
[Mention.pluginName]: {
    action: `${DOMAIN}/user/search`,
    onLoading: (root: NodeInterface) => {
        // Vue 可以使用 createApp 渲染
        return ReactDOM.render(<Loading />, root.get<HTMLElement>()!);
    },
    onEmpty: (root: NodeInterface) => {
        // Vue 可以使用 createApp 渲染
        return ReactDOM.render(<Empty />, root.get<HTMLElement>()!);
    },
    onClick: (
        root: NodeInterface,
        { key, name }: { key: string; name: string },
    ) => {
        console.log('mention click:', key, '-', name);
    },
    onMouseEnter: (
        layout: NodeInterface,
        { name }: { key: string; name: string },
    ) => {
        // Vue 可以使用 createApp 渲染
        ReactDOM.render(
            <div style={{ padding: 5 }}>
                <p>This is name: {name}</p>
                <p>配置 mention 插件的 onMouseEnter 方法</p>
                <p>此处使用 ReactDOM.render 自定义渲染</p>
                <p>Use ReactDOM.render to customize rendering here</p>
            </div>,
            layout.get<HTMLElement>()!,
        );
    },
},
// 字体大小配置
[Fontsize.pluginName]: {
    //配置粘贴后需要过滤的字体大小
    filter: (fontSize: string) => {
        return (
            [
                '12px',
                '13px',
                '14px',
                '15px',
                '16px',
                '19px',
                '22px',
                '24px',
                '29px',
                '32px',
                '40px',
                '48px',
            ].indexOf(fontSize) > -1
        );
    },
},
// 字体配置
[Fontfamily.pluginName]: {
    //配置粘贴后需要过滤的字体
    filter: (fontfamily: string) => {
        const item = fontFamilyDefaultData.find((item) =>
            fontfamily
                .split(',')
                .some(
                    (name) =>
                        item.value
                            .toLowerCase()
                            .indexOf(name.replace(/"/, '').toLowerCase()) >
                        -1,
                ),
        );
        return item ? item.value : false;
    },
},
// 行高配置
[LineHeight.pluginName]: {
    //配置粘贴后需要过滤的行高
    filter: (lineHeight: string) => {
        if (lineHeight === '14px') return '1';
        if (lineHeight === '16px') return '1.15';
        if (lineHeight === '21px') return '1.5';
        if (lineHeight === '28px') return '2';
        if (lineHeight === '35px') return '2.5';
        if (lineHeight === '42px') return '3';
        // 不满足条件就移除掉
        return (
            ['1', '1.15', '1.5', '2', '2.5', '3'].indexOf(lineHeight) > -1
        );
    },
},
```

### placeholder

-   类型: `string`
-   默认值：`无`
-   详细：占位符

### readonly

-   类型: `boolean`
-   默认值：`false`
-   详细：是否只读，设置为只读后不可编辑

与 `View` 渲染不同的是，`readonly` 设置只读状态后依然可以看到协同者的编辑。

`View` 渲染后失去一切编辑能力和协同能力，`View` 能够渲染出具有交互效果的 `card` 插件

`engine.getHtml()` 只能获取到静态的 `html`，无法还原 `card` 组件的交互效果，但是它对搜索引擎很友好

### scrollNode

-   类型: `Node | (() => Node | null)`
-   默认值：查找父级样式 `overflow` 或者 `overflow-y` 为 `auto` 或者 `scroll` 的节点，如果没有就取 `document.documentElement`
-   详细：编辑器滚动条节点，主要用于监听 `scroll` 事件设置弹层浮动位置和主动设置滚动到编辑器目标位置

或者使用 `setScrollNode` 设置

```ts
engine.setScrollNode(滚动条节点);
```

### lazyRender

-   类型: `boolena`
-   默认值：`true`
-   详细：懒惰渲染卡片（仅限已启用 lazyRender 的卡片），默认为 true。协同状态下可编辑卡片不会懒惰渲染

### iconFonts

-   类型: `Record<'url' | 'format', string>[] | string | false`
-   默认值：`url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.woff2?t=1638071536645') format('woff2'), url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.woff?t=1638071536645') format('woff'), url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.ttf?t=1638071536645') format('truetype')`
-   详细：定义 iconfont 文件的 url，默认使用 at.alicdn.com 的字体文件，如果需要使用其他位置的字体文件，可以使用此配置

```ts
const engine = new Engine(渲染节点, {
	iconFonts: [
		{
			url: '//at.alicdn.com/t/font_1456030_lnqmc6a6ca.woff2?t=1638071536645',
			format: 'woff2',
			// ...
		},
	],
	// or
	iconFonts:
		"url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.woff2?t=1638071536645') format('woff2'), url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.woff?t=1638071536645') format('woff'), url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.ttf?t=1638071536645') format('truetype')",
});
```

### autoPrepend

-   类型：`boolean`
-   默认值：`true`
-   详细：在编辑器头部单击空白处是否自动添加空行（<div style="padding-top: 20px;"></div>）在 padding-top 这 20 像素内点击会添加空行

### autoAppend

-   类型：`boolean`
-   默认值：`true`
-   详细：在编辑器尾部单击空白处是否自动添加空行（<div style="padding-bottom: 20px;"></div>）在 padding-bottom 这 20 像素内点击会添加空行

### markdown

类型：

```ts
markdown?: {
	/**
	 * markdown 模式，默认 执行 check 函数返回 true 就直接转换
	 * 1. 使用 confirm 模式，调用 engine.messageConfirm 确认后再次转换
	 * 2. false 为关闭全部 markdown 功能
	 */
	mode?: 'confirm' | false;
	/**
	 * 检测是否为 markdown 语法，如果为 true 则将 makrdown 转换后粘贴，如果默认检测不满足需求可以使用此函数进行自定义检测
	 */
	check?: (text: string, html: string) => Promise<string | false>;
};
```

-   默认值：`undefined`
-   markdown 模式，默认为检测到 markdown 语法就直接转换。使用 `confirm` 模式，需要调用`engine.messageConfirm`确认后再转换。
