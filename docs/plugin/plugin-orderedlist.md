# @aomao/plugin-orderedlist

Ordered list plugin

## Installation

```bash
$ yarn add @aomao/plugin-orderedlist
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Orderedlist from'@aomao/plugin-orderedlist';

new Engine(...,{ plugins:[Orderedlist] })
```

## Optional

### hot key

Default shortcut key `mod+shift+7`

```ts
//hot key
hotkey?: string | Array<string>;//default mod+shift+7
//Use configuration
new Engine(...,{
    config:{
        "orderedlist":{
            //Modify shortcut keys
            hotkey: "shortcut key"
        }
    }
 })
```

### Markdown

Support markdown by default, pass in `false` to close

The orderedlist plugin markdown syntax is `1.` serial number + dot

```ts
markdown?: boolean;//enabled by default, false off
//Use configuration
new Engine(...,{
    config:{
        "orderedlist":{
            //Close markdown
            markdown:false
        }
    }
 })
```

## Command

There is a parameter `start:number` which defaults to 1, which indicates the starting number of the list

```ts
//Use command to execute the plug-in and pass in the required parameters
engine.command.execute('orderedlist', 1);
//Use command to execute query current status, return false or current list plug-in name orderedlist tasklist unorderedlist
engine.command.queryState('orderedlist');
```
