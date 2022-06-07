# @aomao/plugin-codeblock

Code block plugin

## Installation

```bash
$ yarn add @aomao/plugin-codeblock
```

`Vue3` use

```bash
$ yarn add @aomao/plugin-codeblock-vue
```

`Vue2` use

```bash
$ yarn add am-editor-codeblock-vue2
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import CodeBlock, {CodeBlockComponent} from'@aomao/plugin-codeblock';

new Engine(...,{ plugins:[CodeBlock], cards:[CodeBlockComponent]})
```

## Optional

### Hotkey

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

### Alias

Alias settings

```ts
//Use configuration
new Engine(...,{
     config:{
         "alias":{
             text:'plain',
             sh:'bash',
             ts:'typescript',
             js:'javascript',
             py:'python',
             puml:'plantuml',
             uml:'plantuml',
             vb:'basic',
             md:'markdown',
             'c++':'cpp',
             'c#':'csharp',
         }
     }
  })
```

## Command

```ts
//Can carry two parameters, language type, default text, all are optional
engine.command.execute('codeblock', 'javascript', 'const test = 123;');
```
