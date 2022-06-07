# Block plugin

Block node plugin

Usually used for block-level nodes on a single line, similar to titles, quotes

For this type of plugin, we need to inherit the `BlockPlugin` abstract class. The `BlockPlugin` abstract class extends some properties and methods on the basis of inheriting the `ElementPlugin` abstract class. So the plugin that inherits `BlockPlugin` also has all the attributes and methods of the `ElementPlugin` abstract class

## Inheritance

Inherit the `BlockPlugin` abstract class

```ts
import {BlockPlugin} from'@aomao/engine'

export default class extends BlockPlugin {
...
}
```

## Attributes

### `tagName`

Label name, must

Type: `string | Array<string>`

The tag name here is the same as the tag name in the parent class `ElementPlugin`, except that the tag name is one of the necessary attributes of the `BlockPlugin` plugin

The `BlockPlugin` tag name can be an array. For example, title, h1, h2, h3, h4, h5, h6. When set as an array, these names will be combined with `style` and `attributes` into a `schema` rule.

```ts
readonly tagName = ['h1','h2','h3','h4','h5','h6'];
```

### `allowIn`

This node allows block nodes that can be placed, the default is `$root` editor root node

Type: `Array<string>`

```ts
readonly allowIn = ['blockquote','$root']
```

### `disableMark`

Disabled mark plugin style, the mark plugin node style that cannot appear under the block node

Type: `Array<string>`

```ts
//Pass in the mark plugin name
disableMark = ['fontsize', 'bold'];
```

### `canMerge`

Can the same block nodes be merged, the default is false, optional

Type: `boolean`

## Method

### `init`

Initialization, optional

The `BlockPlugin` plugin has implemented the `init` method, if you need to use it, you need to manually call it again. Otherwise there will be unexpected situations

```ts
export default class extends BlockPlugin {
...
    init(){
        super.init()
    }
}
```

### `queryState`

Query plugin status command, optional

```ts
queryState() {
    //Not an engine
    if (!isEngine(this.editor)) return;
    const {change} = this.editor
    //Get all block-level labels in the current cursor selection area
    const blocks = change.blocks;
    if (blocks.length === 0) {
        return'';
    }
    //Check if there is a label name that contains the current plugin settings. If there is an attribute style set, you also need to compare the attributes and styles
    return this.tagName.indexOf(blocks[0].name) >= 0? blocks[0].name:'';
}
```

### `execute`

Execute plugin commands, need to be implemented

Example of adding a block tag:

```ts
execute(...args) {
    //Not an engine
    if (!isEngine(this.editor)) return;
    const {change, block, node} = this.editor;
    if (!this.queryState()) {
        //Package block node
        block.wrap(`<${this.tagName} />`);
    } else {
        //Get the cursor object
        const range = change.range.get();
        //Get the first block-level node in the current cursor area and look up the node with the same name as the block-level node set by the current plugin
        const blockquote = change.blocks[0].closest(this.tagName);
        //Mark the cursor position before removing the package
        const selection = range.createSelection();
        //Remove package
        node.unwrap(blockquote);
        //Restore the cursor position after removing the package
        selection.move()
        //Reset the cursor of the editor
        change.range.select(range);
    }
}
```

### `schema`

Set the `schema` rule of this block plugin, optional

The `BlockPlugin` plugin has implemented the `schema` method and will automatically set the rules according to the `tagName` `style` `attributes`.

If you need to use it, you can override this method or use super.schema() to call this method again
