# Change Range

Editor to change cursor related operations

Type: `ChangeRangeInterface`

## method

### `get`

Get the range of the current selection

```ts
/**
  * Get the range of the current selection
  */
get(): RangeInterface;
```

### `toTrusty`

Obtain a safe and controllable cursor object

```ts
/**
  * Obtain a safe and controllable cursor object
  * @param range default current cursor
  */
toTrusty(range?: RangeInterface): RangeInterface;
```

### `select`

Select the specified range

```ts
/**
  * Select the specified range
  * @param range cursor
  */
select(range: RangeInterface): void;
```

### `focus`

Focus editor

```ts
/**
  * Focus editor
  * @param toStart true: start position, false: end position, the default is the previous operation position
  */
focus(toStart?: boolean): void;
```

### `blur`

Cancel focus

```ts
/**
  * Cancel focus
  */
blur(): void;
```
