const { DynamoDB } = require('aws-sdk')
const vogels = require('vogels')
const Joi = require('joi')

let _config = {
  dynamoDB: new DynamoDB(),
  tableName: 'oidc-provider'
}

let Model

const _setup = () => {
  vogels.dynamoDriver(_config.dynamoDB)

  Model = vogels.define('Model', {
    hashKey: 'id',
    timestamps: true,

    schema: Joi.object().keys({
      id: Joi.string().required()
    }).unknown(),

    tableName: _config.tableName
  })
}

const setConfig = (config = {}) => {
  _config = Object.assign({}, _config, config)
  _setup()
}

_setup()

class DynamoDBAdapter {

  static async connect(provider) {
    return true
  }

  static setConfig(config) {
    setConfig(config)
  }

  constructor(name) {
    this.name = name
    this.model = Model
  }

  async upsert(id, payload, expiresIn) {
    if (payload.grantId) {
      await this._upsertGrantId(payload.grantId, id)
    }

    const attrs = Object.assign(
      { id: this._getKeyId(id) },
      { payload },
      (payload.grantId) ? { grantId: payload.grantId } : undefined,
      (expiresIn) ? { expiresAt: Math.floor(Date.now() / 1000) + expiresIn } : undefined
    )

    return new Promise((resolve, reject) => {
      this.model.create(attrs, error => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  async find(id) {
    const attrs = await this._get(this._getKeyId(id))
    return (attrs) ?
      (attrs.consumedAt) ?
        Object.assign({}, attrs.payload, { consumed: true }) :
        attrs.payload :
      undefined
  }

  async consume(id) {
    return new Promise((resolve, reject) => {
      this.model.update({
        id: this._getKeyId(id),
        consumedAt: Math.floor(Date.now() / 1000)
      }, (error, item) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  async destroy(id) {
    const attrs = await this._get(this._getKeyId(id))

    if (attrs.grantId) {
      const grantIdAttrs = await this._get(this._getKeyGrantId(attrs.grantId))
      return grantIdAttrs.ids.reduce(async (acc, id) => {
        await acc
        return this._destroy(id)
      }, Promise.resolve())
    } else {
      return this._destroy(attrs.id)
    }
  }

  async _upsertGrantId(grantId, id) {
    const keyGrantId = this._getKeyGrantId(grantId)
    const keyId = this._getKeyId(id)

    const attrs = await this._get(keyGrantId)

    const updated = { id: keyGrantId, ids: [keyId] }

    if (attrs) {
      updated.ids = [].concat(attrs.ids, updated.ids)
    }

    return new Promise((resolve, reject) => {
      this.model.create(updated, (error, item) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  async _get(keyId) {
    return new Promise((resolve, reject) => {
      this.model.get(keyId, (error, item) => {
        if (error) {
          reject(error)
          return
        }

        if (item) {
          resolve(item.attrs)
        } else {
          resolve(undefined)
        }
      })
    })
  }

  async _destroy(keyId) {
    return new Promise((resolve, reject) => {
      this.model.destroy(keyId, error => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  _getKeyId(id) {
    return `${this.name}:${id}`
  }

  _getKeyGrantId(grantId) {
    return `grant:${grantId}`
  }

}

module.exports = DynamoDBAdapter
