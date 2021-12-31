# @aomao/plugin-status

状态插件

## 安装

```bash
$ yarn add @aomao/plugin-status
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Status , { StatusComponent } from '@aomao/plugin-status';

new Engine(...,{ plugins:[Status] , cards:[StatusComponent]})
```

## 可选项

### 快捷键

默认无快捷键

```ts
hotkey?:string;

//使用配置
new Engine(...,{
    config:{
        "status":{
            //修改快捷键
            hotkey:"快捷键"
        }
    }
 })
```

### 自定义颜色

可以通过 `StatusComponent.colors` 修改或增加到默认颜色列表中

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

-   `background` 背景颜色
-   `color` 字体颜色

```ts
//默认颜色列表
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

## 命令

```ts
engine.command.execute('status');
```
