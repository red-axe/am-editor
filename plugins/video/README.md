# @aomao/plugin-video

视频插件

## 安装

```bash
yarn add @aomao/plugin-video
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Video , { VideoComponent , VideoUploader } from '@aomao/plugin-video';

new Engine(...,{ plugins:[ Video , VideoUploader ] , cards:[ VideoComponent ]})
```

`VideoUploader` 插件主要功能：选择视频文件、上传视频文件

## `Video` 可选项

`onBeforeRender` 设置视频地址前可或者下载视频时可对地址修改。另外还可以对视频的主图修改地址。

```ts
onBeforeRender?: (action: 'download' | 'query' | 'cover', url: string, editor: EditorInterface) => string;
```

### 是否显示视频标题

默认显示

```ts
showTitle?: boolean
```

## `VideoUploader` 可选项

```ts
//使用配置
new Engine(...,{
    config:{
        [VideoUploader.pluginName]:{
            //...相关配置
        }
    }
 })
```

### 文件上传

`action`: 上传地址，始终使用 `POST` 请求

`crossOrigin`: 是否跨域

`withCredentials`: <https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/withCredentials>

`headers`: 请求头

`contentType`: 文件上传默认以 `multipart/form-data;` 类型上传

`accept`: 限制用户文件选择框选择的文件类型，默认 `mp4` 格式

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
 * 视频文件上传时 FormData 的名称，默认 file
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

### 查询视频信息

在对视频有播放权限或限制、对其它无法使用 html5 直接播放需要转码后才能播放的视频文件、需要对视频进行其它处理的视频文件都可能需要这个配置

以上的视频文件上传处理流程：

-   选择文件上传后需要返回 `status` 字段并标明值为 `transcoding`，并且需要返回这个视频文件在服务端的唯一标识 `id` ，这个标识能够在后续查询中辨别这个视频文件以或得视频文件处理信息，否则一律视为 `done` 直接传输给 video 标签播放
-   插件获取到 `status` 字段值为 `transcoding` 时，会展示等待 `转码中...` 信息，并且每 3 秒通过 `id` 参数调用查询接口获取视频文件处理状态，直到 `status` 的值不为 `transcoding` 时终止轮询

除此之外，在有配置 `查询视频信息接口` 后，每次展示视频时都会调用 `查询视频信息接口` 查询一次，接口返回的结果将作为展示视频信息的参数

```ts
/**
 * 查询视频信息
 */
query?: {
    /**
     * 查询地址
     */
    action: string;
    /**
     * 数据返回类型，默认 json
     */
    type?: '*' | 'json' | 'xml' | 'html' | 'text' | 'js';
    /**
     * 额外携带数据上传
     */
    data?: Record<string, RequestDataValue> | FormData | (() => Promise<Record<string, RequestDataValue> | FormData>)
    /**
     * 请求类型，默认 multipart/form-data;
     */
    contentType?: string;
}
```

### 解析服务端响应数据

默认会查找

视频文件地址：response.url || response.data && response.data.url 一般为可播放的 mp4 地址
视频文件标识：response.id || response.data && response.data.id 可选参数，配置了`视频查询接口`必须
视频文件封面图片地址：response.cover || response.cover && response.data.cover 可选参数
视频文件处理状态：response.status || response.status && response.data.status 可选参数，配置了`视频查询接口`必须，否则一律视为 `done`
视频下载地址：response.download || response.data && response.data.download 视频文件的下载地址，可以加权限、时间限制等等，如果有可以返回地址

`result`: true 上传成功，data 为视频信息。false 上传失败，data 为错误消息

```ts
/**
 * 解析上传后的Respone，返回 result:是否成功，data:成功：视频信息，失败：错误信息
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: {
        url: string,
        id?: string,
        cover?: string
        status?: string
    } | string;
};
```

## 命令

### `Video` 插件命令

插入一个文件

参数 1：文件状态`uploading` | `done` | `transcoding` | `error` 上传中、上传完成、转码中、上传错误

参数 2：在状态非 `error` 下，为展示文件，否则展示错误消息

```ts
//'uploading' | 'done' | `transcoding` | 'error'
engine.command.execute(
	Video.pluginName,
	'done',
	'视频地址',
	'视频名称', //可选，默认为视频地址
	'视频标识', //可选，配置了 查询视频信息接口 必须
	'视频封面', //可选
	'视频大小', //可选
	'下载地址', //可选
);
```

### `VideoUploader` 插件命令

弹出文件选择框，并执行上传

可选参数 1: 传入文件列表，将上传这些文件。否则弹出文件选择框并，选择文件后执行上传。或者传入 `query` 命令，查询视频文件状态
可选参数 2: 查询视频文件信息状态的参数，0.视频文件标识，1.成功处理后的回调，2.失败处理后的回调

```ts
//方法签名
async execute(files?: Array<File> | MouseEvent | string,...args:any):void
//执行命令
engine.command.execute(VideoUploader.pluginName,file);
//查询
engine.command.execute(VideoUploader.pluginName,"query","标识",success: (data?:{ url: string, name?: string, cover?: string, download?: string, status?: string }) => void, failed: (message: string) => void = () => {});
```
