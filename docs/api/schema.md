# Schema

Type: `SchemaInterface`

## Attributes

### `data`

Set of all rule constraints

```ts
data: {
    blocks: Array<SchemaRule>;//Block-level nodes
    inlines: Array<SchemaRule>;//Inline node
    marks: Array<SchemaRule>;//Style node
    globals: {[key: string]: SchemaAttributes | SchemaStyle };//Global rules
};
```

## Method

### `add`

Increase rule constraints

```ts
/**
* Added rules, div tags are not allowed, div will be used as card
* When only type and attributes are used, they will be regarded as global attributes of this type, and will be merged with all other label attributes of the same type
* @param rules
*/
add(
    rules: SchemaRule | SchemaGlobal | Array<SchemaRule | SchemaGlobal>,
): void;
```

### `find`

Find rules

```ts
/**
 * Find rules
 * @param callback search condition
 */
find(callback: (rule: SchemaRule) => boolean): Array<SchemaRule>;
```

### `getType`

Get node type

```ts
/**
 * Get the node type
 * @param node node
 */
getType(node: NodeInterface):'block' |'mark' |'inline' | undefined;
```

### `checkNode`

Check whether the node conforms to a certain attribute rule

```ts
/**
 * Check whether the node conforms to a certain attribute rule
 * @param node node
 * @param attributes attribute rules
 */
checkNode(
    node: NodeInterface,
    attributes?: SchemaAttributes | SchemaStyle,
): boolean;
```

### `checkStyle`

Check whether the style value meets the node style rules

```ts
/**
 * Check whether the style value meets the node style rules
 * @param name node name
 * @param styleName style name
 * @param styleValue style value
 */
checkStyle(name: string, styleName: string, styleValue: string): boolean;
```

### `checkAttributes`

Check whether the value meets the rules of node attributes

```ts
/**
 * Check whether the value meets the rules of node attributes
 * @param name node name
 * @param attributesName attribute name
 * @param attributesValue attribute value
 */
checkAttributes(
    name: string,
    attributesName: string,
    attributesValue: string,
): boolean;
```

### `checkValue`

Check whether the value meets the rules

```ts
/**
 * Whether the detection value meets the rules
 * @param rule
 * @param attributesName attribute name
 * @param attributesValue attribute value
 */
checkValue(
    rule: SchemaAttributes | SchemaStyle,
    attributesName: string,
    attributesValue: string,
): boolean;
```

### `checkStyle`

Check whether the style value meets the node style rules

```ts
/**
 * Check whether the style value meets the node style rules
 * @param name node name
 * @param styleName style name
 * @param styleValue style value
 * @param type specifies the type
 */
checkStyle(
    name: string,
    styleName: string,
    styleValue: string,
    type?:'block' |'mark' |'inline',
): void;
```

### `checkAttributes`

Check whether the value meets the rules of node attributes

```ts
/**
 * Check whether the value meets the rules of node attributes
 * @param name node name
 * @param attributesName attribute name
 * @param attributesValue attribute value
 * @param type specifies the type
 */
checkAttributes(
    name: string,
    attributesName: string,
    attributesValue: string,
    type?:'block' |'mark' |'inline',
): void;
```

### `filterStyles`

Filter node style

```ts
/**
 * Filter node style
 * @param name node name
 * @param styles style
 * @param type specifies the type
 */
filterStyles(
    name: string,
    styles: {[k: string]: string },
    type?:'block' |'mark' |'inline',
): void;
```

### `filterAttributes`

Filter node attributes

```ts
/**
 * Filter node attributes
 * @param name node name
 * @param attributes
 * @param type specifies the type
 */
filterAttributes(
    name: string,
    attributes: {[k: string]: string },
    type?:'block' |'mark' |'inline',
): void;
```

### `clone`

Clone the current schema object

```ts
/**
 * Clone the current schema object
 */
clone(): SchemaInterface;
```

### `toAttributesMap`

Combine attributes of the same label and gloals attributes into map format

```ts
/**
 * Combine and convert the attributes of the same tag and the attributes of gloals into map format
 * @param type specifies the type of conversion "block" | "mark" | "inline"
 */
toAttributesMap(type?:'block' |'mark' |'inline'): SchemaMap;
```

### `getMapCache`

Get the merged Map format

```ts
/**
 * Get the merged Map format
 * @param type, default is all
 */
getMapCache(type?:'block' |'mark' |'inline'): SchemaMap;
```

### `closest`

Find the name of the topmost node where the node matches the rule

```ts
/**
 * Find the name of the top-level node where the node meets the rule
 * @param name node name
 * @returns The name of the top block node
 */
closest(name: string): string;
```

### `isAllowIn`

Determine whether the child node name is allowed to be placed in the specified parent node

```ts
/**
 * Determine whether the child node name is allowed to be placed in the specified parent node
 * @param source parent node name
 * @param target child node name
 * @returns true | false
 */
isAllowIn(source: string, target: string): boolean;
```

### `getAllowInTags`

Get the label collection that allows sub-block nodes

```ts
/**
 * Get the label collection that allows child block nodes
 * @returns
 */
getAllowInTags(): Array<string>;
```

### `getCanMergeTags`

Get the label collection of block nodes that can be merged

```ts
/**
 * Get the label collection of block nodes that can be merged
 * @returns
 */
getCanMergeTags(): Array<string>;
```
