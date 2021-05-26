---
title: Introduction
---

## What is it?

am-editor, a web multi-person real-time collaborative rich text editor. Use the `contenteditable` attribute provided by the browser to make a DOM node editable. As we all know, the `contenteditable` attribute has different implementations in different browser vendors, and its default behavior is unpredictable, so we encapsulate A certain controllable editing capability engine library `@aomao/engine` is created, which balances the default behavior and the desired behavior.

The engine library is written in `javascript`. We encapsulate and derive interfaces for a series of operations such as DOM node insertion, deletion, and replacement, including cursors and events. Therefore, all our operations in the engine will directly edit the complex DOM tree, and in the data structure we will also present it in the DOM tree structure. However, in practical applications, it is very necessary for us to constrain the complex DOM tree structure to avoid unexpected behavior, and in the current popular use of front-end frameworks such as `React` and `Vue` to render the UI, let us re Using `javascript` to customize the UI is a very painful thing. So we divide the DOM nodes into the following categories according to their functions and characteristics: `mark` `inline` `block` `card` and use the `schema` to constrain their specific behaviors and some idiosyncratic attributes. In the `card` component we It can also be combined with the front-end framework to complete complex UI rendering and editing nesting.

In modern enterprises, collaborative office is synonymous with high efficiency. Collaborating documents after instant messaging and video conferencing is a general trend. In the engine library, we provide collaborative editing capabilities based on [ShareDB](https://github.com/share/sharedb) and convert the complex DOM structure to [JSON0](https://github.com/ottypes/json0) After the data structure of the protocol, submit it to `sharedb` to handle the interaction of collaborative editing.

## Features

-   📦 Out of the box, it provides dozens of rich plug-ins to meet most needs
-   🏷 High scalability, in addition to the `mark` `inline` `block` basic plug-in, we also provide `card` component combined with `React` `Vue` and other front-end framework rendering plug-in UI
-   📋 Rich multimedia support, not only supports pictures, audio and video, but also supports inserting embedded multimedia content
-   🐠 Do not rely on front-end framework, easy to deal with complex architecture
-   📡 Built-in collaborative editing program, ready to use with lightweight configuration
