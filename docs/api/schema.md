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
* @param isMerge Whether to merge, the default is false. If true, it will be merged into the existing rules
*/
add(
    rules: SchemaRule | SchemaGlobal | Array<SchemaRule | SchemaGlobal>,
	isMerge?: boolean,
): void;
```

### `remove`

Remove a rule

```ts
/**
* Remove a rule
* @param rule
*/
remove(rule: SchemaRule): void;
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
* @param filter
*/
getType(
node: NodeInterface,
filter?: (rule: SchemaRule) => boolean,
):'block' |'mark' |'inline' | undefined;
```

### `getRule`

Get the matching rules according to the node

```ts
/**
  * Obtain the matching rules according to the node
  * @param node node
  * @param filter
  * @returns
  */
getRule(
     node: NodeInterface,
     filter?: (rule: SchemaRule) => boolean,
): SchemaRule | undefined;
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

### `checkValue`

Check whether the value meets the rules

```ts
/**
* Whether the detection value meets the rules
* @param rule
* @param attributesName attribute name
* @param attributesValue attribute value
* @param force Whether to force the comparison value
*/
checkValue(
    rule: SchemaAttributes | SchemaStyle,
    attributesName: string,
    attributesValue: string,
    force?: boolean,
): boolean;
```

### `filterStyles`

Filter node style

```ts
/**
* Filter node style
* @param styles style
* @param rule
*/
filterStyles(styles: {[k: string]: string }, rule: SchemaRule): void;
```

### `filterAttributes`

Filter node attributes

```ts
/**
* Filter node attributes
* @param attributes
* @param rule
*/
filterAttributes(
    attributes: {[k: string]: string },
    rule: SchemaRule,
): void;
```

### `filter`

Filter attributes and styles that meet the node rules

```ts
/**
  * Filter attributes and styles that meet the node rules
  * @param node node, used to get rules
  * @param attributes
  * @param styles style
  * @returns
  */
filter(
     node: NodeInterface,
     attributes: {[k: string]: string },
     styles: {[k: string]: string },
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

### `addAllowIn`

Add block child nodes that are allowed to be placed in a block node

```ts
/**
  * Add block child nodes that are allowed to be placed in a block node
  * @param parent Allowed parent node
  * @param child allows the node to be placed, default p
  */
addAllowIn(parent: string, child?: string): void;
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
