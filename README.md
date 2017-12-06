# node-oidc-provider-dynamodb-adapter

Adapter for DyanmoDB that can be used in [panva/node-oidc-provider](https://github.com/panva/node-oidc-provider).  

## Setup

```
$ npm install --save oidc-provider-dynamodb-adapter
```

## Usage

```
const DynamoDBAdapter = require('oidc-provider-dynamodb-adapter')

DynamoDBAdapter.setConfig({
  dynamoDB: new DynamoDB({
    accessKeyId: 'access-key-id',
    secretAccessKey: 'secret-access-key',
    region: 'ap-northeast-1'
  }),
  tableName: 'oidc-provider'
})
```

## Fallback
oidc-provider works only with Node.JS >= 8.0.0, and this adapter is basically the same.  
However, this package provides a fallback code that allows it to work on older environments (eg AWS Lambda's Node 6.10).  
When using it, please do as follows.  

```
const DynamoDBAdapter = require('oidc-provider-dynamodb-adapter/fallback')
```
