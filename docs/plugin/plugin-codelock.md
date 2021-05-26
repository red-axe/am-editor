# @aomao/plugin-codeblock

Code block plugin

## Installation

```bash
$ yarn add @aomao/plugin-codeblock
```

`Vue` use

```bash
$ yarn add @aomao/plugin-codeblock-vue
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import CodeBlock, {CodeBlockComponent} from'@aomao/plugin-codeblock';

new Engine(...,{ plugins:[CodeBlock], cards:[CodeBlockComponent]})
```

## Optional

### hot key

No shortcut keys by default

```ts
//Shortcut keys, key combination keys, args, execution parameters, [mode?: string, value?: string] Language mode: optional, code text: optional
hotkey?:string | {key:string,args:Array<string>};//default none

//Use configuration
new Engine(...,{
    config:{
        "codeblock":{
            //Modify shortcut keys
            hotkey:{
                key:"mod+b",
                args:["javascript","const test = 123;"]
            }
        }
    }
 })
```

### Markdown

Support markdown by default, pass in `false` to close

CodeBlock plugin markdown syntax is ```

```ts
markdown?: boolean;//enabled by default, false off
//Use configuration
new Engine(...,{
    config:{
        "codeblock":{
            //Close markdown
            markdown:false
        }
    }
 })
```

## Command

```ts
//Can carry two parameters, language type, default text, all are optional
engine.command.execute('codeblock', 'javascript', 'const test = 123;');
```
