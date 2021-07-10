# @aomao/plugin-fontfamily

字体插件

## 安装

```bash
$ yarn add @aomao/plugin-fontfamily
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Fontfamily from '@aomao/plugin-fontfamily';

new Engine(...,{ plugins:[Fontfamily] })
```

## 可选项

### 粘贴过滤自定义字体

支持过滤不符合自定义的字体

```ts
/**
 * @param fontFamily 当前字体
 * @returns 返回 string 修改当前值，false 移除，true 保留
 * */
filter?: (fontFamily: string) => string | boolean
//配置
new Engine(...,{
    config:{
        [Fontfamily.pluginName]: {
            //配置粘贴后需要过滤的字体
            filter: (fontfamily: string) => {
                // fontFamilyDefaultData 从toolbar包中导出的默认字体数据
                const item = fontFamilyDefaultData.find(item => fontfamily.split(",").some(name => item.value.toLowerCase().indexOf(name.replace(/"/,"").toLowerCase()) > -1))
                return item ? item.value : false
            }
        }
    }
}
```

### 快捷键

默认无快捷键

```ts
//快捷键，key 组合键，args，执行参数，[font] ， font 必须
hotkey?:{key:string,args:Array<string>};//默认无

//使用配置
new Engine(...,{
    config:{
        "fontfamily":{
            //修改快捷键
            hotkey:{
                key:"mod+b",
                args:["微软雅黑"]
            }
        }
    }
 })
```

### 自定义字体

工具栏中内置了部分字体列表，可以通过以下方法获取

```ts
import { fontFamilyDefaultData, fontfamily } from '@aomao/toolbar'; // 或 @aomao/toolbar-vue
```

#### `fontfamily` 转换可用的下拉列表数据

```ts
/**
 * 生成字体下拉列表项
 * @param data key-value 键值对数据，key 名称，如果有传语言则是语言键值对的key否则就直接显示
 * @param language 语言，可选
 */
fontfamily(
	data: Array<{ key: string; value: string }>,
	language?: { [key: string]: string },
): Array<DropdownListItem>
```

#### `fontFamilyDefaultData` 默认字体列表

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
		value: 'FangSong, 仿宋, FZFangSong-Z02S, STFangsong, fangsong',
	},
	{
		key: 'stFangsong',
		value: 'STFangsong, 华文仿宋, FangSong, FZFangSong-Z02S, fangsong',
	},
	{
		key: 'stSong',
		value: 'STSong, 华文宋体, SimSun, "Songti SC", NSimSun, serif',
	},
	{
		key: 'stKaiti',
		value: 'STKaiti, 华文楷体, KaiTi, "Kaiti SC", cursive',
	},
	{
		key: 'simSun',
		value: 'SimSun, 宋体, "Songti SC", NSimSun, STSong, serif',
	},
	{
		key: 'microsoftYaHei',
		value: '"Microsoft YaHei", 微软雅黑, "PingFang SC", SimHei, STHeiti, sans-serif;',
	},
	{
		key: 'kaiTi',
		value: 'KaiTi, 楷体, STKaiti, "Kaiti SC", cursive',
	},
	{
		key: 'kaitiSC',
		value: '"Kaiti SC"',
	},
	{
		key: 'simHei',
		value: 'SimHei, 黑体, "Microsoft YaHei", "PingFang SC", STHeiti, sans-serif',
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

我们可以按照默认数据的格式整理好数据，然后使用 `fontfamily` 方法生成下拉列表所需要的数据，最后覆盖工具栏的配置

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

## 命令

```ts
//font：更改的字体
engine.command.execute('fontfamily', color);
//使用 command 执行查询当前状态，返回 Array<string> | undefined，当前光标所在处字体值集合
engine.command.queryState('fontfamily');
```

## 其它

字体是否可用，是通过设置不同字体到 HTML 标签上，然后检测 HTML 标签的宽度变化与默认字体对比来判断的

```ts
/**
 * 是否支持字体
 * @param font 字体名称
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
