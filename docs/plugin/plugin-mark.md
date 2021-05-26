# @aomao/plugin-mark

Markup style plugin

## Installation

```bash
$ yarn add @aomao/plugin-mark
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Mark from'@aomao/plugin-mark';

new Engine(...,{ plugins:[Mark] })
```

## Optional

### hot key

The default shortcut key is none, and multiple shortcut keys are passed in as an array

```ts
//hot key,
hotkey?: string | Array<string>;

//Use configuration
new Engine(...,{
    config:{
        "mark":{
            //Modify shortcut keys
            hotkey: "shortcut key"
        }
    }
 })
```

### Markdown

Support markdown by default, pass in `false` to close

The markdown syntax of the Mark plug-in is `==`

```ts
markdown?: boolean;//enabled by default, false off
//Use configuration
new Engine(...,{
    config:{
        "mark":{
            //Close markdown
            markdown:false
        }
    }
 })
```

## Command

```ts
engine.command.execute('mark');
//Use command to execute query current status, return boolean | undefined
engine.command.queryState('orderedlist');
```
