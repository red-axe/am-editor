# 热键

编辑器热键/快捷键

类型：`HotkeyInterface`

## 构造函数

```ts
new (engine: EngineInterface): HotkeyInterface
```

## 方法

### `trigger`

触发一个键盘事件

```ts
trigger(e: KeyboardEvent): void;
```

### `enable`

启用快捷键

```ts
enable(): void;
```

### `disable`

禁用快捷键

```ts
disable(): void;
```

### `destroy`

销毁

```ts
destroy(): void;
```
