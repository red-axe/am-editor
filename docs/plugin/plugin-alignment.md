# @aomao/plugin-alignment

Alignment: left, center, right, justified

## Installation

```bash
$ yarn add @aomao/plugin-alignment
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Alignment from'@aomao/plugin-alignment';

new Engine(...,{ plugins:[Alignment] })
```

## Optional

### Hotkey

The default shortcut key is

Left alignment: `mod+shift+l`

Center alignment: `mod+shift+c`

Right alignment: `mod+shift+r`

Justification: `mod+shift+j`

```ts
//hotkey
hotkey?: {
    left?: string;//Left alignment, default mod+shift+l
    center?: string;//Center alignment, default mod+shift+c
    right?: string;//Right alignment, default mod+shift+r
    justify?: string;//Justify at both ends, default mod+shift+j
};
//Use configuration
new Engine(...,{
    config:{
        "alignment":{
            //Modify left-aligned shortcut key
            hotkey:{
                left: "shortcut key"
            }
        }
    }
 })
```

## Command

Optional parameters of the alignment plugin, `left` | `center` | `right` | `justify`, respectively indicate left-justified, center-justified, right-justified, and justified at both ends

```ts
//Use command to execute the plugin and pass in the required parameters
engine.command.execute('alignment', 'left' | 'center' | 'right' | 'justify');
//Use command to execute the query current status, return string | undefined, the alignment style of the node where the cursor is located "left" | "center" | "right" | "justify"
engine.command.queryState('alignment');
```
