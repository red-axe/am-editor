# 命令

执行插件命令

类型：`CommandInterface`

通过引擎实例获取命令实例：

```ts
engine.command;
```

## 构造函数

```ts
new (editor: EditorInterface): CommandInterface
```

## 方法

### `queryEnabled`

查询是否有启用指定插件命令

```ts
queryEnabled(name: string): boolean;
```

### `queryState`

查询插件状态

```ts
queryState(name: string, ...args: any): any;
```

### `execute`

执行插件命令，参数为插件约定好的参数，可在插件列表中查看每个插件所需要的参数

如果执行命令时，编辑器未 focus，则会自动 focus 到上次 blur 时的位置

```ts
execute(name: string, ...args: any): any;
```

### `executeMethod`

单纯的执行插件方法，需要保证插件中有定义需要调用的方法。与 `execute` 的区别：`execute` 方法主要对编辑器有所更改

```ts
executeMethod(name: string, method: string, ...args: any): any;
```
