# @aomao/plugin-status

Status plugin

## Installation

```bash
$ yarn add @aomao/plugin-status
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Status, {StatusComponent} from'@aomao/plugin-status';

new Engine(...,{ plugins:[Status], cards:[StatusComponent]})
```

## Optional

### hot key

No shortcut keys by default

```ts
hotkey?:string;

//Use configuration
new Engine(...,{
    config:{
        "status":{
            //Modify shortcut keys
            hotkey: "shortcut key"
        }
    }
 })
```

### Custom color

Can be modified or added to the default color list through `StatusComponent.colors`

`colors` is a static property of `StatusComponent`, and its type is as follows:

```ts
static colors: Array<{
    background: string,
    color: string,
    border?: string
}>
```

-   `background` background color
-   `color` font color
-   `border` is optional. You can set the border color in the color list. In addition to beautification, it may not be visible to the naked eye in a color block that is close to white, and you can also set the border

```ts
//Default color list
[
	{
		background: '#FFE8E6',
		color: '#820014',
		border: '#FF4D4F',
	},
	{
		background: '#FCFCCA',
		color: '#614700',
		border: '#FFEC3D',
	},
	{
		background: '#E4F7D2',
		color: '#135200',
		border: '#73D13D',
	},
	{
		background: '#E9E9E9',
		color: '#595959',
		border: '#E9E9E9',
	},
	{
		background: '#D4EEFC',
		color: '#003A8C',
		border: '#40A9FF',
	},
	{
		background: '#DEE8FC',
		color: '#061178',
		border: '#597EF7',
	},
];
```

## Command

```ts
engine.command.execute('status');
```
