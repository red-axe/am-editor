# Hotkey

Editor hotkeys/shortcut keys

Type: `HotkeyInterface`

## Constructor

```ts
new (engine: EngineInterface): HotkeyInterface
```

## Method

### `trigger`

Trigger a keyboard event

```ts
trigger(e: KeyboardEvent): void;
```

### `enable`

Enable shortcut keys

```ts
enable(): void;
```

### `disable`

Disable shortcut keys

```ts
disable(): void;
```

### `destroy`

destroy

```ts
destroy(): void;
```
