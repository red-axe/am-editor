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

### Hotkey

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

### Overflow display, `enableScroll` needs to be turned on to take effect

```ts
overflow?: {
     // Relative to the maximum displayable width on the left side of the editor
     maxLeftWidth?: () => number;
     // Relative to the maximum displayable width on the right side of the editor
     maxRightWidth?: () => number;
};
```

### Minimum column width

```ts
colMinWidth: number; //default 40
```

### Minimum line height

```ts
rowMinHeight: number; //default 30
```

### Maximum row/column inserted at a time

```ts
maxInsertNum: number; //default 50
```

### Whether to enable the scroll bar

```ts
enableScroll: boolean; //default true
```

## Command

```ts
//Can carry two parameters, the number of rows and the number of columns, all are optional
engine.command.execute('table', 5, 5);
```
