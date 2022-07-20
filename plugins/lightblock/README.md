# @aomao/plugin-lightblock

高亮块、提示框插件

## 安装

```bash
$ yarn add @aomao/plugin-lightblock
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import lightblock from '@aomao/plugin-lightblock';

new Engine(...,{ plugins:[lightblock] })
```

## 可选项

### 快捷键

默认快捷键为 `mod+shift+0`

```ts
//快捷键
hotkey?: string | Array<string>;
//使用配置
new Engine(...,{
    config:{
        "lightblock":{
            //修改快捷键
            hotkey:"快捷键"
        }
    }
 })
```

## 命令

```ts
//使用 command 执行插件
engine.command.execute('lightblock');
```
