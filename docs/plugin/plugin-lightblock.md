# @aomao/plugin-lightblock

Highlight block, prompt box plugin (React)

## Install

```bash
yarn add @aomao/plugin-lightblock
```

add to engine

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import lightblock from '@aomao/plugin-lightblock';

new Engine(...,{ plugins:[lightblock] })
```

## Order

```ts
// use command to execute the plugin
engine.command.execute('lightblock');
```

## Markdown

```ts
// use markdown syntax
::: tip
```
