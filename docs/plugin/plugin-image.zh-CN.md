# @aomao/plugin-image

图片插件

## 安装

```bash
$ yarn add @aomao/plugin-image
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Image , { ImageComponent , ImageUploader } from '@aomao/plugin-image';

new Engine(...,{ plugins:[ Image , ImageUploader ] , cards:[ ImageComponent ]})
```

`ImageUploader` 插件主要功能：选择图片、上传图片、在粘贴或者使用 markdown 时上传第三方图片地址

## `Image` 可选项

`onBeforeRender` 图片渲染前对图片地址进行修改

```ts
onBeforeRender?: (status: 'uploading' | 'done', src: string, editor: EditorInterface) => string;
```

`enableResizer` 图片大小是否可以拖动修改，默认为 true

`enableTypeSwitch` 是否启用 block inline 模式切换，默认为 true

`defaultType` 设置默认的图片卡片类型，默认为 'inline'

## `ImageUploader` 可选项

```ts
//使用配置
new Engine(...,{
    config:{
        [ImageUploader.pluginName]:{
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

`contentType`: 图片文件上传默认以 `multipart/form-data;` 类型上传

`accept`: 限制用户文件选择框选择的文件类型，默认 `svg`,`png`,`bmp`,`jpg`,`jpeg`,`gif`,`tif`,`tiff`,`emf`,`webp`

`limitSize`: 限制用户选择的文件大小，超过限制将不请求上传。默认：`1024 * 1024 * 5` 5M

`multiple`: `false` 一次只能上传一张图片，`true` 默认一次最多 100 张图。可以指定具体数量，但是文件选择框无法限制，只能上传的时候限制上传最前面的张数

`data`: 文件上传或第三方图片地址上传时同时将这些数据一起`POST`到服务端

`name`: 文件上传请求时，请求参数在 `FormData` 中的名称，默认 `file`

```ts
/**
 * 文件上传配置
 */
file:{
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
     * 额外携带数据上传
     */
    data?: Record<string, RequestDataValue> | FormData | (() => Promise<Record<string, RequestDataValue> | FormData>)
    /**
     * 图片文件上传时 FormData 的名称，默认 file
     */
    name?: string
    /**
     * 请求类型，默认 multipart/form-data;
     */
    contentType?:string
    /**
     * 图片接收的格式，默认 "svg","png","bmp","jpg","jpeg","gif","tif","tiff","emf","webp"
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
}
```

### 第三方图片上传

判断图片地址是否属于第三方图片

第三方图片可能存在防盗链等一些访问限制，或者图片展示有有效期限

如果是第三方图片需要将地址传入服务端下载图片保存，否则将不会执行上传，使用当前地址展现图片

请求参数为 `{ url:string }`

```ts
/**
 * 是否是第三方图片地址，如果是，那么地址将上传服务器下载图片保存后，返回新地址
 */
isRemote?: (src: string) => boolean;
/**
 * 上传配置
 */
remote:{
    /**
     * 上传地址
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
     * 额外携带数据上传
     */
    data?: Record<string, RequestDataValue> | FormData | (() => Promise<Record<string, RequestDataValue> | FormData>)
    /**
     * 图片文件丢之上传时请求参数的名称，默认 url
     */
    name?: string
    /**
     * 请求类型，默认 application/json
     */
    contentType?:string
}
```

### 解析服务端响应数据

默认会查找 response.url || response.data && response.data.url || response.src || response.data && response.data.src

`result`: true 上传成功，data 为图片地址。false 上传失败，data 为错误消息

```ts
/**
 * 解析上传后的Respone，返回 result:是否成功，data:成功：图片地址，失败：错误信息
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: { url: string };
};
```

## 命令

### `Image` 插件命令

插入一张图片

参数 1：图片状态`uploading` | `done` | `error` 上传中、上传完成、上传错误

参数 2：在状态非 `error` 下，为展示图片，否则展示错误消息

```ts
//'uploading' | 'done' | 'error'
engine.command.execute(Image.pluginName, 'done', '图片地址');
```

### `ImageUploader` 插件命令

弹出文件选择框，并执行上传

可选参数 1：传入文件列表，将上传这些文件。传入图片地址，插入图片，如果为第三方图片就执行上传。否则弹出文件选择框并，选择文件后执行上传

```ts
//方法签名
async execute(files?: Array<File> | string | MouseEvent):void
//执行命令
engine.command.execute(ImageUploader.pluginName);
```
