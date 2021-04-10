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

无可选项

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

### 上传地址

上传服务器地址，始终使用 `POST` 请求

```ts
url: string;
```

### 第三方图片地址上传

判断图片地址是否属于第三方图片

第三方图片可能存在防盗链等一些访问限制，或者图片展示有有效期限

如果是第三方图片需要将地址传入服务端下载图片保存，否则将不会执行上传，使用当前地址展现图片

```ts
/**
 * 是否是第三方图片地址，如果是，那么地址将上传服务器下载图片保存后，返回新地址
 */
isRemote?: (src: string) => boolean;
```

### 上传格式

图片上传始终使用 `FromData` ，第三方图片地址使用 `json`

```ts
/**
 * 请求类型，在上传第三方图片地址时有效，默认为json，文件上传始终走 FormData
 */
type?: 'json' | 'formData';
```

### 上传图片格式限制

限制用户文件选择框选择的文件类型，默认 `svg`,`png`,`bmp`,`jpg`,`jpeg`,`gif`,`tif`,`tiff`,`emf`,`webp`

```ts
/**
 * 图片接收的格式，默认 "svg","png","bmp","jpg","jpeg","gif","tif","tiff","emf","webp"
 */
accept?: string | Array<string>;
```

### 上传图片大小限制

限制用户选择的文件大小，超过限制将不请求上传。默认：`1024 * 1024 * 5`

```ts
/**
 * 上传大小限制，默认 1024 * 1024 * 5 就是5M
 */
limitSize?: number;
```

### 上传图片数量限制

`false` 一次只能上传一张图片，`true` 默认一次最多一百张图片

可以指定具体数量，但是文件选择框无法限制，只能上传的时候限制上传最前面的张数

```ts
/**
* 文件选择限制数量
*/
multiple?: boolean | number;
```

### 解析服务端响应数据

`result`: true 上传成功，data 为图片地址。false 上传失败，data 为错误消息

```ts
/**
 * 解析上传后的Respone，返回 result:是否成功，data:成功：图片地址，失败：错误信息
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: string;
};
```

### 携带额外数据

文件上传或第三方图片地址上传时同时将这些数据一起`POST`到服务端

```ts
/**
* 额外携带数据上传
*/
data?: {};
```

### Markdown

默认支持 markdown，传入`false`关闭

ImageUploader 插件 markdown 语法为`/^!\[([^\]]{0,})\]\((https?:\/\/[^\)]{5,})\)$/`

获取到图片地址后，会使用 `url` 上传地址将图片地址 `POST` 到服务端，请求参数为 `src`，服务端使用图片地址下载保存后将新的图片地址返回

```ts
markdown?: boolean;//默认开启，false 关闭
//使用配置
new Engine(...,{
    config:{
        [ImageUploader.pluginName]:{
            //关闭markdown
            markdown:false
        }
    }
 })
```

## 命令

### `Image` 插件命令

插入一张图片，
参数 1：图片状态`uploading` | `done` | `error` 上传中、上传完成、上传错误
参数 2：在状态非 `error` 下，为图片地址，否则为 展示的错误消息

```ts
//'uploading' | 'done' | 'error'
engine.command.execute(Image.pluginName, 'done', '图片地址');
```

### `ImageUploader` 插件命令

弹出文件选择框，并执行上传

可选参数 1：传入文件列表，将上传这些文件。否则弹出文件选择框并，选择文件后执行上传

```ts
//方法签名
async execute(files?: Array<File> | MouseEvent):void
//执行命令
engine.command.execute(ImageUploader.pluginName);
```
