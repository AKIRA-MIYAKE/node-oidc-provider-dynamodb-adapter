function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const {
  DynamoDB
} = require('aws-sdk');

const vogels = require('vogels');

const Joi = require('joi');

let _config = {
  dynamoDB: new DynamoDB(),
  tableName: 'oidc-provider'
};
let Model;

const _setup = () => {
  vogels.dynamoDriver(_config.dynamoDB);
  Model = vogels.define('Model', {
    hashKey: 'id',
    timestamps: true,
    schema: Joi.object().keys({
      id: Joi.string().required()
    }).unknown(),
    tableName: _config.tableName
  });
};

const setConfig = (config = {}) => {
  _config = Object.assign({}, _config, config);

  _setup();
};

_setup();

class DynamoDBAdapter {
  static connect(provider) {
    return _asyncToGenerator(function* () {
      return true;
    })();
  }

  static setConfig(config) {
    setConfig(config);
  }

  constructor(name) {
    this.name = name;
    this.model = Model;
  }

  upsert(id, payload, expiresIn) {
    var _this = this;

    return _asyncToGenerator(function* () {
      if (payload.grantId) {
        yield _this._upsertGrantId(payload.grantId, id);
      }

      const attrs = Object.assign({
        id: _this._getKeyId(id)
      }, {
        payload
      }, payload.grantId ? {
        grantId: payload.grantId
      } : undefined, expiresIn ? {
        expiresAt: Math.floor(Date.now() / 1000) + expiresIn
      } : undefined);
      return new Promise((resolve, reject) => {
        _this.model.create(attrs, error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    })();
  }

  find(id) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const attrs = yield _this2._get(_this2._getKeyId(id));
      return attrs ? attrs.consumedAt ? Object.assign({}, attrs.payload, {
        consumed: true
      }) : attrs.payload : undefined;
    })();
  }

  consume(id) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      return new Promise((resolve, reject) => {
        _this3.model.update({
          id: _this3._getKeyId(id),
          consumedAt: Math.floor(Date.now() / 1000)
        }, (error, item) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    })();
  }

  destroy(id) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      const attrs = yield _this4._get(_this4._getKeyId(id));

      if (attrs.grantId) {
        const grantIdAttrs = yield _this4._get(_this4._getKeyGrantId(attrs.grantId));
        return grantIdAttrs.ids.reduce(
        /*#__PURE__*/
        (() => {
          var _ref = _asyncToGenerator(function* (acc, id) {
            yield acc;
            return _this4._destroy(id);
          });

          return function (_x, _x2) {
            return _ref.apply(this, arguments);
          };
        })(), Promise.resolve());
      } else {
        return _this4._destroy(attrs.id);
      }
    })();
  }

  _upsertGrantId(grantId, id) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      const keyGrantId = _this5._getKeyGrantId(grantId);

      const keyId = _this5._getKeyId(id);

      const attrs = yield _this5._get(keyGrantId);
      const updated = {
        id: keyGrantId,
        ids: [keyId]
      };

      if (attrs) {
        updated.ids = [].concat(attrs.ids, updated.ids);
      }

      return new Promise((resolve, reject) => {
        _this5.model.create(updated, (error, item) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    })();
  }

  _get(keyId) {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      return new Promise((resolve, reject) => {
        _this6.model.get(keyId, (error, item) => {
          if (error) {
            reject(error);
            return;
          }

          if (item) {
            resolve(item.attrs);
          } else {
            resolve(undefined);
          }
        });
      });
    })();
  }

  _destroy(keyId) {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      return new Promise((resolve, reject) => {
        _this7.model.destroy(keyId, error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    })();
  }

  _getKeyId(id) {
    return `${this.name}:${id}`;
  }

  _getKeyGrantId(grantId) {
    return `grant:${grantId}`;
  }

}

module.exports = DynamoDBAdapter;