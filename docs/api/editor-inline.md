# InlineModel

Edit related operations of in-line nodes

Type: `InlineModelInterface`

## Use

```ts
new Engine(...).inline
```

## Constructor

```ts
new (editor: EditorInterface): InlineModelInterface
```

## Method

### `init`

initialization

```ts
/**
 * Initialization
 */
init(): void;
```

### `closest`

Get the nearest Inline node, the return node cannot be found

```ts
/**
 * Get the nearest Inline node, the return node cannot be found
 */
closest(node: NodeInterface): NodeInterface;
```

### `closestNotInline`

Get the first non-inline node up

```ts
/**
 * Get the first non-inline node up
 */
closestNotInline(node: NodeInterface): NodeInterface;
```

### `wrap`

Add an inline package to the current cursor node

```ts
/**
 * Add an inline package to the current cursor node
 * @param inline inline tag
 * @param range cursor, get the current cursor by default
 */
wrap(inline: NodeInterface | Node | string, range?: RangeInterface): void;
```

### `unwrap`

Remove inline package

```ts
/**
 * Remove inline package
 * @param range cursor, the current editor cursor is the default, or the inline node that needs to be removed
 */
unwrap(range?: RangeInterface | NodeInterface): void;
```

### `insert`

Insert inline tag

```ts
/**
 * Insert inline tag
 * @param inline inline tag
 * @param range cursor
 */
insert(inline: NodeInterface | Node | string, range?: RangeInterface): void;
```

### `split`

Split inline tags

```ts
/**
 * Split inline tags
 * @param range cursor, get the current cursor by default
 */
split(range?: RangeInterface): void;
```

### `findInlines`

Get all inline tags within the cursor

```ts
/**
 * Get all inline tags within the cursor
 * @param range cursor
 */
findInlines(range: RangeInterface): Array<NodeInterface>;
```

### `repairCursor`

Fix inline node cursor placeholder

```ts
/**
 * Fix cursor placeholder for inline node
 * @param node inlne node
 */
repairCursor(node: NodeInterface | Node): void;
```

### `repairRange`

Fix the cursor selection position, &#8203;<a>&#8203;<anchor />acde<focus />&#8203;</a>&#8203; -><anchor />&#8203;<a> &#8203;acde&#8203;</a>&#8203;<focus />

```ts
/**
 * Fix the cursor selection position, &#8203;<a>&#8203;<anchor />acde<focus />&#8203;</a>&#8203; -><anchor />&#8203;<a >&#8203;acde&#8203;</a>&#8203;<focus />
 * Otherwise, in ot, the &#8203; changes on both sides of the inline node may not be applied correctly
 */
repairRange(range?: RangeInterface): RangeInterface;
```
