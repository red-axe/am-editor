# @aomao/plugin-link

Link plugin

## Installation

```bash
yarn add @aomao/plugin-link
```

`Vue3` use

```bash
yarn add @aomao/plugin-link-vue
```

`Vue2` use

```bash
yarn add am-editor-link-vue2
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Link from'@aomao/plugin-link';

new Engine(...,{ plugins:[Link] })
```

## Optional

### Hotkey

The default shortcut key is `mod+k`, and the default parameter is ["_blank"]

```ts
//Shortcut keys, key combination keys, args, execution parameters, [target?:string,href?:string,text?:string] Open mode: optional, default link: optional, default text: optional
hotkey?:string | {key:string,args:Array<string>};

//Use configuration
new Engine(...,{
    config:{
        "link":{
            //Modify shortcut keys
            hotkey:{
                key:"mod+k",
                args:["_balnk_","https://www.aomao.com","ITELLYOU"]
            }
        }
    }
 })
```

### onConfirm

The url or text to be modified can be modified

Confirm execution after editing text and url

```ts
onConfirm?: (
     text: string,
     link: string,
) => Promise<{ text: string; link: string }>;
```

### enableToolbar

Whether to enable the toolbar for link editing

```ts
enableToolbar?: boolean;
```

### onLinkClick

Fired when a link is clicked in edit mode

```ts
onLinkClick?: (e: MouseEvent, link: string) => void;
```

## Command

Three parameters can be passed in [target?:string,href?:string,text?:string] Open mode: optional, default link: optional, default text: optional

```ts
//target:'_blank','_parent','_top','_self', href: link, text: text
engine.command.execute('link', '_blank', 'https://www.aomao.com', 'ITELLYOU');
//Use command to execute query current status, return boolean | undefined
engine.command.queryState('link');
```
