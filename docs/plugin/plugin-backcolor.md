# @aomao/plugin-backcolor

Background color plugin

## Installation

```bash
$ yarn add @aomao/plugin-backcolor
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Backcolor from'@aomao/plugin-backcolor';

new Engine(...,{ plugins:[Backcolor] })
```

## Optional

### Hotkey

No shortcut keys by default

```ts
//Shortcut keys, key combination keys, args, execution parameters, [color,defaultColor?], color is required, defaultColor is optional
hotkey?:{key:string,args:Array<string>};//default none

//Use configuration
new Engine(...,{
    config:{
        "backcolor":{
            //Modify shortcut keys
            hotkey:{
                key:"mod+b",
                args:["#000000","#ffffff"]
            }
        }
    }
 })
```

## Command

```ts
//color: the changed background color, defaultColor: the default background color to keep, modify the background color when the defaultColor is not passed in or the color is different from the defaultColor value
engine.command.execute('backcolor', color, defaultColor);
//Use command to query the current state, return Array<string> | undefined, the background color value set where the cursor is currently located
engine.command.queryState('backcolor');
```
