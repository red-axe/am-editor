# @aomao/plugin-heading

Heading style plugin

## Installation

```bash
$ yarn add @aomao/plugin-heading
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Heading from'@aomao/plugin-heading';

new Engine(...,{ plugins:[Heading] })
```

## Optional

### Anchor

A copyable anchor button appears on the left side of the title after it is turned on

```ts
showAnchor?: boolean;
```

Triggered when the copy anchor is clicked, the id value of the current title is passed in, the returned content will be written to the user's pasteboard, and the current url+id will be returned by default

```ts
anchorCopy?:(id:string) => string
```

### Hotkey

```ts
//hotkey
hotkey?: {
    h1?: string;//Title 1, default mod+opt+1
    h2?: string;//Title 2, default mod+opt+2
    h3?: string;//Title 3, default mod+opt+3
    h4?: string;//Title 4, default mod+opt+4
    h5?: string;//Title 5, default mod+opt+5
    h6?: string;//Title 6, default mod+opt+6
};
//Use configuration
new Engine(...,{
    config:{
        "heading":{
            //Modify shortcut keys
            hotkey:{
                h1: "shortcut key"
            }
        }
    }
 })
```

### Disable mark plugin style effect

You can disable the mark plugin effect under the title, ['fontsize','bold'] is disabled by default, and filter out these plugin styles in the case of splitting, pasting, etc.

```ts
disableMark?: Array<string> //mark plugin name collection
```

### Type to be enabled (h1 h2 h3 h4 h5 h6)

Can define the node types required by h1-h6, if not defined, all are supported

Markdown will also be invalid after setting

```ts
enableTypes?: Array<string>
```

In addition, you may also need to configure the heading plugin of the items attribute in the toolbar

```ts
{
     type:'dropdown',
     name:'heading',
     items: [
         {
             key: "p",
             className:'heading-item-p',
             content: "Body"
         },
         {
             key: "h1",
             className:'heading-item-h1',
             content: "Title 1"
         }
     ]
     }
```

## Command

When `p` is passed in or the current heading style is consistent with the current passed value, the heading will be canceled

```ts
//Use command to execute the plugin and pass in the required parameters
engine.command.execute(
	'heading',
	'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p',
);
//Use command to execute query current status, return string | undefined, return "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p"
engine.command.queryState('heading');
```

## Outline

Generate headline outline data

Need to import the `Outline` class from `@aomao/plugin-heading`

```ts
import { Outline } from '@aomao/plugin-heading';
```

### `normalize`

Normalize the title node data into a structure with depth levels

```ts
/**
 * Normalize heading data into a structure with depth levels
 * After normalization, the structure of each element is:
 * {
 * id: string, // id
 * title: string, // title
 * level: number, // Title level
 * domNode: Node, // dom node
 * depth: number // display depth
 *}
 * The depth algorithm is consistent with that of Google Docs
 *-Effect: h1 -> h4 assign a fixed depth to ensure that the final level depth of the title of the same level is the same
 *-Algorithm: Find out the title level of the document; assign the indentation depth in descending order of level;
 * @param {Element[]}headings heading standard DOM node array
 *
 * @return {Array} title node array
 */
normalize(headings: Array<Element>): OutlineData[];
```

### `getFromDom`

Extract outline from DOM node

```ts
/**
 * Extract outline from DOM node
 * @param {Element} rootNode root node
 * @return {Array}
 */
getFromDom(rootNode: Element): OutlineData[];
```

### Examples

### 例子

```ts
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { $, EditorInterface } from '@aomao/engine';
import { Outline, OutlineData } from '@aomao/plugin-heading';

type Props = {
	editor: EditorInterface;
};

const outline = new Outline();

const Toc: React.FC<Props> = ({ editor }) => {
	const rootRef = useRef<HTMLDivElement | null>(null);
	const [datas, setDatas] = useState<Array<OutlineData>>([]);

	useEffect(() => {
		const onChange = () => {
			//Get outline data
			const data = getTocData();
			setDatas(data);
		};
		//Binding editor value change event
		editor.on('change', onChange);
		setTimeout(() => {
			onChange();
		}, 50);
		return () => editor.off('change', onChange);
	}, [editor]);

	const getTocData = useCallback(() => {
		// Extract the title Dom node that meets the structural requirements
		let nodes: Array<Element> = [];
		const { card } = editor;
		editor.container.find('h1,h2,h3,h4,h5,h6').each((child) => {
			const node = $(child);
			// The title in the Card is not included in the outline
			if (card.closest(node)) {
				return;
			}
			// Non-first-level in-depth titles, not included in the outline
			if (!node.parent()?.isRoot()) {
				return;
			}
			nodes.push(node.get<Element>()!);
		});
		return outline.normalize(nodes);
	}, []);

	return (
		<div className="data-toc-wrapper">
			<div className="data-toc-title">大纲</div>
			<div className="data-toc" ref={rootRef}>
				{datas.map((data, index) => {
					return (
						<a
							key={index}
							href={'#' + data.id}
							className={`data-toc-item data-toc-item-${data.depth}`}
						>
							{data.text}
						</a>
					);
				})}
			</div>
		</div>
	);
};
export default Toc;
```
