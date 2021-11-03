# Plugin

It is relatively simple to develop a plug-in on the engine. The engine provides the following abstract classes:

-   `Plugin` The most basic abstract plug-in class
-   `ElementPlugin` node plugin, inherited from the `Plugin` abstract class
-   `BlockPlugin` block-level node plug-in, inherited from the abstract class of `ElementPlugin`
-   `MarkPlugin` style node plugin, inherited from `ElementPlugin` abstract class
-   `InlinePlugin` inline node plugin, inherited from `ElementPlugin` abstract class
-   `ListPlugin` list plugin, inherited from `BlockPlugin` abstract class

In more complex plug-ins, we need to manipulate the DOM tree and cursor, so just inheritance is not enough. We also need to cooperate with the node API to make a more complete plug-in.

Here we only need to understand the basic knowledge about plug-ins. If you need to develop a complete tutorial for plug-ins, please view it in the "Plugins" menu.

We have provided enough basic plug-ins. Basically, you may no longer need to define basic plug-ins. Most likely, you will need to use `card` combined with front-end libraries such as `React` or `Vue` to define a complex plug-in, such as surveys. Questionnaires, drawing, multiple choice questions, `card` components are all competent

## Use

The plugin is initialized when the editor is instantiated. So we need to pass the plugin to the engine at the beginning

```ts
const engine = new Engine(render node, {
plugins: [...plugin list],
});
```

## Command

All plug-ins inherit from the abstract class `Plugin` and must implement the `execute` method. The engine will add them to the list of executable commands, and when executing plug-in commands, the engine will help deal with the cursor position, history, etc.

```ts
/**
 * Execute plugin
 * @param args parameters required by the plug-in
 */
abstract execute(...args: any): void;
```

We can execute a plugin command in the form of `engine.command.execute("plugin name", ...plugin parameter)`

## Card

In addition to the previous imperative and fixed operation node type plug-ins without UI rendering, we can also combine `Card` to complete custom content rendering plug-ins. Similarly, `Card` is also an abstract class, and we need to inherit it. It also has a method `render` (card rendering method) that must be implemented. How to render the nodes in the card is entirely up to you.

## Extension

In addition to the troublesome method of customizing the plug-in, we can also inherit it from the existing basic plug-in, and then rewrite some methods of the plug-in, get the node addition event of the plug-in, and so on. However, you must first have a certain understanding of the logic and definition of the plug-in.
