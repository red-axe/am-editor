# @aomao/plugin-math

数学公式

## 安装

```bash
$ yarn add @aomao/plugin-math
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Math , { MathComponent } from '@aomao/plugin-math';

new Engine(...,{ plugins:[ Math ] , cards:[ MathComponent ]})
```

## `Math` 可选项

```ts
//使用配置
new Engine(...,{
    config:{
        [Math.pluginName]:{
            //...相关配置
        }
    }
 })
```

### 请求生成公式代码为图片或 SVG

`action`: 请求地址，始终使用 `POST` 请求

`type`: 默认为 `json`

`contentType`: 默认以 `application/json` 类型发起请求

`data`: 请求时将这些数据一起`POST`到服务端

```ts
/**
 * 请求生成公式svg地址
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
 * 请求类型，默认 application/json;
 */
contentType?: string;
```

配置后，插件会使用 `content` 字段 POST 到指定的 `action` 地址，里面包含了公式代码

### 解析服务端响应数据

默认会查找

公式对应图片地址或`SVG`代码：response.url || response.data && response.data.url

`result`: true 生成成功，data 为公式对应图片地址或`SVG`代码。false 生成失败，data 为错误消息

```ts
/**
 * 解析生成后的Respone，返回 result:是否成功，data:成功：公式对应图片地址或`SVG`代码，失败：错误信息
 */
parse?: (
    response: any,
) => {
    result: boolean;
    data: string;
};
```

### 画图接口

可以使用 `https://g.aomao.com/latex` 地址生成公式对应的 `SVG` 代码。该项目使用[mathjax](https://www.mathjax.org/) 生成 `SVG` 代码

演示站点：[https://drawing.aomao.com/](https://drawing.aomao.com/)

配置：

```ts
[Math.pluginName]: {
    action: `https://g.aomao.com/latex`,
    parse: (res: any) => {
        if(res.success) return { result: true, data: res.svg}
        return { result: false}
    }
}
```

## 命令

### 插入公式代码

参数 1：公式代码

参数 2：公式对应图片地址或`SVG`代码

```ts
engine.command.execute(
	Math.pluginName,
	'公式代码', //可选
	'公式对应图片地址或`SVG`代码', //可选
);
```

### 请求生成公式代码图片或 SVG

参数 1：固定为 `query`
参数 2：成功后的回调
参数 3：失败后的回调。可选

```ts
engine.command.execute(Math.pluginName, "query", success:(url: string) => void, failed: (message: string) => void);
```
