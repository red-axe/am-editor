# @aomao/plugin-mark-range

光标区域标记插件

可用来配合开发类似于批注、划线评论

[批注/评论 DEMO](https://github.com/big-camel/am-editor/blob/master/docs/demo/comment/index.tsx)

## 安装

```bash
$ yarn add @aomao/plugin-mark-range
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import MarkRange from '@aomao/plugin-mark-range';

new Engine(...,{ plugins:[MarkRange] })
```

## 可选项

```ts
//使用配置
new Engine(...,{
    config:{
        "mark-range":{
            //修改快捷键
            hotkey:...,
            //其它可选项
            ...
        }
    }
 })
```

### 标记类型集合

必须为标记插件指定至少一个类型。如果有多种标记可指定多个类型

```ts
keys: Array<string>

//例如评论 keys = ["comment"]
```

### 快捷键

默认无快捷键

```ts
//快捷键，key 组合键，args，执行参数，[mode?: string, value?: string] 语言模式：可选，代码文本：可选
hotkey?:string | {key:string,args:Array<string>};//默认无
```

## 命令

所有命令都需要指定在可选项中 `keys` 中传入的指定 key

```ts
engine.command.execute('mark-range', '标记key');
```

### 预览

对一个标记或当前做在光标位置进行效果预览

如果不传入编辑 id 参数，那么就对当前光标所选进行效果预览

此操作不会参与协同同步

此操作不会产生历史记录，无法做 撤销 和 重做 操作

光标改变时，将自动取消当前预览效果

如果是对光标进行效果预览，命令将返回光标选中区域的所有文本拼接。卡片将使用 [card:卡片名称,卡片编号] 这种格式拼接，需要转换则要自行处理

```ts
engine.command.execute('mark-range', key: string, 'preview', id?:string): string | undefined;
```

### 将预览效果应用到编辑器

将预览效果应用到编辑器，并同步到协同服务器

此操作不会产生历史记录，无法做 撤销 和 重做 操作

必须传入一个标记编号，可以是字符串。编号相对于 key 应是唯一的

```ts
engine.command.execute('mark-range', key: string, 'apply', id:string);
```

### 取消预览效果

如果不传入标记编号，则取消所有的当前正在进行的预览项

```ts
engine.command.execute('mark-range', key: string, 'revoke', id?:string);
```

### 查找节点

根据标记编号找出其在编辑器中所有相对应的 dom 节点对象

```ts
engine.command.execute('mark-range', key: string, 'find', id: string): Array<NodeInterface>;
```

### 移除标记效果

移除指定标记编号的标记效果

此操作不会产生历史记录，无法做 撤销 和 重做 操作

```ts
engine.command.execute('mark-range', key: string, 'remove', id: string)
```

### 过滤标记

对编辑器值中的所有标记过滤，并返回过滤后的值和所有标记的编号和对应路径

value 默认获取当前编辑器根节点中的 html 作为值

在我们需要将标记和编辑器值分开存储或有条件展现标记时很有用

```ts
engine.command.execute('mark-range', key: string, 'filter', value?: string): { value: string, paths: Array<{ id: Array<string>, path: Array<Path>}>}
```

### 还原标记

使用标记路径和过滤后的编辑器值进行标记还原

value 默认获取当前编辑器根节点中的 html 作为值

```ts
engine.command.execute('mark-range', key: string, 'wrap', paths: Array<{ id: Array<string>, path: Array<Path>}>, value?: string): string
```

## 事件

### 标记节点改变回调

在协同编辑时，其它作者添加标记后,或者在编辑、删除一些节点中包含标记节点时都会触发此回调

在使用 撤销、重做 相关操作时，也会触发此回调

addIds: 新增的标记节点编号集合

removeIds: 删除的标记节点编号集合

ids: 所有有效的标记节点编号集合

```ts
engine.on('mark-range:change', (addIds: { [key: string]: Array<string>},removeIds: { [key: string]: Array<string>},ids: { [key:string] : Array<string> }) => {
	...
})
```

### 选中标记节时点回调

在光标改变时触发，selectInfo 有值的情况下将携带光标所在最近，如果是嵌套关系，那么就返回最里层的标记编号

```ts
engine.on('mark-range:select', (range: RangeInterface, selectInfo?: { key: string, id: string}) => {
	...
})
```

## 样式定义

```css
/** 编辑器中标记样式 -comment- 中的 comment 都是代指标记中配置的 key ---- 开始 **/
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
/** 编辑器中标记样式 ---- 结束 **/
```
