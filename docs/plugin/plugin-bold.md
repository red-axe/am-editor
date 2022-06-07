# @aomao/plugin-bold

Bold style plugin

## Installation

```bash
$ yarn add @aomao/plugin-bold
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Bold from'@aomao/plugin-bold';

new Engine(...,{ plugins:[Bold] })
```

## Optional

### Hotkey

The default shortcut key is `mod+b`, and multiple shortcut keys are passed in as an array

```ts
//hotkey,
hotkey?: string | Array<string>;

//Use configuration
new Engine(...,{
    config:{
        "bold":{
            //Modify shortcut keys
            hotkey: "shortcut key"
        }
    }
 })
```

## Command

```ts
engine.command.execute('bold');
//Use command to execute query current status, return boolean | undefined
engine.command.queryState('bold');
```
