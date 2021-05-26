# Command

Execute plugin commands

Type: `CommandInterface`

## Constructor

```ts
new (editor: EditorInterface): CommandInterface
```

## Method

### `queryEnabled`

Query whether there is a command to enable the specified plug-in

```ts
queryEnabled(name: string): boolean;
```

### `queryState`

Check plug-in status

```ts
queryState(name: string, ...args: any): any;
```

### `execute`

Execute plugin commands

```ts
execute(name: string, ...args: any): any;
```
