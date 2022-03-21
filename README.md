# 流浪计划 | WanderingPlan

## 计划阶段
### 第一阶段[书柜阶段][毕设阶段]
+ 温度模块 ✔
+ 人体检测模块 ✔
+ GPS模块 ✔
+ 磁力锁模块 ✔
+ 阿里云模块 ✔
### 第二阶段[硬件拓展及精简阶段]
+ 摄像头模块
+ 电池模块
+ 太阳能板模块
+ ...
### 第三阶段[货柜阶段]
+ ...
---
## 业务逻辑流程图
<img src="Docs/CASE业务逻辑流程图.png">

---

## API使用示例[仅提供NodeJS版]

+ API名称：setLED
```javascript
const Client = require('aliyun-api-gateway').Client;
const UUID = require('uuid');

// 用appKey和appSecret初始化客户端

const client = new Client('您的<AppKey>', '您的<AppSecret>');

const Gateway = async ({url, apiVer, params, iotToken}) => {

    return await client.post(url, {
        data: {
            id: UUID.v1(), // 请求唯一标识，必填
            version: '1.0', // 协议版本，固定值1.0
            request: {
                iotToken, // iottoken，选填
                apiVer // api版本，必填
            },
            params: params || {} // 业务参数，必填
        },
        headers: {
            accept: 'application/json'
        },
        timeout: 3000        
    });

};

const params = {
    url: 'http://fcaea944ce554e968c4dc6acdd53033b-cn-shanghai.alicloudapi.com/a123spAe9pmMS0F4/bfx3LnoN6vcCkD',
    apiVer: '1.0.0',
    params: {
        // 接口参数
        
		"action":"node_bb4914c0",
		"green":1,
		"blue":1,
    }
}

Gateway(params)
    .then(res => console.log(res))
    .catch(res => console.log(res));

```
---
+ API名称：setLock
```javascript
const Client = require('aliyun-api-gateway').Client;
const UUID = require('uuid');

// 用appKey和appSecret初始化客户端

const client = new Client('您的<AppKey>', '您的<AppSecret>');

const Gateway = async ({url, apiVer, params, iotToken}) => {

    return await client.post(url, {
        data: {
            id: UUID.v1(), // 请求唯一标识，必填
            version: '1.0', // 协议版本，固定值1.0
            request: {
                iotToken, // iottoken，选填
                apiVer // api版本，必填
            },
            params: params || {} // 业务参数，必填
        },
        headers: {
            accept: 'application/json'
        },
        timeout: 3000        
    });

};

const params = {
    url: 'http://fcaea944ce554e968c4dc6acdd53033b-cn-shanghai.alicloudapi.com/a123spAe9pmMS0F4/bfM2zto9YGaVlU',
    apiVer: '1.0.0',
    params: {
        // 接口参数
        
		"action":"node_e9ae6510",
		"data":1,
    }
}

Gateway(params)
    .then(res => console.log(res))
    .catch(res => console.log(res));

```
---
+ API名称：getPIR
```javascript
const Client = require('aliyun-api-gateway').Client;
const UUID = require('uuid');

// 用appKey和appSecret初始化客户端

const client = new Client('您的<AppKey>', '您的<AppSecret>');

const Gateway = async ({url, apiVer, params, iotToken}) => {

    return await client.post(url, {
        data: {
            id: UUID.v1(), // 请求唯一标识，必填
            version: '1.0', // 协议版本，固定值1.0
            request: {
                iotToken, // iottoken，选填
                apiVer // api版本，必填
            },
            params: params || {} // 业务参数，必填
        },
        headers: {
            accept: 'application/json'
        },
        timeout: 3000        
    });

};

const params = {
    url: 'http://fcaea944ce554e968c4dc6acdd53033b-cn-shanghai.alicloudapi.com/a123spAe9pmMS0F4/bfu2i7sly5Pc8k',
    apiVer: '1.0.0',
    params: {
        // 接口参数
        
		"action":"node_730b6dc0",
    }
}

Gateway(params)
    .then(res => console.log(res))
    .catch(res => console.log(res));

```
---
+ API名称：getLockValue
```javascript
const Client = require('aliyun-api-gateway').Client;
const UUID = require('uuid');

// 用appKey和appSecret初始化客户端

const client = new Client('您的<AppKey>', '您的<AppSecret>');

const Gateway = async ({url, apiVer, params, iotToken}) => {

    return await client.post(url, {
        data: {
            id: UUID.v1(), // 请求唯一标识，必填
            version: '1.0', // 协议版本，固定值1.0
            request: {
                iotToken, // iottoken，选填
                apiVer // api版本，必填
            },
            params: params || {} // 业务参数，必填
        },
        headers: {
            accept: 'application/json'
        },
        timeout: 3000        
    });

};

const params = {
    url: 'http://fcaea944ce554e968c4dc6acdd53033b-cn-shanghai.alicloudapi.com/a123spAe9pmMS0F4/bfe4XmHpgjOXXA',
    apiVer: '1.0.0',
    params: {
        // 接口参数
        
		"action":"node_2b9116c0",
    }
}

Gateway(params)
    .then(res => console.log(res))
    .catch(res => console.log(res));

```
---
+ API名称：getGreenValue
```javascript
const Client = require('aliyun-api-gateway').Client;
const UUID = require('uuid');

// 用appKey和appSecret初始化客户端

const client = new Client('您的<AppKey>', '您的<AppSecret>');

const Gateway = async ({url, apiVer, params, iotToken}) => {

    return await client.post(url, {
        data: {
            id: UUID.v1(), // 请求唯一标识，必填
            version: '1.0', // 协议版本，固定值1.0
            request: {
                iotToken, // iottoken，选填
                apiVer // api版本，必填
            },
            params: params || {} // 业务参数，必填
        },
        headers: {
            accept: 'application/json'
        },
        timeout: 3000        
    });

};

const params = {
    url: 'http://fcaea944ce554e968c4dc6acdd53033b-cn-shanghai.alicloudapi.com/a123spAe9pmMS0F4/bf5Fp6rKIJR7u5',
    apiVer: '1.0.0',
    params: {
        // 接口参数
        
		"action":"node_d0e0d760",
    }
}

Gateway(params)
    .then(res => console.log(res))
    .catch(res => console.log(res));

```
---
+ API名称：getBlueValue
```javascript
const Client = require('aliyun-api-gateway').Client;
const UUID = require('uuid');

// 用appKey和appSecret初始化客户端

const client = new Client('您的<AppKey>', '您的<AppSecret>');

const Gateway = async ({url, apiVer, params, iotToken}) => {

    return await client.post(url, {
        data: {
            id: UUID.v1(), // 请求唯一标识，必填
            version: '1.0', // 协议版本，固定值1.0
            request: {
                iotToken, // iottoken，选填
                apiVer // api版本，必填
            },
            params: params || {} // 业务参数，必填
        },
        headers: {
            accept: 'application/json'
        },
        timeout: 3000        
    });

};

const params = {
    url: 'http://fcaea944ce554e968c4dc6acdd53033b-cn-shanghai.alicloudapi.com/a123spAe9pmMS0F4/bfbQxnHpJ25VtV',
    apiVer: '1.0.0',
    params: {
        // 接口参数
        
		"action":"node_93cbe5f0",
    }
}

Gateway(params)
    .then(res => console.log(res))
    .catch(res => console.log(res));

```
---
+ API名称：getLocation
```javascript
const Client = require('aliyun-api-gateway').Client;
const UUID = require('uuid');

// 用appKey和appSecret初始化客户端

const client = new Client('您的<AppKey>', '您的<AppSecret>');

const Gateway = async ({url, apiVer, params, iotToken}) => {

    return await client.post(url, {
        data: {
            id: UUID.v1(), // 请求唯一标识，必填
            version: '1.0', // 协议版本，固定值1.0
            request: {
                iotToken, // iottoken，选填
                apiVer // api版本，必填
            },
            params: params || {} // 业务参数，必填
        },
        headers: {
            accept: 'application/json'
        },
        timeout: 3000        
    });

};

const params = {
    url: 'http://fcaea944ce554e968c4dc6acdd53033b-cn-shanghai.alicloudapi.com/a123spAe9pmMS0F4/bfC2h9KdtEhecu',
    apiVer: '1.0.0',
    params: {
        // 接口参数
        
		"action":"node_fee4b250",
    }
}

Gateway(params)
    .then(res => console.log(res))
    .catch(res => console.log(res));

```
---
+ API名称：getTemp
```javascript
const Client = require('aliyun-api-gateway').Client;
const UUID = require('uuid');

// 用appKey和appSecret初始化客户端

const client = new Client('您的<AppKey>', '您的<AppSecret>');

const Gateway = async ({url, apiVer, params, iotToken}) => {

    return await client.post(url, {
        data: {
            id: UUID.v1(), // 请求唯一标识，必填
            version: '1.0', // 协议版本，固定值1.0
            request: {
                iotToken, // iottoken，选填
                apiVer // api版本，必填
            },
            params: params || {} // 业务参数，必填
        },
        headers: {
            accept: 'application/json'
        },
        timeout: 3000        
    });

};

const params = {
    url: 'http://fcaea944ce554e968c4dc6acdd53033b-cn-shanghai.alicloudapi.com/a123spAe9pmMS0F4/bfrpKKBq0783mF',
    apiVer: '1.0.0',
    params: {
        // 接口参数
        
		"action":"node_af145fb0",
    }
}

Gateway(params)
    .then(res => console.log(res))
    .catch(res => console.log(res));

```
---
## 渲染图
**下个版本推送上线**