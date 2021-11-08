# NodeId

Node data-id generator

Type: `NodeIdInterface`

## use

### init

initialization

```ts
/**
* Initialization
*/
init(): void;
```

### getRules

Get rules

```ts
/**
* Obtain the label name collection that needs to create data-id for the node according to the rules
* @returns
*/
getRules(): {[key: string]: SchemaRule[] };
```

### create

Create data-id for the node

```ts
/**
* Create data-id for the node
* @param node node
* @returns
*/
create(node: Node | NodeInterface): string;
```

### generateAll

Create a data-id for the child node that needs to create a data-id in the root node

```ts
/**
* Create a data-id in the root node for the child node that needs to create a data-id
* @param root root node
*/
generateAll(root?: Element | NodeInterface, force?: boolean): void;
```

### generate

Create a random data-id for the node

```ts
/**
* Create a random data-id for the node
* @param node node
* @param isCreate If yes, do you need to recreate
* @returns
*/
generate(
    root: Element | NodeInterface | DocumentFragment,
    force?: boolean,
): string | undefined;
```

### isNeed

Determine whether a node needs to create data-id

```ts
/**
* Determine whether a node needs to create data-id
* @param name node name
* @returns
*/
isNeed(node: NodeInterface): boolean;
```
