# Language

Add multi-language configuration to the editor

Type: `LanguageInterface`

## Constructor

```ts
new (lange: string, data: {} = {}): LanguageInterface
```

## Method

### `add`

Increase language configuration

Method signature

```ts
add(data: {}): void;
```

### `get`

Get the value of the language configuration item

```ts
/**
  * @param keys The keys of multiple configuration items
  * */
get<T extends string | {}>(...keys: Array<string>): T;
```
