# @aomao/plugin-sub

Subscript style plugin

## Installation

```bash
$ yarn add @aomao/plugin-sub
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Sub from'@aomao/plugin-sub';

new Engine(...,{ plugins:[Sub] })
```

## Optional

### hot key

The default shortcut key is `mod+,`, multiple shortcut keys are passed in as an array

```ts
//hot key,
hotkey?: string | Array<string>;

//Use configuration
new Engine(...,{
     config:{
         "sub":{
             //Modify shortcut keys
             hotkey: "shortcut key"
         }
     }
  })
```

### Markdown

Support markdown by default, pass in `false` to close

Sub plugin markdown syntax is `~`

```ts
markdown?: boolean;//enabled by default, false off
//Use configuration
new Engine(...,{
     config:{
         "sub":{
             //Close markdown
             markdown:false
         }
     }
  })
```

## Command

```ts
engine.command.execute('sub');
//Use command to execute query current status, return boolean | undefined
engine.command.queryState('sub');
```
