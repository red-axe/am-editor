# @aomao/plugin-file

File plugin

## Installation

```bash
$ yarn add @aomao/plugin-file
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import File, {FileComponent, FileUploader} from'@aomao/plugin-file';

new Engine(...,{ plugins:[ File, FileUploader], cards:[ FileComponent ]})
```

`FileUploader` plugin main functions: select files, upload files

## `File` optional

`onBeforeRender` can modify the address when previewing nearby or downloading attachments

```ts
onBeforeRender?: (action:'download' |'preview', url: string, editor: EditorInterface) => string;
```

`onDownload` Triggered when the download attachment is clicked, by default the address link is used to jump

```ts
onDownload?: (url: string, value: FileValue) => void;
```

`onPreview` Triggered when the preview attachment is clicked, the default URL link is used to jump

```ts
onPreview?: (url: string, value: FileValue) => void;
```

## `FileUploader` optional

```ts
//Use configuration
new Engine(...,{
    config:{
        [FileUploader.pluginName]:{
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

`contentType`: File upload is uploaded in `multipart/form-data;` type by default

`accept`: Restrict the file types selected by the user's file selection box, default `*` all

`limitSize`: Limit the file size selected by the user. If the file size exceeds the limit, no upload will be requested. Default: `1024 * 1024 * 5` 5M

`multiple`: `false` can only upload one file at a time, `true` defaults to a maximum of 100 files at a time. You can specify the specific number, but the file selection box cannot be limited, only the first number of uploads can be limited when uploading

`data`: POST these data together to the server when the file is uploaded

`name`: When file upload request, the name of the request parameter in `FormData`, the default is `file`

```ts
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
  * The name of the FormData when the file is uploaded, the default is file
  */
name?: string
/**
 * Additional data upload
 */
data?: Record<string, RequestDataValue> | FormData | (() => Promise<Record<string, RequestDataValue> | FormData>)
/**
 * Request type, default multipart/form-data;
 */
contentType?:string
/**
 * The format of file reception, default "*" all
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

```

### Analyze server response data

Will find by default

File address: response.url || response.data && response.data.url
Preview address: response.preview || response.data && response.data.preview After the back-end conversion, you can preview some complex files, and return the address if available
Download address: response.download || response.data && response.data.download The download address of the file, you can add permissions, time restrictions, etc., if you have one, you can return the address

`result`: true upload is successful, data is the file address. false upload failed, data is an error message

```ts
/**
 * Parse the uploaded Respone and return result: whether it is successful or not, data: success: file address, failure: error message
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

## Command

### `File` plugin command

Insert a file

Parameter 1: File status `uploading` | `done` | `error` uploading, uploading completed, uploading error

Parameter 2: When the status is not `error`, the file is displayed, otherwise an error message is displayed

```ts
//'uploading' |'done' |'error'
engine.command.execute(
	File.pluginName,
	'done',
	'File address',
	'File name', //optional
	'File size', //optional
	'Preview address', //optional
	'Download address', //optional
);
```

### `FileUploader` plugin command

Pop up the file selection box and perform upload

Optional parameter 1: Pass in the file list, these files will be uploaded. Otherwise, the file selection box will pop up and upload it after selecting the file

```ts
//Method signature
async execute(files?: Array<File> | MouseEvent):void
//Excuting an order
engine.command.execute(FileUploader.pluginName);
```
