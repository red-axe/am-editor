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
const view = new View(render node, {
    lang:'zh-CN',
});
```

### locale

-   Type: `object`
-   Default value: `zh-CN`
-   Detailed: Configure additional language packs

Language pack, default language pack [https://github.com/yanmao-cc/am-editor/blob/master/locale](https://github.com/yanmao-cc/am-editor/blob/master/locale)

```ts
const view = new View(render node, {
     locale: {
         'zh-CN': {
             test:'Test',
             a: {
                 b: "B"
             }
         },
     }
});
console.log(view.language.get<string>('test'));
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

-   Type: `{ [key: string]: PluginOptions }`
-   Default value: `{}`
-   Detailed: the configuration item of each plug-in, the key is the name of the plug-in, please refer to the description of each plug-in for detailed configuration. [Configuration example](https://github.com/yanmao-cc/am-editor/blob/master/examples/react/components/editor/config.tsx)

Some plugins require the configuration of additional properties:

```ts
// Configure italic markdown syntax
[Italic.pluginName]: {
    // The default is _ underscore, here is modified to a single * sign
    markdown:'*',
},
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

After rendering, `View` loses all editing capabilities and collaboration capabilities, `View` can render a `card` plug-in with interactive effects

`engine.getHtml()` can only get static `html` and cannot restore the interaction effect of `card` component, but it is very friendly to search engines

### scrollNode

-   Type: `Node | (() => Node | null)`
-   Default value: Find the node whose parent style `overflow` or `overflow-y` is `auto` or `scroll`, if not, take `document.documentElement`
-   Detailed: The editor scroll bar node is mainly used to monitor the `scroll` event to set the floating position of the bomb layer and actively set the scroll to the editor target position

### lazyRender

-   Type: `boolena`
-   Default value: `true`
-   Detailed: Lazy rendering of cards (only cards with lazyRender enabled), the default is true
