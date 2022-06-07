# Command

Execute plugin commands

Type: `CommandInterface`

## Constructor

```ts
new (editor: EditorInterface): CommandInterface
```

## Method

### `queryEnabled`

Query whether there is a command to enable the specified plugin

```ts
queryEnabled(name: string): boolean;
```

### `queryState`

Check plugin status

```ts
queryState(name: string, ...args: any): any;
```

### `execute`

Execute the plugin command. The parameters are the parameters agreed by the plugin. You can view the parameters required by each plugin in the plugin list.

If the editor is not focused when the command is executed, it will automatically focus to the position of the last blur

```ts
execute(name: string, ...args: any): any;
```

### `executeMethod`

To simply execute the plugin method, you need to ensure that there are methods defined in the plugin that need to be called. The difference with `execute`: the `execute` method mainly changes the editor

```ts
executeMethod(name: string, method: string, ...args: any): any;
```
