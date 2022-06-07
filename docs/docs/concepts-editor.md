# editor

In am-editor, the editor is a separate mode for reading and writing. Editing mode and reading mode need to be rendered through different modules. Because of the existence of `card` mode, the content output by the editor may also be interactive. In reading mode, we can also let the plugin use `React` `Vue`Wait for the front-end framework to render some interactive components. Simply put, all the effects that can be achieved under the front-end framework can be placed in the plugin. For example: you can make a voting plugin, you can set voting options in edit mode, you can choose to vote in reading mode, show the number of votes after voting, and so on. These functions may be very interesting. Unlike traditional editors that output fixed html or json data, of course we also support the output of pure html and present non-interactive content.

Instantiate engine

```ts
import Engine from'@aomao/engine';
...
//initialization
const engine = new Engine("Editor root node", {
    plugins: [],
    cards: [],
});
```

Although it is a read-write separation mode, most of the logic for rendering content in reading mode is the same as in editing mode, so the engine provides the View module to render the reading mode

The instantiation method is roughly the same as the engine

```ts
import {View} from'@aomao/engine';
...
//initialization
const view = new View("Renderer root node", {
    plugins: [],
    cards: [],
});
```

Inside the plugin, we may need to control the reading mode, we can use `isEngine` to determine

```ts
import {isEngine} from'@aomao/engine';

...
if(isEngine(this.editor)) {
    //Edit mode
} else {
    //Reading mode
}

...

```

## Edit mode

In the editing mode, we need to control the DOM tree, cursor, events, etc., so that the user's input can achieve the best expected value and experience, all of which will be done by the engine `@aomao/engine`

## Reading Mode

The reading mode is much simpler than the editing mode. There is no need to change the DOM tree, and the cursor can hardly be controlled. The interaction of the `card` plugin is exactly the same as writing the components of the front-end framework such as `React` and `Vue` under normal circumstances.
