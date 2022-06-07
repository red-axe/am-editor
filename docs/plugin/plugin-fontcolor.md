# @aomao/plugin-fontcolor

Foreground plugin

## Installation

```bash
$ yarn add @aomao/plugin-fontcolor
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Fontcolor from'@aomao/plugin-fontcolor';

new Engine(...,{ plugins:[Fontcolor] })
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
        "fontcolor":{
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
//color: the changed foreground color, defaultColor: the default foreground color to be maintained, the foreground color modification is performed when the defaultColor is not passed in or the color is different from the defaultColor value
engine.command.execute('fontcolor', color, defaultColor);
//Use command to query the current state, return Array<string> | undefined, the foreground color value set where the cursor is currently located
engine.command.queryState('fontcolor');
```
