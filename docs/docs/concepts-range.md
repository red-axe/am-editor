# Range

In the editor, in addition to dealing with the DOM tree, the second thing is to control our range. After we click the left mouse button in the editing area, the range will flicker, and there is the editing position, including the selection of a range by sliding the mouse after pressing the left button. The range information will indicate the position of the DOM node that the current user wants to operate.

After knowing the position of the DOM to be manipulated, any other user operations may need to change the DOM tree structure, such as inputting characters or pressing the delete key. What we need to do is to correctly apply the user feedback to the DOM tree. After up, let the range range fall on the correct position, the user does not want to see the range jump randomly.

The browser has provided us with a rich API [Range](https://developer.mozilla.org/zh-CN/docs/Web/API/Range/Range). Different browser vendors may have some subtle differences in implementation, including differences in the location of selected nodes. But these have been handled well in our engine.

## Meet Range

There are five important attributes in the `Range` object. If you need to understand other detailed attributes and methods, please visit the browser API [Range](https://developer.mozilla.org/zh-CN/docs/Web/API/Range/Range)

-   `startContainer` range start position node
-   `startOffset` the offset under the node where the range starts
-   `endContainer` node at the end of the range
-   `endOffset` the offset under the node where the range ends
-   `collapsed` indicates whether the start position and end position of the range are at the same position

Example 1:

Here we use anchor to indicate the start position, and focus to indicate the end position.

```html
<p>a<anchor />bc<focus />d</p>
```

Below the p node is a paragraph of `abcd` text, the type is `Text` in the DOM tree, which is a text node. Both startContainer and endContainer point to `Text`, offset is the character length startOffset=1, endOffset=3, although the pointing nodes are all Text, the offset is inconsistent, collapsed is false

Example 2:

Here we use range to indicate that the start position and end position of the range are in a coincident state

```html
<p>
	<span><range />abcd</span>
</p>
```

Below the p node is a span node, and below the span node is the text node `Text`. Here, there are two ways of `Range` object

-   startContainer and endContainer both point to `Text`, startOffset and endOffset are both 0
-   startContainer and endContainer both point to the span node, startOffset and endOffset are both 0

When the pointed node is not a `Text` text node, offset represents the index value of the child node relative to the parent node

The meanings of these two methods are the same here, and in more complex DOM structures, there will be more complex expressions. In this case, we use the Range object to determine the position of the node and perform many operations. Uncertainty. So we extend the `RangeInterface` type on the basis of Range to help us better control the `Range` object. For more information, please see API

## Zero-width characters

A zero-width character is a character that is not printed in the browser, and it has no width.

When the range position cannot be set, or there is a repair to the default browser default range position, the `zero-width character` will be used to select the range next to the zero-width character. For example: <span></span>, we want the range to focus on the span node, but there is no node in the span node, then we can add a zero-width character to the span node <span>&#8204;</ span>, and let the range select before or after the zero-width character, we can enter content in the span node.
