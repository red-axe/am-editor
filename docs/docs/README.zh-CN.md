---
title: 介绍
---

## 是什么？

一个支持协同编辑的富文本编辑器，可以自由的使用 React、Vue 等前端常用库扩展定义插件。

`广告`：[科学上网，方便、快捷的上网冲浪](https://xiyou4you.us/r/?s=18517120) 稳定、可靠，访问 Github 或者其它外网资源很方便。

## 基本原理

使用浏览器提供的 `contenteditable` 属性让一个 DOM 节点具有可编辑能力：

```html
<div contenteditable="true"></div>
```

所以它的值看起来像是这样的：

```html
<div data-element="root" contenteditable="true">
	<p>Hello world!</p>
	<p><br /></p>
</div>
```

当然，有些场景下为了方便操作，也提供了转换为 JSON 类型值的 API：

```json
[
	"div", // 节点名称
	// 节点所有的属性
	{
		"data-element": "root",
		"contenteditable": "true"
	},
	// 子节点1
	[
		// 子节点名称
		"p",
		// 子节点属性
		{},
		// 字节点的子节点
		"Hello world!"
	],
	// 子节点2
	["p", {}, ["br", {}]]
]
```

<Alert>
  编辑器依赖 <strong>contenteditable</strong> 属性提供的输入能力以及光标的控制能力。因此，它拥有所有的默认浏览器行为，但是浏览器的默认行为在不同的浏览器厂商实现下存在不同的处理方式，所以我们其大部分默认行为进行了拦截并进行自定义的处理。
</Alert>

比如输入的过程中 `beforeinput` `input`， 删除、回车以及快捷键涉及到的 `mousedown` `mouseup` `click` 等事件都会被拦截，并进行自定义的处理。

在对事件进行接管后，编辑器所做的事情就是管理好基于 `contenteditable` 属性根节点下的所有子节点了，比如插入文本、删除文本、插入图片等等。

综上所述，编辑中的数据结构是一个 DOM 树结构，所有的操作都是对 DOM 树直接进行操作，不是典型的以数据模型驱动视图渲染的 MVC 模式。

## 节点约束

为了更方便的管理节点，降低复杂性。编辑器抽象化了节点属性和功能，制定了 `mark` `inline` `block` `card` 4 种类型节点，他们由不同的属性、样式或 `html` 结构组成，并统一使用 `schema` 对它们进行约束。

一个简单的 `schema` 看起来像是这样：

```ts
{
  name: 'p', // 节点名称
  type: 'block' // 节点类型
}
```

除此之外，还可以描述属性、样式等，比如：

```ts
{
  name: 'span', // 节点名称
  type: 'mark', // 节点类型
  attributes: {
    // 节点有一个 style 属性
    style: {
      // 必须包含一个color的样式
      color: {
        required: true, // 必须包含
        value: '@color' // 值是一个符合css规范的颜色值，@color 是编辑器内部定义的颜色效验，此处也可以使用方法、正则表达式去判断是否符合需要的规则
      }
    },
    // 可选的包含一个 test 属性，他的值可以是任意的，但不是必须的
    test: '*'
  }
}
```

下面这几种节点都符合上面的规则：

```html
<span style="color:#fff"></span>
<span style="color:#fff" test="test123" test1="test1"></span>
<span style="color:#fff;background-color:#000;"></span>
<span style="color:#fff;background-color:#000;" test="test123"></span>
```

但是除了在 color 和 test 已经在 `schema` 中定义外，其它的属性(background-color、test1)在处理时都会被编辑器过滤掉。

可编辑器区域内的节点通过 `schema` 规则，制定了 `mark` `inline` `block` `card` 4 种组合节点，他们由不同的属性、样式或 `html` 结构组成，并对它们的嵌套进行了一定的约束。

## 编辑器中值的定义

### 带 card 的节点是 am-editor 编辑器中自定义的值，card 可以实现异步渲染，可以在 card 中渲染 React 和 Vue，做更多的交互

```typescript
<card type="block" name="codeblock" editable="false" value="data:%7B%22id%22%3A%22ArADP%22%2C%22type%22%3A%22block%22%2C%22mode%22%3A%22javascript%22%2C%22code%22%3A%22const%20a%20%3D%200%3B%22%7D"></card>
<p data-id="pd157317-RSLJ4X6g">
</p>
```

card 节点主要属性

-   type 卡片类型，block (单独占一行) 或者 inline（嵌入行内）
-   Name 卡片名称与导入的 CodeBlockComponent.cardName 名称一致

```typescript
import { CodeBlockComponent } from '@aomao/plugin-codeblock';
```

-   Value 卡片的值，用于卡片的渲染，值的类型与结构在定义卡片插件时由卡片插件定义和实现 ui 渲染
    卡片值是一个 data 字符串 + json ，以上面的代码块为例，解码后是这样的

```json
data:{"id":"ArADP","type":"block","mode":"javascript","code":"const a = 0;"}
```

一个 data 固定字符串后面跟一个 json，json 中 id 由编辑器生成的唯一 id，type 为卡片的类型，与它的属性 type 是一致的。后面的属性由卡片自定义。

我们对一个 json 值进行编码后就可以赋值给卡片了

```typescript
// 使用js做演示，后端处理也是这个逻辑
const value = encodeURIComponent(JSON.stringify({"id":"ArADP","type":"block","mode":"javascript","code":"const a = 0;"}));
const cardValue = `data:${value}`
<card type="block" name="codeblock" editable="false" value=`data:${value}`></card>
```

在 am-editor 中对这类带卡片的自定义值获取和赋值

```typescript
...
// 导入编辑器
import Engine from '@aomao/engine'
// 导入代码块插件
import CodeBlock, { CodeBlockComponent } from '@aomao/plugin-codeblock'
...
// 编辑器渲染节点
const container = useRef<HTMLDivElement | null>(null);
useEffect(() => {
    // 实例化引擎
    const engine = new Engine(container.current, {
        plugins: [CodeBlock], // 传入需要支持的插件
        cards: [CodeBlockComponent] //  传入需要支持的卡片
    });
    // 监听编辑器值改变
    engine.on('change', value => {
        // 打印当前变更的值
        console.log('am-editor value:', value)
        // 或者可以通过 engine.getValue() 获取值
    })
    // 给编辑器赋值
    engine.setValue('<card type="block" name="codeblock" editable="false" value="data:%7B%22id%22%3A%22ArADP%22%2C%22type%22%3A%22block%22%2C%22mode%22%3A%22javascript%22%2C%22code%22%3A%22const%20a%20%3D%200%3B%22%7D"></card>')
    return () => {
        engine.destroy();
    };
}, []);
return <div ref={container}></div>;
```

通过 engine.getValue() 获取的编辑器值在展示的时候需要通过 View 组件渲染。这样渲染的好处是可以还原卡片内的各种交互以及异步渲染，或者异步获取数据等操作体验

```typescript
...
// 导入视图渲染器
import { View } from '@aomao/engine';
// 导入代码块插件
import CodeBlock, { CodeBlockComponent } from '@aomao/plugin-codeblock'
...
const container = useRef<HTMLDivElement | null>(null);
useEffect(() => {
    // 实例化视图渲染器
    const view = new View (container.current, {
        plugins: [CodeBlock], // 传入需要支持的插件
        cards: [CodeBlockComponent] //  传入需要支持的卡片
    });
    // 渲染到容器
    view.render('<card type="block" name="codeblock" editable="false" value="data:%7B%22id%22%3A%22ArADP%22%2C%22type%22%3A%22block%22%2C%22mode%22%3A%22javascript%22%2C%22code%22%3A%22const%20a%20%3D%200%3B%22%7D"></card>')
    return () => {
        view.destroy();
    };
}, []);
return <div ref={container}></div>;
```

### 静态的 html

Html 相对于卡片那样的值，是无法提供异步渲染、无法使用其它 ui 库，仅仅是静态的
上一段带卡片节点的值，我们通过引擎提供的方法可以获取到以下 html

```html
<div
	data-element="root"
	class="am-engine"
	data-selection-5118985c-3395-3365-8228-d08540d1293e="%7B%22path%22%3A%7B%22start%22%3A%7B%22path%22%3A%5B1%2C0%5D%2C%22id%22%3A%22pd157317-RSLJ4X6g%22%2C%22bi%22%3A1%7D%2C%22end%22%3A%7B%22path%22%3A%5B1%2C0%5D%2C%22id%22%3A%22pd157317-RSLJ4X6g%22%2C%22bi%22%3A1%7D%7D%2C%22uuid%22%3A%225118985c-3395-3365-8228-d08540d1293e%22%2C%22active%22%3Atrue%7D"
>
	<div
		data-id="de4bd68e-VhAUT2WQ"
		data-card-editable="false"
		class=""
		data-syntax="javascript"
	>
		<div
			class="data-codeblock-content"
			style="border: 1px solid rgb(232, 232, 232); max-width: 750px; color: rgb(38, 38, 38); margin: 0px; padding: 0px; background: rgb(249, 249, 249);"
		>
			<div
				class="CodeMirror"
				style="color: rgb(89, 89, 89); margin: 0px; padding: 16px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);"
			>
				<pre
					class="cm-s-default"
					style="color: rgb(89, 89, 89); margin: 0px; padding: 0px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);"
				><span class="cm-keyword" style="color: rgb(215, 58, 73); margin: 0px; padding: 0px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);">const</span> <span class="cm-def" style="color: rgb(0, 92, 197); margin: 0px; padding: 0px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);">a</span> <span class="cm-operator" style="color: rgb(215, 58, 73); margin: 0px; padding: 0px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);">=</span> <span class="cm-number" style="color: rgb(0, 92, 197); margin: 0px; padding: 0px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);">0</span>;</pre>
			</div>
		</div>
	</div>
	<p data-id="pd157317-RSLJ4X6g"><br /></p>
</div>
```

卡片转换成了静态 html，这样我们可以自己复制到一个.html 中脱离 react、engine 就可以打开了

把一段 html 再还原成带卡片的值也比较容易。实例化 Engine 与卡片一致，区别在于设置值和获取值

```typescript
...
// 我们把这段html通过setHtml方法设置给编辑器，编辑器会自动解析成对应的卡片并且渲染
engine.setHtml(`<div data-element="root" class="am-engine" data-selection-5118985c-3395-3365-8228-d08540d1293e="%7B%22path%22%3A%7B%22start%22%3A%7B%22path%22%3A%5B1%2C0%5D%2C%22id%22%3A%22pd157317-RSLJ4X6g%22%2C%22bi%22%3A1%7D%2C%22end%22%3A%7B%22path%22%3A%5B1%2C0%5D%2C%22id%22%3A%22pd157317-RSLJ4X6g%22%2C%22bi%22%3A1%7D%7D%2C%22uuid%22%3A%225118985c-3395-3365-8228-d08540d1293e%22%2C%22active%22%3Atrue%7D">
    <div data-id="de4bd68e-VhAUT2WQ" data-card-editable="false" class="" data-syntax="javascript"><div class="data-codeblock-content" style="border: 1px solid rgb(232, 232, 232); max-width: 750px; color: rgb(38, 38, 38); margin: 0px; padding: 0px; background: rgb(249, 249, 249);"><div class="CodeMirror" style="color: rgb(89, 89, 89); margin: 0px; padding: 16px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);"><pre class="cm-s-default" style="color: rgb(89, 89, 89); margin: 0px; padding: 0px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);"><span class="cm-keyword" style="color: rgb(215, 58, 73); margin: 0px; padding: 0px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);">const</span> <span class="cm-def" style="color: rgb(0, 92, 197); margin: 0px; padding: 0px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);">a</span> <span class="cm-operator" style="color: rgb(215, 58, 73); margin: 0px; padding: 0px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);">=</span> <span class="cm-number" style="color: rgb(0, 92, 197); margin: 0px; padding: 0px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);">0</span>;</pre></div></div></div>
    <p data-id="pd157317-RSLJ4X6g"><br></p>
</div> `)
// 通过 getHtml 方法，我们可以获取到当前编辑器中对应的 html，此时我们不需要考虑我们编辑器中是使用 setHtml 还是 setValue 设置的值，我们都能通过 getHtml 获取到对应的 html
console.log(engine.getHtml())
...
```

### JSON 格式

除了以上两种 DOM 节点的值之外，还提供了 JSON 类型的值，JSON 相比较以上两种值会比较跟容易遍历和操作

```json
[
	"div",
	{
		"data-selection-5118985c-3395-3365-8228-d08540d1293e": "%7B%22path%22%3A%7B%22start%22%3A%7B%22path%22%3A%5B1%2C0%5D%2C%22id%22%3A%22pd157317-RSLJ4X6g%22%2C%22bi%22%3A1%7D%2C%22end%22%3A%7B%22path%22%3A%5B1%2C0%5D%2C%22id%22%3A%22pd157317-RSLJ4X6g%22%2C%22bi%22%3A1%7D%7D%2C%22uuid%22%3A%225118985c-3395-3365-8228-d08540d1293e%22%2C%22active%22%3Atrue%7D"
	},
	[
		"div",
		{
			"data-card-value": "data:%7B%22id%22%3A%22ArADP%22%2C%22type%22%3A%22block%22%2C%22mode%22%3A%22javascript%22%2C%22code%22%3A%22const%20a%20%3D%200%3B%22%7D",
			"data-card-type": "block",
			"data-card-key": "codeblock",
			"data-id": "de4bd68e-VhAUT2WQ"
		}
	],
	[
		"p",
		{
			"data-id": "pd157317-RSLJ4X6g"
		},
		["br", {}]
	]
]
```

JSON 格式的值是一个 json 数组。

```typescript
[
    //索引 0 表示节点的名称
    "div",
    // 索引 1 的位置是节点的所有属性
    {
        "data-id": "de4bd68e-VhAUT2WQ"
    },
    // 索引 2 的位置表示这个节点下的子节点
    [
       ...
    ]
]
```

同样的我们可以通过编辑器提供的 getJsonValue 和 setJsonValue 对 json 类型的值进行获取和处理

```typescript
...
// 我们把这段html通过setHtml方法设置给编辑器，编辑器会自动解析成对应的卡片并且渲染
engine.setJsonValue([
    "div",
    {
        "data-selection-5118985c-3395-3365-8228-d08540d1293e": "%7B%22path%22%3A%7B%22start%22%3A%7B%22path%22%3A%5B1%2C0%5D%2C%22id%22%3A%22pd157317-RSLJ4X6g%22%2C%22bi%22%3A1%7D%2C%22end%22%3A%7B%22path%22%3A%5B1%2C0%5D%2C%22id%22%3A%22pd157317-RSLJ4X6g%22%2C%22bi%22%3A1%7D%7D%2C%22uuid%22%3A%225118985c-3395-3365-8228-d08540d1293e%22%2C%22active%22%3Atrue%7D"
    },
    [
        "div",
        {
            "data-card-value": "data:%7B%22id%22%3A%22ArADP%22%2C%22type%22%3A%22block%22%2C%22mode%22%3A%22javascript%22%2C%22code%22%3A%22const%20a%20%3D%200%3B%22%7D",
            "data-card-type": "block",
            "data-card-key": "codeblock",
            "data-id": "de4bd68e-VhAUT2WQ"
        }
    ],
    [
        "p",
        {
            "data-id": "pd157317-RSLJ4X6g"
        },
        [
            "br",
            {}
        ]
    ]
])
// 通过 getJsonValue 方法，我们可以获取到当前编辑器中对应的 json，此时我们不需要考虑我们编辑器中是使用 setHtml 还是 setValue 设置的值，我们都能通过 getJsonValue 获取到对应的 json
console.log(engine.getJsonValue())
...
```

## 协同

通过 `MutationObserver` 监听编辑区域(contenteditable 根节点)内的 `html` 结构的突变反推 OT。通过`Websocket`与 [ShareDB](https://github.com/share/sharedb) 连接，然后使用命令对 ShareDB 保存的数据进行增、删、改、查。

## 特性

-   开箱即用，提供几十种丰富的插件来满足大部分需求
-   高扩展性，除了 `mark` `inline` `block` 类型基础插件外，我们还提供 `card` 组件结合`React` `Vue`等前端库渲染插件 UI
-   丰富的多媒体支持，不仅支持图片和音视频，更支持插入嵌入式多媒体内容
-   支持 Markdown 语法
-   引擎纯 JavaScript 编写，不依赖任何前端库，插件可以使用 `React` `Vue` 等前端库渲染。复杂架构轻松应对
-   内置协同编辑方案，轻量配置即可使用
-   兼容大部分最新移动端浏览器
