# @aomao/plugin-fontsize

Font size plugin

## Installation

```bash
$ yarn add @aomao/plugin-fontsize
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Fontsize from'@aomao/plugin-fontsize';

new Engine(...,{ plugins:[Fontsize] })
```

## Optional

### Paste filter custom font size

Supports filtering of font sizes that do not meet the custom

```ts
/**
  * @param fontSize current font size
  * @returns returns string to modify the current value, false is removed, true is retained
  * */
filter?: (fontSize: string) => string | boolean
//Configuration
new Engine(...,{
     config:{
         [Fontsize.pluginName]: {
             //Configure the font size to be filtered after pasting
             filter: (fontSize: string) => {
                 return ["12px","13px","14px","15px","16px","19px","22px","24px","29px","32px","40px","48px"] .indexOf(fontSize)> -1
             }
         }
     }
}
```

### Default font size

```ts
defaultSize?:string //The default is 14px
```

### Hotkey

No shortcut keys by default

```ts
//Shortcut keys, key combination keys, args, execution parameters, [size,defaultSize?], size is required, defaultSize is optional
hotkey?:{key:string,args:Array<string>};//default none

//Use configuration
new Engine(...,{
    config:{
        "fontsize":{
            //Modify shortcut keys
            hotkey:{
                key:"mod+b",
                args:["12px","14px"]
            }
        }
    }
 })
```

## Command

```ts
//size: the font size to be changed, defaultSize: the default font size to be maintained, the foreground color modification is performed when the defaultSize is not passed in or the size is different from the defaultSize value
engine.command.execute('fontsize', size, defaultSize);
//Use command to query the current state, return Array<string> | undefined, the font size value collection where the cursor is currently located
engine.command.queryState('fontsize');
```
