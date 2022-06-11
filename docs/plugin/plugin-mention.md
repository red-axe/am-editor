# @aomao/plugin-mention

Mention plugin

## Install

```bash
$ yarn add @aomao/plugin-mention
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Mention, {MentionComponent} from'@aomao/plugin-mention';

new Engine(...,{ plugins:[Mention], cards: [MentionComponent] })
```

## Optional

```ts
//Use configuration
new Engine(...,{
    config:{
        "mention":{
            //Other options
            ...
        }
    }
 })
```

```ts
/**
 * look for the address
 */
action?: string;
/**
 * Data return type, default json
 */
type?:'*' |'json' |'xml' |'html' |'text' |'js';
/**
 * Additional data upload
 */
data?: Record<string, RequestDataValue> | FormData | (() => Promise<Record<string, RequestDataValue> | FormData>)
/**
 * Request type, default multipart/form-data;
 */
contentType?: string;
/**
 * Parse the uploaded Respone and return result: whether it is successful or not, data: success: file address, failure: error message
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: Array<{ key: string, name: string, avatar?: string}>;
};

```

### Analyze server response data

`result`: true upload is successful, data data collection. false upload failed, data is an error message

```ts
/**
 * Parse the uploaded Respone and return result: whether it is successful or not, data: success: file address, failure: error message
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: Array<{ key: string, name: string, avatar?: string}>;
};
```

## Plugin method

Get all mentions in the document

```ts
//Return Array<{ key: string, name: string}>
engine.command.executeMethod('mention', 'getList');
```

## Plugin events

`mention:default`: default drop-down query list to display data

```ts
this.engine.on('mention:default', () => {
	return [];
});
```

`mention:search`: Method of query, or configure action, choose one of the two

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

`mention:select`: Call back after selecting an item in the list, here you can return a custom value combined with key and name to form a new value and store it in cardValue. And will return together after executing the getList command

```ts
this.engine.on('mention:select', (data) => {
	data['test'] = 'test';
	return data;
});
```

`mention:item-click`: triggered when clicking on "mention"

```ts
this.engine.on(
	'mention:item-click',
	(root: NodeInterface, { key, name }: { key: string; name: string }) => {
		console.log('mention click:', key, '-', name);
	},
);
```

`mention:enter`: Triggered when the mouse moves over the "mention"

```ts
this.engine.on(
	'mention:enter',
	(layout: NodeInterface, { name }: { key: string; name: string }) => {
		ReactDOM.render(
			<div style={{ padding: 5 }}>
				<p>This is name: {name}</p>
				<p>Configure the mention:enter event of the mention plugin</p>
				<p>Use ReactDOM.render to customize rendering here</p>
				<p>Use ReactDOM.render to customize rendering here</p>
			</div>,
			layout.get<HTMLElement>()!,
		);
	},
);
```

`mention:render`: custom rendering list

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
				// Traverse the DOM node of each item
				Object.keys(items).forEach((key) => {
					const element = items[key];
					const item = data.find((d) => d.key === key);
					if (!item) return;
					// Bind the attributes and events of each list item to meet the functional needs of the up, down, left, and right selection in the editor
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

`mention:render-item`: custom rendering list item

```ts
this.engine.on('mention:render-item', (data, root) => {
	const item = $(`<div>${data}</div>`);
	return item;
});
```

`mention:loading`: custom rendering loading status

```ts
this.engine.on('mention:loading', (root) => {
	ReactDOM.render(
		<div className="data-mention-loading">Loading...</div>,
		root.get<HTMLElement>()!,
	);
});
```

`mention:empty`: custom render empty state

```ts
this.engine.on('mention:empty', (root) => {
	root.html('<div>No data found</div>');
	// or
	ReactDOM.render(
		<div className="data-mention-empty">Empty</div>,
		root.get<HTMLElement>()!,
	);
});
```
