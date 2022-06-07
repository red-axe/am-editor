# @aomao/plugin-indent

Indentation plugin

## Installation

```bash
$ yarn add @aomao/plugin-indent
```

Add to engine

This plugin is recommended to be added first to prevent other plugins from intercepting the event and making it unable to take effect

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Indent from'@aomao/plugin-indent';

new Engine(...,{ plugins:[Indent] })
```

## Optional

### Hotkey

Default indentation shortcut `mod+]`

Delete indentation shortcut key `mod+[` by default

```ts
//hotkey,
hotkey?: {
    in?:string //Indentation shortcut key, default mod+]
    out?:string //Delete indentation shortcut key, default mod+[
};

//Use configuration
new Engine(...,{
    config:{
        "indent":{
            //Modify shortcut keys
            hotkey:{
                "in":"shortcut key",
                "out": "shortcut key"
            }
        }
    }
 })
```

### Maximum padding

Maximum padding, each indentation is 2

```ts
maxPadding?:number
```

## Command

One parameter defaults to `in`, optional value is `in` to increase indentation, and `out` to decrease indentation

```ts
engine.command.execute('indent');
//Use command to execute query current status, return numbber, current indentation value
engine.command.queryState('indent');
```
