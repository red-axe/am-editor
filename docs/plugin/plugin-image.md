# @aomao/plugin-image

Image plugin

## Installation

```bash
$ yarn add @aomao/plugin-image
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Image, {ImageComponent, ImageUploader} from'@aomao/plugin-image';

new Engine(...,{ plugins:[ Image, ImageUploader], cards:[ ImageComponent ]})
```

The main functions of the `ImageUploader` plugin: select images, upload images, upload third-party image addresses when pasting or using markdown

## `Image` optional

`onBeforeRender` Modify the image address before the image is rendered

```ts
onBeforeRender?: (status:'uploading' |'done', src: string, editor: EditorInterface) => string;
```

`enableResizer` Whether the image size can be modified by dragging, the default is true

`enableTypeSwitch` whether to enable block inline mode switching, the default is true

`defaultType` sets the default image card type, the default is 'inline'

`maxHeight` sets the maximum height of the default image display, which is not limited by default

## `ImageUploader` optional

```ts
//Use configuration
new Engine(...,{
    config:{
        [ImageUploader.pluginName]:{
            //...Related configuration
        }
    }
 })
```

### File Upload

`action`: upload address, always use `POST` request

`crossOrigin`: Whether to cross-origin

`withCredentials`: https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/withCredentials

`headers`: request header

`contentType`: Image file upload is uploaded in `multipart/form-data;` type by default

`accept`: Restrict the file type selected by the user's file selection box, the default is `svg`, `png`,`bmp`, `jpg`, `jpeg`,`gif`,`tif`,`tiff`,`emf` ,`webp`

`limitSize`: Limit the file size selected by the user. If the file size exceeds the limit, no upload will be requested. Default: `1024 * 1024 * 5` 5M

`multiple`: `false` can only upload one picture at a time, `true` defaults to a maximum of 100 pictures at a time. You can specify the specific number, but the file selection box cannot be limited, only the first number of uploads can be limited when uploading

`data`: When files are uploaded or third-party image addresses are uploaded, these data will be `POST` to the server at the same time

`name`: When file upload request, the name of the request parameter in `FormData`, the default is `file`

```ts
/**
 * File upload configuration
 */
file:{
    /**
     * File upload address
     */
    action:string
    /**
     * Whether cross-domain
     */
    crossOrigin?: boolean;
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/withCredentials
     */
    withCredentials?: boolean;
    /**
    * Request header
    */
    headers?: {[key: string]: string} | (() => {[key: string]: string });
    /**
     * Data return type, default json
     */
    type?:'*' |'json' |'xml' |'html' |'text' |'js';
    /**
     * Additional data upload
     */
    data?: Record<string, RequestDataValue> | FormData | (() => Promise<Record<string, RequestDataValue> | FormData>)
    /**
     * The name of the FormData when the image file is uploaded, the default file
     */
    name?: string
    /**
     * Request type, default multipart/form-data;
     */
    contentType?:string
    /**
     * The format of the picture received, the default is "svg","png","bmp","jpg","jpeg","gif","tif","tiff","emf","webp"
     */
    accept?: string | Array<string>;
    /**
     * File selection limit
     */
    multiple?: boolean | number;
    /**
     * Upload size limit, default 1024 * 1024 * 5 is 5M
     */
    limitSize?: number;
}
```

### Third-party image upload

Determine whether the image address belongs to a third-party image

Third-party pictures may have some access restrictions such as anti-hotlinking, or the picture display has an expiration date

If it is a third-party picture, you need to pass the address to the server to download the picture and save it, otherwise the upload will not be executed, and the current address will be used to display the picture

The request parameter is `{ url:string }`

```ts
/**
 * Whether it is a third-party picture address, if it is, then the address will upload the server to download the picture and save it, and then return to the new address
 */
isRemote?: (src: string) => boolean;
/**
 * Upload configuration
 */
remote:{
    /**
     * Upload address
     */
    action:string
    /**
     * Whether cross-domain
     */
    crossOrigin?: boolean;
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/withCredentials
     */
    withCredentials?: boolean;
    /**
    * Request header
    */
    headers?: {[key: string]: string} | (() => {[key: string]: string });
    /**
     * Data return type, default json
     */
    type?:'*' |'json' |'xml' |'html' |'text' |'js';
    /**
     * Additional data upload
     */
    data?: Record<string, RequestDataValue> | FormData | (() => Promise<Record<string, RequestDataValue> | FormData>)
    /**
     * The name of the request parameter when the image file is lost when uploading, the default url
     */
    name?: string
    /**
     * Request type, default application/json
     */
    contentType?:string
}
```

### Analyze server response data

By default, it will find response.url || response.data && response.data.url || response.src || response.data && response.data.src

`result`: true upload is successful, data is the image address. false upload failed, data is an error message

```ts
/**
 * Parse the uploaded Respone and return result: whether it is successful or not, data: success: image address, failure: error message
 */
parse?: (
    response: any,
) => {
    result: boolean;
   	data: { url: string };
};
```

## Command

### `Image` plugin command

Insert a picture

Parameter 1: Image status `uploading` | `done` | `error` uploading, uploading completed, uploading error

Parameter 2: When the status is not `error`, it is the display picture, otherwise it displays the error message

```ts
//'uploading' |'done' |'error'
engine.command.execute(Image.pluginName, 'done', 'Image address');
```

### `ImageUploader` plugin command

Pop up the file selection box and perform upload

Optional parameter 1: Pass in the file list, these files will be uploaded. Pass in the picture address, insert the picture, and upload it if it is a third-party picture. Otherwise, the file selection box will pop up and upload it after selecting the file

```ts
//Method signature
async execute(files?: Array<File> | string | MouseEvent):void
//Excuting an order
engine.command.execute(ImageUploader.pluginName);
```
