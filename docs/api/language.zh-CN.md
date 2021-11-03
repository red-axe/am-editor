# 语言

给编辑器增加多语言配置

类型：`LanguageInterface`

## 构造函数

```ts
new (lange: string, data: {} = {}): LanguageInterface
```

## 方法

### `add`

增加语言配置

方法签名

```ts
add(data: {}): void;
```

### `get`

获取语言配置项的值

```ts
/**
 * @param keys 多个配置项的key
 * */
get<T extends string | {}>(...keys: Array<string>): T;
```
