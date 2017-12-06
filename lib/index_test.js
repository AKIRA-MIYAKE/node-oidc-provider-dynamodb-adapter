require('@babel/polyfill')
require('@babel/register')({
  presets: [
    ["@babel/preset-env", {
      "targets": { "node": "6.10" }
    }]
  ],
  ignore: [filename => {
    if (filename.match(/node_modules\/oidc-provider/)) {
      return false
    } else if (filename.match(/node_modules\/koa/)) {
      return false
    } else if (filename.match(/node_modules/)) {
      return true
    } else {
      return false
    }
  }],
  cache: false,
  babelrc: false
})

const url = require('url')
const whatwgUrl = require('whatwg-url')

Object.entries(whatwgUrl).forEach(([k, v]) => {
  url[k] = v
})


const { DynamoDB } = require('aws-sdk')
const Provider = require('oidc-provider');
const DynamoDBAdapter = require('./index');

const dynamoDB = new DynamoDB({
  endpoint: 'http://localstack:4569',
  accessKeyId: 'access-key-id',
  secretAccessKey: 'secret-access-key',
  region: 'ap-northeast-1'
})
const tableName = 'test_oidc_provider'

DynamoDBAdapter.setConfig({ dynamoDB, tableName })

const { AdapterTest } = Provider;

const provider = new Provider('http://localhost');
const test = new AdapterTest(provider);

Promise.resolve()
.then(() => {
  return new Promise((resolve, reject) => {
    dynamoDB.createTable({
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      },
      TableName: tableName
    }, (error, data) => {
      if (error) {
        console.log(error)
      }
      resolve()
    })
  })
})
.then(() => provider.initialize({ adapter: DynamoDBAdapter }))
.then(() => test.execute())
.then(() => {
  return new Promise((resolve, reject) => {
    dynamoDB.deleteTable({
      TableName: tableName
    }, error => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
})
.then(() => {
  console.log('tests passed');
  process.exit();
})
.catch((err) => {
  console.dir(err);
  process.exit(1);
});
