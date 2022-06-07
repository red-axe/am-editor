# @aomao/plugin-sup

Superscript style plugin

## Installation

```bash
$ yarn add @aomao/plugin-sup
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Sup from'@aomao/plugin-sup';

new Engine(...,{ plugins:[Sup] })
```

## Optional

### Hotkey

The default shortcut key is `mod+.`, multiple shortcut keys are passed in as an array

```ts
//hotkey,
hotkey?: string | Array<string>;

//Use configuration
new Engine(...,{
     config:{
         "sup":{
             //Modify shortcut keys
             hotkey: "shortcut key"
         }
     }
  })
```

## Command

```ts
engine.command.execute('sup');
//Use command to execute query current status, return boolean | undefined
engine.command.queryState('sup');
```
