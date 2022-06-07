# @aomao/plugin-code

Inline code style plugin

## Installation

```bash
$ yarn add @aomao/plugin-code
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Code from'@aomao/plugin-code';

new Engine(...,{ plugins:[Code] })
```

## Optional

### Hotkey

The default shortcut key is `mod+e`, and multiple shortcut keys are passed in as an array

```ts
//hotkey,
hotkey?: string | Array<string>;

//Use configuration
new Engine(...,{
    config:{
        "code":{
            //Modify shortcut keys
            hotkey: "shortcut key"
        }
    }
 })
```

## Command

```ts
engine.command.execute('code');
//Use command to execute query current status, return boolean | undefined
engine.command.queryState('code');
```
