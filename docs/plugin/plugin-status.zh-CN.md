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

`colors` 是 `StatusComponent` 的静态属性，它的类型如下：

```ts
static colors: Array<{
    background: string,
    color: string,
    border?: string
}>
```

-   `background` 背景颜色
-   `color` 字体颜色
-   `border` 可选，在颜色列表中可以设置边框颜色，除了可以美化外，在比较接近白色的色块中可能肉眼不好观察到，也可以设置边框

```ts
//默认颜色列表
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

## 命令

```ts
engine.command.execute('status');
```
