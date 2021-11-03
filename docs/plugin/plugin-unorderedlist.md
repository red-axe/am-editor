# @aomao/plugin-unorderedlist

Unordered list plugin

## Installation

```bash
$ yarn add @aomao/plugin-unorderedlist
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Unorderedlist from'@aomao/plugin-unorderedlist';

new Engine(...,{ plugins:[Unorderedlist] })
```

## Optional

### hot key

Default shortcut key `mod+shift+8`

```ts
//hot key
hotkey?: string | Array<string>;//default mod+shift+8
//Use configuration
new Engine(...,{
    config:{
        "unorderedlist":{
            //Modify shortcut keys
            hotkey: "shortcut key"
        }
    }
 })
```

### Markdown

Support markdown by default, pass in `false` to close

Unorderedlist plugin markdown syntax is `*`, `-`, `+`

```ts
markdown?: boolean;//enabled by default, false off
//Use configuration
new Engine(...,{
    config:{
        "unorderedlist":{
            //Close markdown
            markdown:false
        }
    }
 })
```

## Command

```ts
//Use command to execute the plug-in and pass in the required parameters
engine.command.execute('unorderedlist');
//Use command to execute query current status, return false or current list plug-in name unorderedlist tasklist unorderedlist
engine.command.queryState('unorderedlist');
```
