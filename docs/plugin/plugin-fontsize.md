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

### Font size list

Support custom font size list, incoming list, or key-value pair

```ts
/**
 * You can specify the font size list ["12px","14px","15px"]
 * Or set an alias for the font size {"9pt":"12px","10pt":"13px"}
 * Filter when pasting. If the list conditions are not met, the font size style will be removed.
 * */
data?:Array<string> | {[key:string]:string}
```

### Default font size

```ts
defaultSize?:string //The default is 14px
```

### hot key

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
