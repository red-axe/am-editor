# @aomao/plugin-video

Video plugin

## Installation

```bash
$ yarn add @aomao/plugin-video
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Video, {VideoComponent, VideoUploader} from'@aomao/plugin-video';

new Engine(...,{ plugins:[ Video, VideoUploader], cards:[ VideoComponent ]})
```

The main functions of the `VideoUploader` plugin: select video files, upload video files

## `Video` optional

`onBeforeRender` can modify the address before setting the video address or when downloading the video. In addition, you can modify the address of the main image of the video.

```ts
onBeforeRender?: (action:'download' |'query' |'cover', url: string, editor: EditorInterface) => string;
```

## `VideoUploader` optional

```ts
//Use configuration
new Engine(...,{
    config:{
        [VideoUploader.pluginName]:{
            //...Related configuration
        }
    }
 })
```

### Whether to display the video title

Default Display

```ts
showTitle?: boolean
```

### File Upload

`action`: upload address, always use `POST` request

`crossOrigin`: Whether to cross-origin

`withCredentials`: https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/withCredentials

`headers`: request header

`contentType`: File upload is uploaded in `multipart/form-data;` type by default

`accept`: Restrict the file type selected by the user's file selection box, the default `mp4` format

`limitSize`: Limit the file size selected by the user. If the file size exceeds the limit, no upload will be requested. Default: `1024 * 1024 * 5` 5M

`multiple`: `false` can only upload one file at a time, `true` defaults to a maximum of 100 files at a time. You can specify the specific number, but the file selection box cannot be limited, only the first number of uploads can be limited when uploading

`data`: POST these data to the server at the same time when the file is uploaded

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
  * The name of the FormData when the video file is uploaded, the default is file
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
 * The format of the file reception, the default "*" all
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

### Query video information

This configuration may be required when there are playback permissions or restrictions on the video, other video files that cannot be played directly with html5 and need to be transcoded, and video files that require other processing of the video.

The above video file upload processing flow:

-   After selecting the file to upload, you need to return the `status` field and mark the value as `transcoding`, and you need to return the unique identifier of the video file on the server side `id`, which can identify the video file in subsequent queries to obtain the video file Process the information, otherwise it will be regarded as `done` and directly transmitted to the video tag for playback
-   When the plugin gets the `status` field value as `transcoding`, it will display the message waiting for `transcoding...`, and call the query interface through the `id` parameter every 3 seconds to get the video file processing status until `status` Stop polling when the value is not `transcoding`

In addition, after the `video information query interface` is configured, the `video information interface` query will be called every time a video is displayed, and the result returned by the interface will be used as a parameter for displaying the video information

```ts
/**
 * Query video information
 */
query?: {
    /**
     * look for the address
     */
    action: string;
    /**
     * Data return type, default json
     */
    type?:'*' |'json' |'xml' |'html' |'text' |'js';
    /**
     * Additional data upload
     */
    data?: Record<string, RequestDataValue> | FormData | (() => Promise<Record<string, RequestDataValue> | FormData>)
    /**
     * Request type, default multipart/form-data;
     */
    contentType?: string;
}
```

### Analyze server response data

Will find by default

Video file address: response.url || response.data && response.data.url is generally a playable mp4 address
Video file identification: response.id || response.data && response.data.id optional parameters, configured with `video query interface` must
Video file cover image address: response.cover || response.cover && response.data.cover Optional parameters
Video file processing status: response.status || response.status && response.data.status optional parameters, configured with `video query interface` required, otherwise it will be regarded as `done`
Video download address: response.download || response.data && response.data.download The download address of the video file, you can add permissions, time restrictions, etc., if you have one, you can return the address

`result`: true upload is successful, data is video information. false upload failed, data is an error message

```ts
/**
 * Parse the uploaded Respone and return result: whether it is successful or not, data: success: video information, failure: error information
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

## Command

### `Video` plugin command

Insert a file

Parameter 1: File status `uploading` | `done` | `transcoding` | `error` uploading, uploading completed, transcoding, uploading error

Parameter 2: When the status is not `error`, the file is displayed, otherwise an error message is displayed

```ts
//'uploading' |'done' | `transcoding` |'error'
engine.command.execute(
	Video.pluginName,
	'done',
	'Video address',
	'Video name', //optional, the default is the video address
	'Video ID', //optional, equipped with the interface for querying video information must
	'Video cover', //optional
	'Video size', //optional
	'Download address', //optional
);
```

### `VideoUploader` plugin command

Pop up the file selection box and perform upload

Optional parameter 1: Incoming file list, these files will be uploaded. Otherwise, a file selection box will pop up and upload it after selecting the file. Or pass in the `query` command to query the status of the video file
Optional parameter 2: Parameters for querying the information status of the video file, 0. Video file identification, 1. Callback after successful processing, 2. Callback after failed processing

```ts
//Method signature
async execute(files?: Array<File> | MouseEvent | string,...args:any):void
//Excuting an order
engine.command.execute(VideoUploader.pluginName,file);
//Inquire
engine.command.execute(VideoUploader.pluginName,"query","identification",success: (data?:{ url: string, name?: string, cover?: string, download?: string, status?: string }) => void, failed: (message: string) => void = () => ());
```
