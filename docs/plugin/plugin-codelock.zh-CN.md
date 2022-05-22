# @aomao/plugin-codeblock

代码块插件

## 安装

```bash
$ yarn add @aomao/plugin-codeblock
```

`Vue3` 使用

```bash
$ yarn add @aomao/plugin-codeblock-vue
```

`Vue2` 使用

```bash
$ yarn add am-editor-codeblock-vue2
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import CodeBlock , { CodeBlockComponent } from '@aomao/plugin-codeblock';

new Engine(...,{ plugins:[CodeBlock] , cards:[CodeBlockComponent]})
```

## 可选项

### 快捷键

默认无快捷键

```ts
//快捷键，key 组合键，args，执行参数，[mode?: string, value?: string] 语言模式：可选，代码文本：可选
hotkey?:string | {key:string,args:Array<string>};//默认无

//使用配置
new Engine(...,{
    config:{
        "codeblock":{
            //修改快捷键
            hotkey:{
                key:"mod+b",
                args:["javascript","const test = 123;"]
            }
        }
    }
 })
```

### 别名

别名设置

```ts
//使用配置
new Engine(...,{
    config:{
        "alias":{
            text: 'plain',
            sh: 'bash',
            ts: 'typescript',
            js: 'javascript',
            py: 'python',
            puml: 'plantuml',
            uml: 'plantuml',
            vb: 'basic',
            md: 'markdown',
            'c++': 'cpp',
            'c#': 'csharp',
        }
    }
 })
```

## 命令

```ts
//可携带两个参数，语言类型，默认文本，都是可选的
engine.command.execute('codeblock', 'javascript', 'const test = 123;');
```
