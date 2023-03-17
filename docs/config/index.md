---
toc: menu
---

# Engine configuration

Passed in when instantiating the engine

```ts
//Instantiate the engine
const engine = new Engine(render node, {
... configuration items,
});
```

### lang

-   Type: `string`
-   Default value: `zh-CN`
-   Detailed: Language configuration, temporarily supports `zh-CN`, `en-US`. Can use `locale` configuration

```ts
const engine = new Engine(render node, {
    lang:'zh-CN',
});
```

### locale

-   Type: `object`
-   Default value: `zh-CN`
-   Detailed: Configure additional language packs

Language pack, default language pack [https://github.com/big-camel/am-editor/blob/master/locale](https://github.com/big-camel/am-editor/blob/master/locale)

```ts
const engine = new Engine(render node, {
     locale: {
         'zh-CN': {
             test:'Test',
             a: {
                 b: "B"
             }
         },
     }
});
console.log(engine.language.get<string>('test'));
```

### className

-   Type: `string`
-   Default value: `null`
-   Detailed: Add additional styles of editor render nodes

### tabIndex

-   Type: `number`
-   Default value: `null`
-   Detailed: Which tab item is the current editor located in

### root

-   Type: `Node`
-   Default value: the parent node of the render node of the current editor
-   Detailed: Editor root node

### plugins

-   Type: `Array<Plugin>`
-   Default value: `[]`
-   Detailed: A collection of plugins that implement the abstract class of `Plugin`

### cards

-   Type: `Array<Card>`
-   Default value: `[]`
-   Detailed: Implement the card collection of the `Card` abstract class

### config

-   Type: `{ [key: string]: PluginOptions }` or `(editor) => { [key: string]: PluginOptions }`
-   Default value: `{}`
-   Detailed: the configuration item of each plugin, the key is the name of the plugin, please refer to the description of each plugin for detailed configuration. [Configuration example](https://github.com/big-camel/am-editor/blob/master/examples/react/components/editor/config.tsx)

Some plugins require the configuration of additional properties:

```ts
// upload picture
[ImageUploader.pluginName]: {
    file: {
        action: `${DOMAIN}/upload/image`,
        headers: {Authorization: 213434 },
    },
    remote: {
        action: `${DOMAIN}/upload/image`,
    },
    isRemote: (src: string) => src.indexOf(DOMAIN) <0,
},
// File Upload
[FileUploader.pluginName]: {
    action: `${DOMAIN}/upload/file`,
},
// video upload
[VideoUploader.pluginName]: {
    action: `${DOMAIN}/upload/video`,
},
// Mathematical formula generation address, the project is at: https://drawing.aomao.com
[Math.pluginName]: {
    action: `https://g.aomao.com/latex`,
    parse: (res: any) => {
        if (res.success) return {result: true, data: res.svg };
        return {result: false };
    },
},
// Submit plugin configuration
[Mention.pluginName]: {
    action: `${DOMAIN}/user/search`,
    onLoading: (root: NodeInterface) => {
        // Vue can be rendered using createApp
        return ReactDOM.render(<Loading />, root.get<HTMLElement>()!);
    },
    onEmpty: (root: NodeInterface) => {
        // Vue can be rendered using createApp
        return ReactDOM.render(<Empty />, root.get<HTMLElement>()!);
    },
    onClick: (
        root: NodeInterface,
        {key, name }: {key: string; name: string },
    ) => {
        console.log('mention click:', key,'-', name);
    },
    onMouseEnter: (
        layout: NodeInterface,
        {name }: {key: string; name: string },
    ) => {
        // Vue can be rendered using createApp
        ReactDOM.render(
            <div style={{ padding: 5 }}>
                <p>This is name: {name}</p>
                <p>Configure the onMouseEnter method of the mention plugin</p>
                <p>Use ReactDOM.render to customize rendering here</p>
                <p>Use ReactDOM.render to customize rendering here</p>
            </div>,
            layout.get<HTMLElement>()!,
        );
    },
},
// Font size configuration
[Fontsize.pluginName]: {
    //Configure the font size to be filtered after pasting
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
            ].indexOf(fontSize)> -1
        );
    },
},
// Font configuration
[Fontfamily.pluginName]: {
    //Configure the font to be filtered after pasting
    filter: (fontfamily: string) => {
        const item = fontFamilyDefaultData.find((item) =>
            fontfamily
                .split(',')
                .some(
                    (name) =>
                        item.value
                            .toLowerCase()
                            .indexOf(name.replace(/"/,'').toLowerCase())>
                        -1,
                ),
        );
        return item? item.value: false;
    },
},
// Row height configuration
[LineHeight.pluginName]: {
    //Configure the row height to be filtered after pasting
    filter: (lineHeight: string) => {
        if (lineHeight === '14px') return '1';
        if (lineHeight === '16px') return '1.15';
        if (lineHeight === '21px') return '1.5';
        if (lineHeight === '28px') return '2';
        if (lineHeight === '35px') return '2.5';
        if (lineHeight === '42px') return '3';
        // Remove if the conditions are not met
        return (
            ['1', '1.15', '1.5', '2', '2.5', '3'].indexOf(lineHeight)> -1
        );
    },
},
```

### placeholder

-   Type: `string`
-   Default value: `None`
-   Detailed: placeholder

### readonly

-   Type: `boolean`
-   Default value: `false`
-   Detailed: Whether it is read-only or not, and cannot be edited after setting to read-only

The difference with `View` rendering is that you can still see the editor's edits after `readonly` is set to read-only status.

After rendering, `View` loses all editing capabilities and collaboration capabilities, `View` can render a `card` plugin with interactive effects

`engine.getHtml()` can only get static `html` and cannot restore the interaction effect of `card` component, but it is very friendly to search engines

### scrollNode

-   Type: `Node | (() => Node | null)`
-   Default value: Find the node whose parent style `overflow` or `overflow-y` is `auto` or `scroll`, if not, take `document.documentElement`
-   Detailed: The editor scroll bar node is mainly used to monitor the `scroll` event to set the floating position of the bomb layer and actively set the scroll to the editor target position

### lazyRender

-   Type: `boolena`
-   Default value: `true`
-   Detailed: Lazy rendering of cards (only cards with lazyRender enabled), the default is true

### iconFonts

-   Type: `Record<'url' | 'format', string>[] | string | false`
-   Default: `url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.woff2?t=1638071536645') format('woff2'), url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.woff ?t=1638071536645') format('woff'), url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.ttf?t=1638071536645') format('truetype')`
-   Detailed: define the url of the iconfont file, the font file of at.alicdn.com is used by default, if you need to use the font file of other location, you can use this configuration

```ts
const engine = new Engine(container, {
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

-   type: `boolean`
-   Default: `true`
-   Details: Click on the blank space in the editor head to automatically add an empty line (<div style="padding-top: 20px;"></div>) Clicking within 20 pixels of the padding-top will add an empty line

### autoAppend

-   type: `boolean`
-   Default: `true`
-   Details: Whether to automatically add a blank line when clicking on the blank space at the end of the editor (<div style="padding-bottom: 20px;"></div>) Clicking within 20 pixels of padding-bottom will add a blank line

### markdown

type:

```ts
markdown?: {
	/**
	* In markdown mode, by default, if the check function returns true, it will be converted directly
	* 1. Use confirm mode, call engine.messageConfirm to confirm and convert again
	* 2. false to turn off all markdown functions
	*/
	mode?: 'confirm' | false;
	/**
	* Detect whether it is markdown syntax, if true, convert the makrdown and paste it, if the default detection does not meet the requirements, you can use this function for custom detection
	*/
	check?: (text: string, html: string) => Promise<string | false>;
};
```

-   Default: `undefined`
-   markdown mode, the default is to directly convert when markdown syntax is detected. When using `confirm` mode, you need to call `engine.messageConfirm` to confirm and then convert.
