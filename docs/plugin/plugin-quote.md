# @aomao/plugin-quote

Quote style plugin

## Installation

```bash
$ yarn add @aomao/plugin-quote
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Quote from'@aomao/plugin-quote';

new Engine(...,{ plugins:[Quote] })
```

## Optional

### hot key

The default shortcut key is `mod+shift+u`

```ts
//hot key
hotkey?: string | Array<string>;
//Use configuration
new Engine(...,{
    config:{
        "quote":{
            //Modify shortcut keys
            hotkey: "shortcut key"
        }
    }
 })
```

## Command

```ts
//Use command to execute the plug-in and pass in the required parameters
engine.command.execute('quote');
//Use command to execute query current status, return boolean | undefined
engine.command.queryState('quote');
```
