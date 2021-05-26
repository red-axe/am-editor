---
translateHelp: true
---

# 命令

执行插件命令

类型：`CommandInterface`

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

执行插件命令

```ts
execute(name: string, ...args: any): any;
```
