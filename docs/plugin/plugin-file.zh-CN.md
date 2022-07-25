# @aomao/plugin-file

文件插件

## 安装

```bash
$ yarn add @aomao/plugin-file
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import File , { FileComponent , FileUploader } from '@aomao/plugin-file';

new Engine(...,{ plugins:[ File , FileUploader ] , cards:[ FileComponent ]})
```

`FileUploader` 插件主要功能：选择文件、上传文件

## `File` 可选项

`onBeforeRender` 预览附近或者下载附件时可对地址修改

```ts
onBeforeRender?: (action: 'download' | 'preview', url: string, editor: EditorInterface) => string;
```

`onDownload` 点击下载附件时触发，默认使用地址链接跳转

```ts
onDownload?: (url: string, value: FileValue) => void;
```

`onPreview` 点击预览附件时触发，默认使用地址链接跳转

```ts
onPreview?: (url: string, value: FileValue) => void;
```

## `FileUploader` 可选项

```ts
//使用配置
new Engine(...,{
    config:{
        [FileUploader.pluginName]:{
            //...相关配置
        }
    }
 })
```

### 文件上传

`action`: 上传地址，始终使用 `POST` 请求

`crossOrigin`: 是否跨域

`withCredentials`: https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/withCredentials

`headers`: 请求头

`contentType`: 文件上传默认以 `multipart/form-data;` 类型上传

`accept`: 限制用户文件选择框选择的文件类型，默认 `*` 所有的

`limitSize`: 限制用户选择的文件大小，超过限制将不请求上传。默认：`1024 * 1024 * 5` 5M

`multiple`: `false` 一次只能上传一个文件，`true` 默认一次最多 100 个文件。可以指定具体数量，但是文件选择框无法限制，只能上传的时候限制上传最前面的张数

`data`: 文件上传时同时将这些数据一起`POST`到服务端

`name`: 文件上传请求时，请求参数在 `FormData` 中的名称，默认 `file`

```ts
/**
 * 文件上传地址
 */
action:string
/**
 * 是否跨域
 */
crossOrigin?: boolean;
/**
 * https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/withCredentials
 */
withCredentials?: boolean;
/**
* 请求头
*/
headers?: Record<string, string> | (() => Promise<Record<string, string>>);
/**
 * 数据返回类型，默认 json
 */
type?: '*' | 'json' | 'xml' | 'html' | 'text' | 'js';
/**
 * 文件上传时 FormData 的名称，默认 file
 */
name?: string
/**
 * 额外携带数据上传
 */
data?: Record<string, RequestDataValue> | FormData | (() => Promise<Record<string, RequestDataValue> | FormData>)
/**
 * 请求类型，默认 multipart/form-data;
 */
contentType?:string
/**
 * 文件接收的格式，默认 "*" 所有的
 */
accept?: string | Array<string>;
/**
 * 文件选择限制数量
 */
multiple?: boolean | number;
/**
 * 上传大小限制，默认 1024 * 1024 * 5 就是5M
 */
limitSize?: number;

```

### 解析服务端响应数据

默认会查找

文件地址：response.url || response.data && response.data.url
预览地址：response.preview || response.data && response.data.preview 后端转换后可以预览一些复杂的文件，如果有可以返回地址
下载地址：response.download || response.data && response.data.download 文件的下载地址，可以加权限、时间限制等等，如果有可以返回地址

`result`: true 上传成功，data 为文件地址。false 上传失败，data 为错误消息

```ts
/**
 * 解析上传后的Respone，返回 result:是否成功，data:成功：文件地址，失败：错误信息
 */
parse?: (response: any) => {
    result: boolean;
    data: {
            url: string;
            preview?: string;
            download?: string;
            status?: string;
        };
};
```

## 命令

### `File` 插件命令

插入一个文件

参数 1：文件状态`uploading` | `done` | `error` 上传中、上传完成、上传错误

参数 2：在状态非 `error` 下，为展示文件，否则展示错误消息

```ts
//'uploading' | 'done' | 'error'
engine.command.execute(
	File.pluginName,
	'done',
	'文件地址',
	'文件名称', //可选、默认为url地址
	'文件大小', //可选
	'预览地址', //可选
	'下载地址', //可选
);
```

### `FileUploader` 插件命令

弹出文件选择框，并执行上传

可选参数 1：传入文件列表，将上传这些文件。否则弹出文件选择框并，选择文件后执行上传

```ts
//方法签名
async execute(files?: Array<File> | MouseEvent):void
//执行命令
engine.command.execute(FileUploader.pluginName);
```
