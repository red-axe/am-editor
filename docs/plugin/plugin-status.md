# @aomao/plugin-status

Status plugin

## Install

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

### Hotkey

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

```ts
new Engine(...,{
    config:{
        "status":{
            colors: Array<{
background: string,
color: string
}>
        }
    }
})
```

-`background` background color -`color` font color

```ts
//Default color list
[
	{
		background: '#FFE8E6',
		color: '#820014',
	},
	{
		background: '#FCFCCA',
		color: '#614700',
	},
	{
		background: '#E4F7D2',
		color: '#135200',
	},
	{
		background: '#E9E9E9',
		color: '#595959',
	},
	{
		background: '#D4EEFC',
		color: '#003A8C',
	},
	{
		background: '#DEE8FC',
		color: '#061178',
	},
];
```

## Order

```ts
engine.command.execute('status');
```
