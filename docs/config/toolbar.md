---
toc: menu
---

# Toolbar configuration

Introduce the toolbar

```ts
//vue please use @aomao/toolbar-vue
import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';
```

-   Toolbar Toolbar component
-   ToolbarPlugin provides plugins to the engine
-   ToolbarComponent provides the card component to the engine

Except for the `Toolbar` component, the latter two are shortcuts to realize the toolbar card plug-in option when you press `/` in the editor

## Types of

There are now four ways to display the toolbar

-   `button` button
-   `downdrop` drop-down box
-   `color` color palette
-   `collapse` drop-down panel, the drop-down box that appears on the first button of the toolbar, and card-form components are basically placed here

## Props

The attributes that the Toolbar component needs to pass in:

-An instance of the `editor` editor, which can be used to automatically invoke the plug-in execution -`items` plugin display configuration list

## Items

items is a two-dimensional array. We can put plugins of the same concept in a group for easy searching. After rendering, each group will be separated by a dividing line

```ts
items: [['collapse'], ['bold', 'italic']];
```

All the display forms of the existing plug-ins have been configured in the Toolbar component, and we can directly pass in the plug-in name to use these configurations. Of course, we can also pass in an object to cover part of the configuration

```ts
items: [
	['collapse'],
	[
		{
			name: 'bold',
			icon: 'icon',
			title: 'Prompt text',
		},
		'italic',
	],
];
```

If the default configuration is found through the `name` attribute, the `type` attribute will not be overwritten. If the configured `name` is not part of the default configuration, it can also be displayed, which is equivalent to adding a custom button to the toolbar, and you can also add event custom processing for it

### Drop-down panel

Usually used to configure cards

#### Group

The `groups` property can be set to classify cards for different purposes as needed

If `title` is not filled in, the grouping style will not appear

```ts
items: [
  {
    type:'collapse',
    groups: [{
      title: "File",
      // modify the title
      items: ["image-uploader", "image-file"]
    }]
  }
```

#### Custom list items

Some attributes of `item` can be modified. For example, `title` and `icon` will be merged with the default configuration

More attributes can be viewed [React](https://github.com/yanmao-cc/am-editor/blob/master/packages/toolbar/src/config/toolbar/index.tsx) [Vue](https: //github.com/yanmao-cc/am-editor/blob/master/packages/toolbar-vue/src/config/index.ts)

```ts
items: [
  {
    type:'collapse',
    groups: [{
      // modify the title
      items: [{ name:"image-uploader", title: "Upload file"}]
    }]
  }
```

## More complete configuration

```ts
[
	['collapse'],
	['undo', 'redo', 'paintformat', 'removeformat'],
	['heading', 'fontfamily', 'fontsize'],
	['bold', 'italic', 'strikethrough', 'underline', 'moremark'],
	['fontcolor', 'backcolor'],
	['alignment'],
	['unorderedlist', 'orderedlist', 'tasklist', 'indent', 'line-height'],
	['link', 'quote', 'hr'],
];
```

## default allocation

[https://github.com/yanmao-cc/am-editor/blob/master/packages/toolbar/src/config/toolbar/index.tsx](https://github.com/yanmao-cc/am-editor/blob/master/packages/toolbar/src/config/toolbar/index.tsx)
