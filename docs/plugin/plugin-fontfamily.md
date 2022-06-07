# @aomao/plugin-fontfamily

Font plugin

## Installation

```bash
$ yarn add @aomao/plugin-fontfamily
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Fontfamily from'@aomao/plugin-fontfamily';

new Engine(...,{ plugins:[Fontfamily] })
```

## Optional

### Paste and filter custom fonts

Supports filtering of fonts that do not conform to the definition

```ts
/**
  * @param fontFamily current font
  * @returns returns string to modify the current value, false is removed, true is retained
  * */
filter?: (fontFamily: string) => string | boolean
//Configuration
new Engine(...,{
     config:{
         [Fontfamily.pluginName]: {
             //Configure the font to be filtered after pasting
             filter: (fontfamily: string) => {
                 // fontFamilyDefaultData The default font data exported from the toolbar package
                 const item = fontFamilyDefaultData.find(item => fontfamily.split(",").some(name => item.value.toLowerCase().indexOf(name.replace(/"/,"").toLowerCase()) > -1))
                 return item? item.value: false
             }
         }
     }
}
```

### Hotkey

No shortcut keys by default

```ts
//Shortcut keys, key combination keys, args, execution parameters, [font], font must
hotkey?:{key:string,args:Array<string>};//default none

//Use configuration
new Engine(...,{
    config:{
        "fontfamily":{
            //Modify shortcut keys
            hotkey:{
                key:"mod+b",
                args:["Microsoft Yahei"]
            }
        }
    }
 })
```

### Custom font

Part of the font list is built in the toolbar, which can be obtained by the following methods

```ts
import { fontFamilyDefaultData, fontfamily } from '@aomao/toolbar'; // or @aomao/toolbar-vue
```

#### `fontfamily` Convert available drop-down list data

```ts
/**
 * Generate font drop-down list items
 * @param data key-value key-value pair data, key name, if there is a language, it is the key of the language key-value pair, otherwise it will be displayed directly
 * @param language language, optional
 */
fontfamily(
data: Array<{ key: string; value: string }>, language?: {[key: string]: string }): Array<DropdownListItem>
```

#### `fontFamilyDefaultData` Default font list

```ts
[
	{
		key: 'default',
		value: '',
	},
	{
		key: 'arial',
		value: 'Arial',
	},
	{
		key: 'comicSansMS',
		value: '"Comic Sans MS"',
	},
	{
		key: 'courierNew',
		value: '"Courier New"',
	},
	{
		key: 'georgia',
		value: 'Georgia',
	},
	{
		key: 'helvetica',
		value: 'Helvetica',
	},
	{
		key: 'impact',
		value: 'Impact',
	},
	{
		key: 'timesNewRoman',
		value: '"Times New Roman"',
	},
	{
		key: 'trebuchetMS',
		value: '"Trebuchet MS"',
	},
	{
		key: 'verdana',
		value: 'Verdana',
	},
	{
		key: 'fangSong',
		value: 'FangSong, Imitation Song, FZFangSong-Z02S, STFangsong, fangsong',
	},
	{
		key: 'stFangsong',
		value: 'STFangsong, Chinese imitation Song, FangSong, FZFangSong-Z02S, fangsong',
	},
	{
		key: 'stSong',
		value: 'STSong, Chinese Song Ti, SimSun, "Songti SC", NSimSun, serif',
	},
	{
		key: 'stKaiti',
		value: 'STKaiti, KaiTi, KaiTi, "Kaiti SC", cursive',
	},
	{
		key: 'simSun',
		value: 'SimSun, Song Ti, "Songti SC", NSimSun, STSong, serif',
	},
	{
		key: 'microsoftYaHei',
		value: '"Microsoft YaHei", Microsoft YaHei, "PingFang SC", SimHei, STHeiti, sans-serif;',
	},
	{
		key: 'kaiTi',
		value: 'KaiTi, Kaiti, STKaiti, "Kaiti SC", cursive',
	},
	{
		key: 'kaitiSC',
		value: '"Kaiti SC"',
	},
	{
		key: 'simHei',
		value: 'SimHei, boldface, "Microsoft YaHei", "PingFang SC", STHeiti, sans-serif',
	},
	{
		key: 'heitiSC',
		value: '"Heiti SC"',
	},
	{
		key: 'fzHei',
		value: 'FZHei-B01S',
	},
	{
		key: 'fzKai',
		value: 'FZKai-Z03S',
	},
	{
		key: 'fzFangSong',
		value: 'FZFangSong-Z02S',
	},
];
```

We can organize the data according to the default data format, and then use the `fontfamily` method to generate the data needed for the drop-down list, and finally overwrite the configuration of the toolbar

```ts
items: [
	['collapse'],
	[
		{
			name: 'fontfamily',
			items: fontfamily(fontFamilyDefaultData),
		},
	],
];
```

## Command

```ts
//font: changed font
engine.command.execute('fontfamily', color);
//Use command to query the current state, return Array<string> | undefined, the font value collection where the cursor is currently located
engine.command.queryState('fontfamily');
```

## Other

Whether the font is available is judged by setting different fonts on the HTML tags, and then detecting the change in the width of the HTML tags and comparing them with the default font

```ts
/**
 * Whether to support fonts
 * @param font font name
 * @returns
 */
export const isSupportFontFamily = (font: string) => {
	if (typeof font !== 'string') {
		console.log('Font name is not legal !');
		return false;
	}

	let width;
	const body = document.body;

	const container = document.createElement('span');
	container.innerHTML = Array(10).join('wi');
	container.style.cssText = [
		'position:absolute',
		'width:auto',
		'font-size:128px',
		'left:-99999px',
	].join(' !important;');

	const getWidth = (fontFamily: string) => {
		container.style.fontFamily = fontFamily;
		body.appendChild(container);
		width = container.clientWidth;
		body.removeChild(container);

		return width;
	};

	const monoWidth = getWidth('monospace');
	const serifWidth = getWidth('serif');
	const sansWidth = getWidth('sans-serif');

	return (
		monoWidth !== getWidth(font + ',monospace') ||
		sansWidth !== getWidth(font + ',sans-serif') ||
		serifWidth !== getWidth(font + ',serif')
	);
};
```
