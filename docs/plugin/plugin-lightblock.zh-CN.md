# @aomao/plugin-lightblock

高亮块、提示框插件(React)

## 安装

```bash
yarn add @aomao/plugin-lightblock
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import lightblock from '@aomao/plugin-lightblock';

new Engine(...,{ plugins:[lightblock] })
```

## 命令

```ts
//使用 command 执行插件
engine.command.execute('lightblock');
```

## markdown

```ts
// 支持markdown快捷语法
::: tip
```
