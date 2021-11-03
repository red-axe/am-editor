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

### `executeMethod`

To simply execute the plug-in method, you need to ensure that there are methods defined in the plug-in that need to be called. The difference with `execute`: the `execute` method mainly changes the editor

```ts
executeMethod(name: string, method: string, ...args: any): any;
```
