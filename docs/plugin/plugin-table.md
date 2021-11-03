# @aomao/plugin-table

Form plugin

## Installation

```bash
$ yarn add @aomao/plugin-table
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Table, {TableComponent} from'@aomao/plugin-table';

new Engine(...,{ plugins:[Table], cards:[TableComponent]})
```

## Optional

### hot key

No shortcut keys by default

```ts
//Shortcut keys, key combination keys, args, execution parameters, [rows?: string, cols?: string] Number of rows: default 3 rows, number of columns: default 3 columns
hotkey?:string | {key:string,args:Array<string>};//default none

//Use configuration
new Engine(...,{
     config:{
         "table":{
             //Modify shortcut keys
             hotkey:{
                 key:"mod+t",
                 args:[5,5]
             }
         }
     }
  })
```

## Command

```ts
//Can carry two parameters, the number of rows and the number of columns, all are optional
engine.command.execute('table', 5, 5);
```
