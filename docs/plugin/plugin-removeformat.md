# @aomao/plugin-removeformat

Remove style plugin

Remove all mark tag plugins

Remove all block styles

## Installation

```bash
$ yarn add @aomao/plugin-removeformat
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Removeformat from'@aomao/plugin-removeformat';

new Engine(...,{ plugins:[Removeformat] })
```

## Optional

### Hotkey

The default shortcut key is `mod+\`

```ts
//hotkey
hotkey?: string | Array<string>;
//Use configuration
new Engine(...,{
     config:{
         "redo":{
             //Modify shortcut keys
             hotkey: "shortcut key"
         }
     }
  })
```

## Command

```ts
//Use command to execute the plugin
engine.command.execute('removeformat');
```
