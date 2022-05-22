# @aomao/plugin-hr

分割线插件

## 安装

```bash
$ yarn add @aomao/plugin-hr
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Hr , { HrComponent } from '@aomao/plugin-hr';

new Engine(...,{ plugins:[Hr] , cards:[HrComponent]})
```

## 可选项

### 快捷键

默认快捷键 `mod+shift+e`

```ts
hotkey?:string;//默认mod+shift+e

//使用配置
new Engine(...,{
    config:{
        "hr":{
            //修改快捷键
            hotkey:"快捷键"
        }
    }
 })
```

## 命令

```ts
engine.command.execute('hr');
```
