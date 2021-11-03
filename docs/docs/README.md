---
title: Introduction
---

## What is it?

> Thanks to Google Translate

Use the `contenteditable` attribute provided by the browser to make a DOM node editable.

The engine takes over most of the browser's default behaviors such as cursors and events.

The nodes in the editor area have four types of combined nodes of `mark`, `inline`, `block` and `card` through the `schema` rule. They are composed of different attributes, styles or `html` structures. Certain constraints are imposed on nesting.

Use the `MutationObserver` to monitor the changes of the `html` structure in the editing area, and generate a `json0` type data format to interact with the [ShareDB](https://github.com/share/sharedb) library to meet the needs of collaborative editing .

**`Vue2`** example [https://github.com/zb201307/am-editor-vue2](https://github.com/zb201307/am-editor-vue2)

**`Vue3`** example [https://github.com/yanmao-cc/am-editor/tree/master/examples/vue](https://github.com/yanmao-cc/am-editor/tree/master/examples/vue)

**`React`** example [https://github.com/yanmao-cc/am-editor/tree/master/examples/react](https://github.com/yanmao-cc/am-editor/tree/master/examples/react)

## Features

-   Out of the box, it provides dozens of rich plug-ins to meet most needs
-   High extensibility, in addition to the basic plug-in of `mark`, inline`and`block`type, we also provide`card`component combined with`React`, `Vue` and other front-end libraries to render the plug-in UI
-   Rich multimedia support, not only supports pictures, audio and video, but also supports insertion of embedded multimedia content
-   Support Markdown syntax
-   The engine is written in pure JavaScript and does not rely on any front-end libraries. Plug-ins can be rendered using front-end libraries such as `React` and `Vue`. Easily cope with complex architecture
-   Built-in collaborative editing program, ready to use with lightweight configuration
-   Compatible with most of the latest mobile browsers
