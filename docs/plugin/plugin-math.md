# @aomao/plugin-math

Mathematical formula

## Installation

```bash
$ yarn add @aomao/plugin-math
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Math, {MathComponent} from'@aomao/plugin-math';

new Engine(...,{ plugins:[ Math], cards:[ MathComponent ]})
```

## `Math` optional

```ts
//Use configuration
new Engine(...,{
    config:{
        [Math.pluginName]:{
            //...Related configuration
        }
    }
 })
```

### Request to generate formula code as picture or SVG

`action`: request address, always use `POST` request

`type`: default is `json`

`contentType`: By default, the request is initiated in the `application/json` type

`data`: POST these data together to the server when requesting

```ts
/**
 * Request to generate formula svg address
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
 * Request type, default application/json;
 */
contentType?: string;
```

After configuration, the plugin will use the `content` field to POST to the specified `action` address, which contains the formula code

### Analyze server response data

Will find by default

The formula corresponds to the image address or `SVG` code: response.url || response.data && response.data.url

`result`: true is generated successfully, and data is the image address corresponding to the formula or the `SVG` code. false Failed to generate, data is the error message

```ts
/**
 * Parse the generated Respone and return result: whether it is successful or not, data: success: the formula corresponds to the image address or `SVG` code, failure: error message
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: string;
};
```

### Drawing interface

You can use the `https://g.aomao.com/latex` address to generate the `SVG` code corresponding to the formula. This project uses [mathjax](https://www.mathjax.org/) to generate `SVG` code

Demo site: [https://drawing.aomao.com/](https://drawing.aomao.com/)

Configuration:

```ts
[Math.pluginName]: {
    action: `https://g.aomao.com/latex`,
    parse: (res: any) => {
        if(res.success) return {result: true, data: res.svg}
        return {result: false}
    }
}
```

## Command

### Insert formula code

Parameter 1: Formula code

Parameter 2: The formula corresponds to the image address or `SVG` code

```ts
engine.command.execute(
	Math.pluginName,
	'Formula code', //optional
	'The formula corresponds to the image address or `SVG` code', //optional
);
```

### Request to generate formula code image or SVG

Parameter 1: fixed as `query`
Parameter 2: callback after success
Parameter 3: Callback after failure. Optional

```ts
engine.command.execute(Math.pluginName, "query", success:(url: string) => void, failed: (message: string) => void);
```
