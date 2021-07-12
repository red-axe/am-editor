# @aomao/plugin-mention

提及插件

## 安装

```bash
$ yarn add @aomao/plugin-mention
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Mention, { MentionComponent } from '@aomao/plugin-mention';

new Engine(...,{ plugins:[Mention], cards: [MentionComponent] })
```

## 可选项

```ts
//使用配置
new Engine(...,{
    config:{
        "mention":{
            //其它可选项
            ...
        }
    }
 })
```

`defaultData`: 默认下拉查询列表展示数据

`onSearch`: 查询时的方法，或者配置 action，二选其一

`onClick`: 在“提及”上单击时触发

`action`: 查询地址，始终使用 `GET` 请求

`data`: 查询时同时将这些数据一起传到到服务端

```ts
//默认展示的列表数据
defaultData?: Array<{ key: string, name: string, avatar?: string}>
//查询时的方法，或者配置 action，二选其一
onSearch?:(keyword: string) => Promise<Array<{ key: string, name: string, avatar?: string}>>
//在“提及”上单击事件
onClick?:(key: string, name: string) => void
/**
 * 查询地址
 */
action?: string;
/**
 * 数据返回类型，默认 json
 */
type?: '*' | 'json' | 'xml' | 'html' | 'text' | 'js';
/**
 * 额外携带数据上传
 */
data?: {};
/**
 * 请求类型，默认 multipart/form-data;
 */
contentType?: string;
/**
 * 解析上传后的Respone，返回 result:是否成功，data:成功：文件地址，失败：错误信息
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: Array<{ key: string, name: string, avatar?: string}>;
};

```

### 解析服务端响应数据

`result`: true 上传成功，data 数据集合。false 上传失败，data 为错误消息

```ts
/**
 * 解析上传后的Respone，返回 result:是否成功，data:成功：文件地址，失败：错误信息
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: Array<{ key: string, name: string, avatar?: string}>;
};
```

## 命令

获取文档中所有的提及

```ts
//返回 Array<{ key: string, name: string}>
engine.command.execute('mention', 'getList');
```
