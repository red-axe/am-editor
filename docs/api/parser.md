# Parser

Type: `ParserInterface`

## Constructor

```ts
/**
 * @param source value or node is finally parsed as a DOM tree
 * @param editor editor example
 * @param paserBefore callback before parsing
 * */
new (source: string | Node | NodeInterface, editor: EditorInterface, paserBefore?: (node: NodeInterface) => void): ParserInterface
```

## Method

### `traverse`

Traverse nodes

```ts
/**
 * Traverse nodes
 * @param node root node
 * @param conversionRules tag name converter
 * @param callbacks callbacks
 * @param isCardNode is it a card
 * @param includeCard whether to include the card
 */
traverse(
    node: NodeInterface,
    conversionRules: any,
    callbacks: Callbacks,
    isCardNode?: boolean,
    includeCard?: boolean,
): void
```

### `toValue`

Traverse the DOM tree to generate standard editor values

```ts
/**
 * Traverse the DOM tree to generate standard editor values
 * @param schemaRules tag retention rules
 * @param conversionRules tag conversion rules
 * @param replaceSpaces whether to replace spaces
 * @param customTags Whether to convert the cursor and card nodes into standard codes
 */
toValue(
    schema?: SchemaInterface | null,
    conversionRules?: ConversionInterface,
    replaceSpaces?: boolean,
    customTags?: boolean,
): string
```

### `toHTML`

Convert to HTML code

```ts
/**
 * Convert to HTML code
 * @param inner inner package node
 * @param outter outer package node
 */
toHTML(inner?: Node, outter?: Node): {html: string, text: string}
```

### `toDOM`

Return to the DOM tree

```ts
/**
 * Return to the DOM tree
 */
toDOM(schema?: SchemaInterface | null, conversionRules?: ConversionInterface): DocumentFragment
```

### `toText`

Convert to text

```ts
/**
* Convert to text
* @param schema Schema rules
* @param includeCard Whether to traverse the inside of the card, the default is not to traverse
* @param formatOL Whether to format the ordered list, <ol><li>a</li><li>b</li></ol> -> 1. a 2. b Default conversion
*/
toText(
    schema?: SchemaInterface,
    includeCard?: boolean,
    formatOL?: boolean,
): string;
```
