# @aomao/plugin-hr

Split line plugin

## Installation

```bash
$ yarn add @aomao/plugin-hr
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Hr, {HrComponent} from'@aomao/plugin-hr';

new Engine(...,{ plugins:[Hr], cards:[HrComponent]})
```

## Optional

### hot key

Default shortcut key `mod+shift+e`

```ts
hotkey?:string;//default mod+shift+e

//Use configuration
new Engine(...,{
     config:{
         "hr":{
             //Modify shortcut keys
             hotkey: "shortcut key"
         }
     }
  })
```

### Markdown

Support markdown by default, pass in `false` to close

Hr plugin markdown syntax is `---`

```ts
markdown?: boolean;//enabled by default, false off
//Use configuration
new Engine(...,{
     config:{
         "hr":{
             //Close markdown
             markdown:false
         }
     }
  })
```

## Command

```ts
//Can carry two parameters, language type, default text, all are optional
engine.command.execute('hr');
```
