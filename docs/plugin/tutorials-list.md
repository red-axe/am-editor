# List plugin

List node plugin

Usually used for ordered lists, unordered lists, and custom lists. For example, the task list is a custom list, and the `checkbox` inside is an implementation of `card` of type `inline`

For this type of plugin, we need to inherit the `ListPlugin` abstract class. The `ListPlugin` abstract class extends some properties and methods on the basis of inheriting the `BlockPlugin` abstract class. So the plugin that inherits `ListPlugin` also has all the attributes and methods of the `BlockPlugin` abstract class

## Inheritance

Inherit the `ListPlugin` abstract class

```ts
import {ListPlugin} from'@aomao/engine'

export default class extends ListPlugin {
...
}
```

## Attributes

`ListPlugin` has all the attributes and methods of `BlockPlugin` `ElementPlugin` `Plugin` inherited

### `cardName`

Card name, optional.

When we customize the list, `cardName` is necessary

The `card` component corresponding to the card name must be of type `inline`, not of type `block`

Type: `string`

```ts
cardName = 'checkbox';
```

## Method

### `init`

Initialization, optional

The `ListPlugin` plugin has implemented the `init` method, if you need to use it, you need to manually call it again. Otherwise there will be unexpected situations

```ts
export default class extends ListPlugin {
...
    init(){
        super.init()
    }
}
```

### `isCurrent`

To determine whether the node is the node required by the current list, it must be implemented

We need to use this method to determine which plugin a list node attribute

```ts
isCurrent(node: NodeInterface) {
    //li node, must include the style of the `CUSTOMZIE_LI_CLASS` custom list, and the first child node under li should be a card, the card name corresponds to the cardName we set
    if (node.name ==='li')
        return (
            node.hasClass(this.editor.list.CUSTOMZIE_LI_CLASS) &&
            node.first()?.attributes(CARD_KEY) === this.cardName
        );
    //ul node should contain `CUSTOMZIE_UI_CLASS` custom list style. And there are also our custom styles
    return node.hasClass(this.editor.list.CUSTOMZIE_UI_CLASS) && node.hasClass('data-list-task');
}
```

### `queryState`

The `ListPlugin` plugin has implemented the `queryState` method, if you need to use it, you can override this method

```ts
queryState() {
    if (!isEngine(this.editor)) return false;
    return (
        this.editor.list.getPluginNameByNodes(this.editor.change.blocks) ===
        (this.constructor as PluginEntryType).pluginName
    );
}
```

### `execute`

Need to use API call method to realize the package of the list node, and remove

```ts
//Non-engine
if (!isEngine(this.editor)) return;
const { change, list, block } = this.editor;
//First cut the list, <ul><li /><anchor /><li /><focus /><li /></ul> -> <ul><li /></ul><anchor / ><ul><li /><focus /></ul><ul><li /></ul>
list.split();
//Get the current cursor
const range = change.range.get();
//Get all current block nodes after the season
const activeBlocks = block.findBlocks(range);
if (activeBlocks) {
	//Create a marker node at the cursor
	const selection = range.createSelection();
	//Determine whether it belongs to the custom list node of the current plugin type
	if (list.isSpecifiedType(activeBlocks, 'ul', 'checkbox')) {
		//Remove package
		list.unwrap(activeBlocks);
	} else {
		//Convert all currently activated block nodes into a custom list
		const listBlocks = list.toCustomize(
			activeBlocks,
			'checkbox',
			//The value of the checkbox card is determined by the value when the checkbox is defined. For example, whether checked is checked
			{
				checked: boolean,
			},
		) as Array<NodeInterface>;
		//After the conversion is completed, add our custom styles in a loop
		listBlocks.forEach((list) => {
			if (this.editor.node.isList(list)) list.addClass('data-list-task');
		});
	}
	//Remove the mark and restore the cursor
	selection.move();
	//Reselect the new cursor position
	change.range.select(range);
	//Merge adjacent and identical list nodes, if any
	list.merge();
}
```
