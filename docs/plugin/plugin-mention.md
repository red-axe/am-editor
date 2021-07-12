# @aomao/plugin-mention

Mention plugin

## Installation

```bash
$ yarn add @aomao/plugin-mention
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Mention, {MentionComponent} from'@aomao/plugin-mention';

new Engine(...,{ plugins:[Mention], cards: [MentionComponent] })
```

## Optional

```ts
//Use configuration
new Engine(...,{
    config:{
        "mention":{
            //Other options
            ...
        }
    }
 })
```

`defaultData`: Default drop-down query list display data

`onSearch`: the method to query, or configure the action, choose one of the two

`onClick`: Triggered when clicking on the "mention"

`action`: query address, always use `GET` request

`data`: When querying, these data will be sent to the server at the same time

```ts
//List data displayed by default
defaultData?: Array<{ key: string, name: string, avatar?: string}>
//The method of query, or configure action, choose one of the two
onSearch?:(keyword: string) => Promise<Array<{ key: string, name: string, avatar?: string}>>
//Click event on "mention"
onClick?:(key: string, name: string) => void
/**
 * look for the address
 */
action?: string;
/**
 * Data return type, default json
 */
type?:'*' |'json' |'xml' |'html' |'text' |'js';
/**
 * Additional data upload
 */
data?: {};
/**
 * Request type, default multipart/form-data;
 */
contentType?: string;
/**
 * Parse the uploaded Respone and return result: whether it is successful or not, data: success: file address, failure: error message
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: Array<{ key: string, name: string, avatar?: string}>;
};

```

### Analyze server response data

`result`: true upload is successful, data data collection. false upload failed, data is an error message

```ts
/**
 * Parse the uploaded Respone and return result: whether it is successful or not, data: success: file address, failure: error message
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: Array<{ key: string, name: string, avatar?: string}>;
};
```

## Command

Get all mentions in the document

```ts
//Return Array<{ key: string, name: string}>
engine.command.execute('mention', 'getList');
```
