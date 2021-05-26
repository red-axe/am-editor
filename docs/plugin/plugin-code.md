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

### hot key

The default shortcut key is `mod+e`, and multiple shortcut keys are passed in as an array

```ts
//hot key,
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

### Markdown

Support markdown by default, pass in `false` to close

Code plugin markdown syntax is `` `

```ts
markdown?: boolean;//enabled by default, false off
//Use configuration
new Engine(...,{
    config:{
        "code":{
            //Close markdown
            markdown:false
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
