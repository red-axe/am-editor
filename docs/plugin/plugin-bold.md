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

### hot key

The default shortcut key is `mod+b`, and multiple shortcut keys are passed in as an array

```ts
//hot key,
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

### Markdown

Support markdown by default, pass in `false` to close

The markdown syntax of the Bold plugin is `**`

```ts
markdown?: boolean;//enabled by default, false off
//Use configuration
new Engine(...,{
    config:{
        "bold":{
            //Close markdown
            markdown:false
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
