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

Execute the plug-in command. The parameters are the parameters agreed by the plug-in. You can view the parameters required by each plug-in in the plug-in list.

If the editor is not focused when the command is executed, it will automatically focus to the position of the last blur

```ts
execute(name: string, ...args: any): any;
```

### `executeMethod`

To simply execute the plug-in method, you need to ensure that there are methods defined in the plug-in that need to be called. The difference with `execute`: the `execute` method mainly changes the editor

```ts
executeMethod(name: string, method: string, ...args: any): any;
```
