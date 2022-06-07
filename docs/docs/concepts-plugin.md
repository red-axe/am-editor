# Plugin

It is relatively simple to develop a plugin on the engine. The engine provides the following abstract classes:

-   `Plugin` The most basic abstract plugin class
-   `ElementPlugin` node plugin, inherited from the `Plugin` abstract class
-   `BlockPlugin` block-level node plugin, inherited from the abstract class of `ElementPlugin`
-   `MarkPlugin` style node plugin, inherited from `ElementPlugin` abstract class
-   `InlinePlugin` inline node plugin, inherited from `ElementPlugin` abstract class
-   `ListPlugin` list plugin, inherited from `BlockPlugin` abstract class

In more complex plugins, we need to manipulate the DOM tree and cursor, so just inheritance is not enough. We also need to cooperate with the node API to make a more complete plugin.

Here we only need to understand the basic knowledge about plugins. If you need to develop a complete tutorial for plugins, please view it in the "Plugins" menu.

We have provided enough basic plugins. Basically, you may no longer need to define basic plugins. Most likely, you will need to use `card` combined with front-end libraries such as `React` or `Vue` to define a complex plugin, such as surveys. Questionnaires, drawing, multiple choice questions, `card` components are all competent

## Use

The plugin is initialized when the editor is instantiated. So we need to pass the plugin to the engine at the beginning

```ts
const engine = new Engine(render node, {
plugins: [...plugin list],
});
```

## Command

All plugins inherit from the abstract class `Plugin` and must implement the `execute` method. The engine will add them to the list of executable commands, and when executing plugin commands, the engine will help deal with the cursor position, history, etc.

```ts
/**
 * Execute plugin
 * @param args parameters required by the plugin
 */
abstract execute(...args: any): void;
```

We can execute a plugin command in the form of `engine.command.execute("plugin name", ...plugin parameter)`

## Card

In addition to the previous imperative and fixed operation node type plugins without UI rendering, we can also combine `Card` to complete custom content rendering plugins. Similarly, `Card` is also an abstract class, and we need to inherit it. It also has a method `render` (card rendering method) that must be implemented. How to render the nodes in the card is entirely up to you.

## Extension

In addition to the troublesome method of customizing the plugin, we can also inherit it from the existing basic plugin, and then rewrite some methods of the plugin, get the node addition event of the plugin, and so on. However, you must first have a certain understanding of the logic and definition of the plugin.
