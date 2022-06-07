# @aomao/plugin-line-height

Row height plugin

## Installation

```bash
$ yarn add @aomao/plugin-line-height
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Lineheight from'@aomao/plugin-line-height';

new Engine(...,{ plugins:[Lineheight] })
```

## Optional

### Paste filter custom line height

Supports filtering the row height that does not meet the custom

```ts
/**
 * @param lineHeight current line height
 * @returns returns string to modify the current value, false is removed, true is retained
 * */
filter?: (lineHeight: string) => string | boolean
//Configuration
new Engine(...,{
    config:{
        [LineHeihgt.pluginName]: {
            //Configure the row height to be filtered after pasting
            filter: (lineHeight: string) => {
                if(lineHeight === "14px") return "1"
                if(lineHeight === "16px") return "1.15"
                if(lineHeight === "21px") return "1.5"
                if(lineHeight === "28px") return "2"
                if(lineHeight === "35px") return "2.5"
                if(lineHeight === "42px") return "3"
                return ["1","1.15","1.5","2","2.5","3"].indexOf(lineHeight)> -1
            }
        }
    }
}
```

### Hotkey

No shortcut keys by default

```ts
//Shortcut keys, key combination keys, args, execution parameters, [lineHeight], lineHeight are optional, delete the line height at the current cursor position without passing a value
hotkey?:{key:string,args:Array<string>};//default none

//Use configuration
new Engine(...,{
    config:{
        "line-height":{
            //Modify shortcut keys
            hotkey:{
                key:"mod+b",
                args:["2"]
            }
        }
    }
 })
```

## Command

```ts
//lineHeight: changed line height
engine.command.execute('line-height', lineHeight);
//Use command to query the current state, return Array<string> | undefined, the set of high values ​​at the current cursor position
engine.command.queryState('line-height');
```
