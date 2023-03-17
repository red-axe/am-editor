# @aomao/plugin-mark-range

Cursor area marking plugin

Can be used to cooperate with development similar to comments, crossed comments

[Annotation/Comment Case](https://github.com/big-camel/am-editor/blob/master/docs/demo/comment/index.tsx)

## Installation

```bash
$ yarn add @aomao/plugin-mark-range
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import MarkRange from'@aomao/plugin-mark-range';

new Engine(...,{ plugins:[MarkRange] })
```

## Optional

```ts
//Use configuration
new Engine(...,{
    config:{
        "mark-range":{
            //Modify shortcut keys
            hotkey:...,
            //Other options
            ...
        }
    }
 })
```

### Mark Type Collection

At least one type must be specified for the tag plugin. If there are multiple tags, multiple types can be specified

```ts
keys: Array<string>

//For example, comments keys = ["comment"]
```

### Hotkey

No shortcut keys by default

```ts
//Shortcut keys, key combination keys, args, execution parameters, [mode?: string, value?: string] Language mode: optional, code text: optional
hotkey?:string | {key:string,args:Array<string>};//default none
```

## Command

All commands need to specify the specified key passed in in the options `keys`

```ts
engine.command.execute('mark-range', 'mark key');
```

### Preview

Preview the effect of a mark or the current cursor position

If you do not pass in the edit id parameter, then preview the effect of the current cursor selection

This operation will not participate in collaborative synchronization

This operation will not generate historical records, and cannot undo and redo operations

When the cursor changes, the current preview effect will be cancelled automatically

If it is to preview the effect of the cursor, the command will return all the text splicing in the area selected by the cursor. The cards will be spliced ​​in the format of [card:card name, card number]. If you need to convert it, you have to deal with it yourself

```ts
engine.command.execute('mark-range', key: string,'preview', id?:string): string | undefined;
```

### Apply the preview effect to the editor

Apply the preview effect to the editor and synchronize to the collaboration server

This operation will not generate historical records, and cannot undo and redo operations

A tag number must be passed in, which can be a string. The number should be unique relative to the key

```ts
engine.command.execute('mark-range', key: string,'apply', id:string);
```

### Cancel the preview effect

If you do not pass in the mark number, cancel all currently ongoing preview items

```ts
engine.command.execute('mark-range', key: string,'revoke', id?:string);
```

### Find Node

Find out all the corresponding dom node objects in the editor according to the tag number

```ts
engine.command.execute('mark-range', key: string,'find', id: string): Array<NodeInterface>;
```

### Remove mark effect

Remove the mark effect of the specified mark number

This operation will not generate historical records, and cannot undo and redo operations

```ts
engine.command.execute('mark-range', key: string,'remove', id: string)
```

### Filter tags

Filter all tags in the editor value, and return the filtered value and the number and corresponding path of all tags

value Gets the html in the root node of the current editor as the value by default

It is useful when we need to store the mark and the editor value separately or conditionally display the mark

```ts
engine.command.execute('mark-range', key: string,'filter', value?: string): {value: string, paths: Array<{ id: Array<string>, path: Array<Path>} >}
```

### Restore mark

Use the tag path and the filtered editor value for tag restoration

value Gets the html in the root node of the current editor as the value by default

```ts
engine.command.execute('mark-range', key: string,'wrap', paths: Array<{ id: Array<string>, path: Array<Path>}>, value?: string): string
```

## Event

### Mark node change callback

In collaborative editing, this callback will be triggered after other authors add tags, or edit or delete some nodes that contain tagged nodes

This callback will also be triggered when using undo and redo related operations

addIds: Newly added mark node number collection

removeIds: a collection of deleted marker node numbers

ids: a collection of all valid marked node numbers

```ts
engine.on('mark-range:change', (addIds: { [key: string]: Array<string>},removeIds: { [key: string]: Array<string>},ids: { [key:string] : Array<string> }) => {
	...
})
```

### Callback when the marked section is selected

Triggered when the cursor changes. If selectInfo has a value, it will carry the nearest cursor position. If it is a nested relationship, then it will return the innermost mark number

```ts
engine.on('mark-range:select', (range: RangeInterface, selectInfo?: { key: string, id: string}) => {
	...
})
```

## Style definition

```css
/** The comment in the mark style -comment- in the editor refers to the key configured in the mark ---- start **/
[data-comment-preview],
[data-comment-id] {
	position: relative;
}

span[data-comment-preview],
span[data-comment-id] {
	display: inline-block;
}

[data-comment-preview]::before,
[data-comment-id]::before {
	content: '';
	position: absolute;
	width: 100%;
	bottom: 0px;
	left: 0;
	height: 2px;
	border-bottom: 2px solid #f8e1a1 !important;
}

[data-comment-preview] {
	background: rgb(250, 241, 209) !important;
}

[data-card-key][data-comment-id]::before,
[data-card-key][data-comment-preview]::before {
	bottom: -2px;
}
/** Mark style in the editor ---- end **/
```
