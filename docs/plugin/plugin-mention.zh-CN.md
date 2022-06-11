# @aomao/plugin-mention

提及插件

## 安装

```bash
$ yarn add @aomao/plugin-mention
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Mention, { MentionComponent } from '@aomao/plugin-mention';

new Engine(...,{ plugins:[Mention], cards: [MentionComponent] })
```

## 可选项

```ts
//使用配置
new Engine(...,{
    config:{
        "mention":{
            //其它可选项
            ...
        }
    }
 })
```

```ts
/**
 * 查询地址，或者监听 mention:search 事件执行查询
 */
action?: string;
/**
 * 数据返回类型，默认 json
 */
type?: '*' | 'json' | 'xml' | 'html' | 'text' | 'js';
/**
 * 额外携带数据上传
 */
data?: Record<string, RequestDataValue> | FormData | (() => Promise<Record<string, RequestDataValue> | FormData>)
/**
 * 请求类型，默认 multipart/form-data;
 */
contentType?: string;
/**
 * 解析上传后的Respone，返回 result:是否成功，data:成功：文件地址，失败：错误信息
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: Array<{ key: string, name: string, avatar?: string}>;
};

```

### 解析服务端响应数据

`result`: true 上传成功，data 数据集合。false 上传失败，data 为错误消息

```ts
/**
 * 解析上传后的Respone，返回 result:是否成功，data:成功：文件地址，失败：错误信息
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: Array<{ key: string, name: string, avatar?: string}>;
};
```

## 插件方法

获取文档中所有的提及

```ts
//返回 Array<{ key: string, name: string}>
engine.command.executeMethod('mention', 'getList');
```

## 插件事件

`mention:default`: 默认下拉查询列表展示数据

```ts
this.engine.on('mention:default', () => {
	return [];
});
```

`mention:search`: 查询时的方法，或者配置 action，二选其一

```ts
this.engine.on('mention:search', (keyword) => {
	return new Promise((resolve) => {
		query({ keyword })
			.then((result) => {
				resolve(result);
			})
			.catch(() => resolve([]));
	});
});
```

`mention:select`: 选中列表中的一项后回调，这里可以返回一个自定义值与 key、name 一起组合成新的值存在 cardValue 里面。并且执行 getList 命令后会一起返回来

```ts
this.engine.on('mention:select', (data) => {
	data['test'] = 'test';
	return data;
});
```

`mention:item-click`: 在“提及”上单击时触发

```ts
this.engine.on(
	'mention:item-click',
	(root: NodeInterface, { key, name }: { key: string; name: string }) => {
		console.log('mention click:', key, '-', name);
	},
);
```

`mention:enter`: 鼠标移入“提及”上时触发

```ts
this.engine.on(
	'mention:enter',
	(layout: NodeInterface, { name }: { key: string; name: string }) => {
		ReactDOM.render(
			<div style={{ padding: 5 }}>
				<p>This is name: {name}</p>
				<p>配置 mention 插件的 mention:enter 事件</p>
				<p>此处使用 ReactDOM.render 自定义渲染</p>
				<p>Use ReactDOM.render to customize rendering here</p>
			</div>,
			layout.get<HTMLElement>()!,
		);
	},
);
```

`mention:render`: 自定义渲染列表

```ts
this.engine.on(
	'mention:render',
	(
		root: NodeInterface,
		data: Array<MentionItem>,
		bindItem: (
			node: NodeInterface,
			data: { [key: string]: string },
		) => NodeInterface,
	) => {
		return new Promise<void>((resolve) => {
			const renderCallback = (items: { [key: string]: Element }) => {
				// 遍历每个项的DOM节点
				Object.keys(items).forEach((key) => {
					const element = items[key];
					const item = data.find((d) => d.key === key);
					if (!item) return;
					// 绑定每个列表项所属的属性、事件，以满足编辑器中上下左右选择的功能需要
					bindItem($(element), item);
				});
				resolve();
			};
			ReactDOM.render(
				<MentionList data={data} callback={renderCallback} />,
				root.get<HTMLElement>()!,
			);
		});
	},
);
```

`mention:render-item`: 自定义渲染列表项

```ts
this.engine.on('mention:render-item', (data, root) => {
	const item = $(`<div>${data}</div>`);
	return item;
});
```

`mention:loading`: 自定渲染加载状态

```ts
this.engine.on('mention:loading', (root) => {
	ReactDOM.render(
		<div className="data-mention-loading">Loading...</div>,
		root.get<HTMLElement>()!,
	);
});
```

`mention:empty`: 自定渲染空状态

```ts
this.engine.on('mention:empty', (root) => {
	root.html('<div>没有查询到数据</div>');
	// or
	ReactDOM.render(
		<div className="data-mention-empty">Empty</div>,
		root.get<HTMLElement>()!,
	);
});
```
