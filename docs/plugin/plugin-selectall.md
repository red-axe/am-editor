# @aomao/plugin-selectall

Select all plugins

## Installation

```bash
$ yarn add @aomao/plugin-selectall
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Selectall from'@aomao/plugin-selectall';

new Engine(...,{ plugins:[Selectall] })
```

## hotkey

The shortcut key is `mod+a`, which cannot be modified

## Command

```ts
//Use command to execute the plugin
engine.command.execute('selectall');
```
