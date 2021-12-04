# 节点

DOM 节点在编辑器中是最重要的对象，编辑器数据结构就是一个 DOM 树。按照功能和特性我们可以划分为

-   `mark` 样式节点，我们可以给文本加上颜色、加粗、字体大小等效果，并且可以互相嵌套效果
-   `inline` 行内节点，例如，链接。给一段文字添加特殊属性或者样式效果，不可嵌套。
-   `block` 块级节点，可以独占一行，并且可以有多个 `mark` `inline` 样式节点作为子节点
-   `card` 一个单独区域，可以是行内节点也可以是块级节点。在这个区域内，除非有指定特定区域可编辑，否则都将交由开发者自定义

这是一个简单的纯文本值：

```html
<p>这是一个<strong>段落</strong></p>
```

节点通常由 html 标签和一些样式属性组成。为了有利于区分，每个样式节点的组成都应唯一。

例如，拥有一个独特的标签名称：

```html
<strong>加粗</strong> <em>斜体</em>
```

或者通过属性以及样式来修饰：

```html
<span style="font-weight:bold">加粗</span>
<span style="font-style:italic">斜体</span>
```

他们都有一样的效果，但引擎在判定上，他们都属于不同插件。

## 样式节点

样式节点通常用来描述文本的文字大小、粗体、斜体、颜色等样式。

样式节点的子节点只能是文本节点或者样式节点，样式节点必须有父节点（行内节点或块级节点），不能单独存在于编辑器中。

```html
<p>
	This is a <span style="color:red"><em>red</em> text</span>
</p>
```

## 行内节点

行内节点拥有样式节点的所有的特质，但是行内节点不可以嵌套，行内节点的子节点只能是样式节点或者文本节点。同样，行内节点必须有父节点（只能是块级节点），不能单独存在于编辑器中。

```html
<p>
	This is <a href="https://www.aomao.com">a <strong>link</strong></a>
</p>
```

## 块级节点

块级节点在编辑器中独占一行，除了使用 `schema` 明确指定嵌套关系外，默认只能在 `$root` (编辑器根节点)下。子节点可以是其它任意节点，除非已指定不能包含某些样式节点类的插件。例如，标题中不能使用加粗、调整字体大小。

```html
<!-- strong 标签将会被过滤掉 -->
<h2>This is a <strong>title</strong></h2>
```

p 标签在引擎中属于默认所需的块级节点，用于表明一个段落。在自定义节点中，不建议再使用 p 标签。

## 卡片

我们可以在编辑器中划分一个单独区域，用于展示一个复杂的编辑模块。该区域就像一张白纸，你可以在上面挥洒自如。他的结构看起来像这样：

```html
<div
	data-card-value="data:%7B%22id%22%3A%22eIxTM%22%7D"
	data-card-type="block"
	data-card-key="hr"
>
	<div data-card-element="body">
		<span data-card-element="left" data-transient-element="true">​</span>
		<div data-card-element="center" contenteditable="false" class="card-hr">
			<!-- 卡片内容节点 -->
		</div>
		<span data-card-element="right" data-transient-element="true">​</span>
	</div>
</div>
```

### 属性

`data-card-type` 表示卡片类型，卡片有两种类型：

-   `inline` 行内，可以嵌入一个块级标签中作为子节点，可以和文本、样式节点、其它行内节点同级别展示
-   `block` 作为一个块级节点独占一行

`data-card-value` 卡片自定义值，在渲染时可以借助值动态渲染

`data-card-key` 卡片名称标识

### 子节点

`data-card-element` 卡片子固定节点标识属性

-   `body` 卡片主体节点，包含卡片所有的内容
-   `left` `right` 用户控制卡片两侧光标，也是固定的节点，不能存任何内容
-   `center` 卡片内容节点，也是自定义渲染节点。你的所有节点要放在这里。

## 节点选择器

要操作复杂的 DOM 树，使用浏览器自带的 document.createElement 相关函数看起来比较麻烦。如果有像`JQuery`的 javascript 库则会很方便，因此我们封装了一个"简易版的 jquery 库"。

```ts
import { $ } from '@aomao/engine';

//选择节点
const node = $('CSS选择器');
//创建节点
const divNode = $('<div></div>');
```

使用 \$ 创建或选择节点后会返回一个 `NodeInterface` 类型对象，能更好的帮助你管理 DOM `Node` 节点。具体属性和方法请查看 API
