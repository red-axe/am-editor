# @aomao/plugin-table

表格插件

## 安装

```bash
$ yarn add @aomao/plugin-table
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Table, { TableComponent } from '@aomao/plugin-table';

new Engine(...,{ plugins:[Table] , cards:[TableComponent]})
```

## 可选项

### 快捷键

默认无快捷键

```ts
//快捷键，key 组合键，args，执行参数，[rows?: string, cols?: string] 行数：默认3行，列数：默认3列
hotkey?:string | {key:string,args:Array<string>};//默认无

//使用配置
new Engine(...,{
    config:{
        "table":{
            //修改快捷键
            hotkey:{
                key:"mod+t",
                args:[5,5]
            }
        }
    }
 })
```

### 溢出展示

```ts
overflow?: {
    // 相对编辑器左侧最大能展示的宽度
    maxLeftWidth?: () => number;
    // 相对于编辑器右侧最大能展示的宽度
    maxRightWidth?: () => number;
};
```

### 最小列宽

```ts
colMinWidth: number; //默认40
```

### 最小行高

```ts
rowMinHeight: number; //默认30
```

### 一次最大插入的行/列

```ts
maxInsertNum: number; //默认50
```

## 命令

```ts
//可携带两个参数，行数，列数，都是可选的
engine.command.execute('table', 5, 5);
```
