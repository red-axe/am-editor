# NodeId

节点 data-id 生成器

类型：`NodeIdInterface`

## 使用

### init

初始化

```ts
/**
* 初始化
*/
init(): void;
```

### getRules

获取规则

```ts
/**
* 根据规则获取需要为节点创建 data-id 的标签名称集合
* @returns
*/
getRules(): { [key: string]: SchemaRule[] };
```

### create

给节点创建 data-id

```ts
/**
* 给节点创建data-id
* @param node 节点
* @returns
*/
create(node: Node | NodeInterface): string;
```

### generateAll

在根节点内为需要创建 data-id 的子节点创建 data-id

```ts
/**
* 在根节点内为需要创建data-id的子节点创建data-id
* @param root 根节点
*/
generateAll(root?: Element | NodeInterface, force?: boolean): void;
```

### generate

为节点创建一个随机 data-id

```ts
/**
* 为节点创建一个随机data-id
* @param node 节点
* @param isCreate 如果有，是否需要重新创建
* @returns
*/
generate(
    root: Element | NodeInterface | DocumentFragment,
    force?: boolean,
): string | undefined;
```

### isNeed

判断一个节点是否需要创建 data-id

```ts
/**
* 判断一个节点是否需要创建data-id
* @param name 节点名称
* @returns
*/
isNeed(node: NodeInterface): boolean;
```
