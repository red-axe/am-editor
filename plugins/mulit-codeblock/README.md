# @aomao/plugin-mulit-codeblock

多功能代码块组件(React)

## 安装

```bash
$ yarn add @aomao/plugin-mulit-codeblock
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import mulit_codeblock from '@aomao/plugin-mulit-codeblock';

new Engine(...,{ plugins:{
	[mulit_codeblock]: {
		/* 支持的语言 查看 https://codemirror.net/5/mode/index.html */
		language: [] // 配置语言
	}
}})
```

## 命令

```ts
//使用 command 执行插件
engine.command.execute('mulit_codeblock');

/*
	::: code 
	::: code(javascript,html,css) 可以实现快捷插入
*/
```
