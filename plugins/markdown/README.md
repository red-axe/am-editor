# @aomao/plugin-markdown

## Getting Started

Install

```bash
$ yarn add @aomao/plugin-markdown
```

Add Plugin

```bash
$ import Engine, { EngineInterface } from '@aomao/engine';
$ import Markdown from '@aomao/plugin-markdown';

$ Engine.plugin.add('markdown', Markdown);
```

Options

```
//启用项，默认全部启用
items?: Arrary<"code"|
"mark"|
"bold"|
"strikethrough"|
"italic"|
"sup"|
"sub"|
"orderedlist"|
"unorderedlist"|
"tasklist"|
"checkedtasklist"|
"h1"|
"h2"|
"h3"|
"h4"|
"h5"|
"h6"|
"quote"|
"link">;
//链接处理
onLink?:(text:string,url:string) => {
        href:string,
        target?:"_blank" | string
    }
```
