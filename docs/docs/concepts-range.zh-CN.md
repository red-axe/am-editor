# 光标

在编辑器中，除了需要和 DOM 树打交道外，其次就是控制好我们的光标。在我们鼠标左键在编辑区域单击后，会有光标闪烁，那里就是我们编辑的位置，包括左键按下后滑动鼠标选取一段范围。这些光标信息都会表明当前用户要操作的 DOM 节点位置。

在知道要操作的 DOM 位置后，用户的其它任何操作都可能需要去改变 DOM 树结构，例如输入字符、或者按下删除键，我们需要做的是就是把用户的这些反馈正确的应用到 DOM 树上后让光标范围落在正确的位置上，用户并不想看到光标乱跳。

浏览器已经为我们提供了丰富的 API [Range](https://developer.mozilla.org/zh-CN/docs/Web/API/Range/Range)。不同的浏览器厂商可能在实现上会有些细微的差别，包括所选节点的位置也有差别。不过这些在我们的引擎中已经很好的处理过了。

## 认识 Range

`Range` 对象中主要有五个重要属性，需要了解其它详细属性和方法，请访问浏览器 API[Range](https://developer.mozilla.org/zh-CN/docs/Web/API/Range/Range)

-   `startContainer` 光标开始位置节点
-   `startOffset` 光标开始位置节点下的偏移量
-   `endContainer` 光标结束位置节点
-   `endOffset` 光标结束位置节点下的偏移量
-   `collapsed` 表示光标开始位置和结束位置是否处于同一个位置

例子 1：

这里我们使用 anchor 表示开始位置，focus 表示结束位置。

```html
<p>a<anchor />bc<focus />d</p>
```

p 节点下面是一段 `abcd` 文本，在 DOM 树中类型是 `Text` ，是一个文本节点。startContainer 和 endContainer 都指向 `Text`, offset 就是字符长度 startOffset=1, endOffset=3 ，虽然指向节点都是 Text，但是 offset 不一致，collapsed 为 false

例子 2:

这里我们使用 cursor 表示光标开始位置和结束位置处于重合状态

```html
<p>
	<span><cursor />abcd</span>
</p>
```

p 节点下是一个 span 节点，span 节点下是 `Text` 文本节点。此处表示 `Range` 对象有两种方式

-   startContainer 和 endContainer 都指向 `Text`，startOffset 和 endOffset 都为 0
-   startContainer 和 endContainer 都指向 span 节点，startOffset 和 endOffset 都为 0

在所指节点非 `Text` 文本节点时，offset 表示子节点相对于父节点的索引值

此处这两种方式表达的意思都是一样的，而且在更复杂的 DOM 结构中，还会有更多复杂的表述，在这种情况下我们借助 Range 对象来判定节点位置执行操作会有很多的不确定性。所以我们在 Range 基础上扩展了`RangeInterface`类型来帮助我们更好的把控`Range`对象。更多的信息请查看 API

## 零宽字符

零宽字符是一种在浏览器中不打印的字符，它也没有宽度。

在无法设置光标位置，或者有修复默认浏览器默认光标位置时，会使用到`零宽字符`，让光标选择到零宽字符旁边。例如：<span></span>，我们想让光标聚焦到 span 节点内，但是 span 节点内没有任何节点，这时我们可以给 span 节点内添加一个零宽字符 <span>&#8204;</span>，并让光标选择在零宽字符前或后，我们就可以在 span 节点内输入内容了。
