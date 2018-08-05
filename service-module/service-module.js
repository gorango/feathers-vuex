'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = servicePluginInit;

var _utils = require('../utils');

var _state = require('./state');

var _state2 = _interopRequireDefault(_state);

var _getters = require('./getters');

var _getters2 = _interopRequireDefault(_getters);

var _mutations = require('./mutations');

var _mutations2 = _interopRequireDefault(_mutations);

var _actions = require('./actions');

var _actions2 = _interopRequireDefault(_actions);

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaults = {
  idField: 'id', // The field in each record that will contain the id
  autoRemove: false, // Automatically remove records missing from responses (only use with feathers-rest)
  nameStyle: 'short', // Determines the source of the module name. 'short', 'path', or 'explicit'
  enableEvents: true, // Listens to socket.io events when available
  addOnUpsert: false, // Add new records pushed by 'updated/patched' socketio events into store, instead of discarding them
  skipRequestIfExists: false, // For get action, if the record already exists in store, skip the remote request
  preferUpdate: false, // When true, calling model.save() will do an update instead of a patch.
  apiPrefix: '', // Setting to 'api1/' will prefix the store moduleName, unless `namespace` is used, then this is ignored.
  debug: false, // Set to true to enable logging messages.
  modelPath: '', // The location of this service's Model in the Vue plugin (globalModels object). Added in the servicePlugin method
  instanceDefaults: {}, // The default values for the instance when `const instance =new Model()`
  replaceItems: false, // Instad of merging in changes in the store, replace the entire record.
  keepCopiesInStore: false, // Set to true to store cloned copies in the store instead of on the Model.
  state: {}, // for custom state
  getters: {}, // for custom getters
  mutations: {}, // for custom mutations
  actions: {} // for custom actions
};

function servicePluginInit(feathersClient) {
  var globalOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var globalModels = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  globalModels.byServicePath = globalModels.byServicePath || {};
  if (!feathersClient || !feathersClient.service) {
    throw new Error('You must provide a Feathers Client instance to feathers-vuex');
  }

  globalOptions = Object.assign({}, defaults, globalOptions);

  var serviceModule = function serviceModule(servicePath) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (!feathersClient || !feathersClient.service) {
      throw new Error('You must provide a service path or object to create a feathers-vuex service module');
    }

    options = Object.assign({}, globalOptions, options);
    var _options = options,
        debug = _options.debug,
        apiPrefix = _options.apiPrefix;


    if (typeof servicePath !== 'string') {
      throw new Error('The first argument to setup a feathers-vuex service must be a string');
    }

    var service = feathersClient.service(servicePath);
    if (!service) {
      throw new Error('No service was found. Please configure a transport plugin on the Feathers Client. Make sure you use the client version of the transport, like `feathers-socketio/client` or `feathers-rest/client`.');
    }
    var paginate = service.hasOwnProperty('paginate') && service.paginate.hasOwnProperty('default');
    var stateOptions = Object.assign(options, { paginate: paginate });

    var defaultState = (0, _state2.default)(servicePath, stateOptions);
    var defaultGetters = (0, _getters2.default)(servicePath);
    var defaultMutations = (0, _mutations2.default)(servicePath, { debug: debug, globalModels: globalModels, apiPrefix: apiPrefix });
    var defaultActions = (0, _actions2.default)(service, { debug: debug });
    var module = {
      namespaced: true,
      state: Object.assign({}, defaultState, options.state),
      getters: Object.assign({}, defaultGetters, options.getters),
      mutations: Object.assign({}, defaultMutations, options.mutations),
      actions: Object.assign({}, defaultActions, options.actions)
    };
    return module;
  };

  var serviceModel = function serviceModel(options) {
    options = Object.assign({}, globalOptions, options, { globalModels: globalModels });
    var Model = (0, _model2.default)(options);

    return Model;
  };

  var servicePlugin = function servicePlugin(module, Model) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    options = Object.assign({}, globalOptions, options);
    var servicePath = module.state.servicePath;
    var _options2 = options,
        nameStyle = _options2.nameStyle,
        apiPrefix = _options2.apiPrefix;

    var service = feathersClient.service(servicePath);

    var nameStyles = {
      short: _utils.getShortName,
      path: _utils.getNameFromPath
    };
    var namespace = options.namespace || nameStyles[nameStyle](servicePath);

    return function setupStore(store) {
      service.Model = Model;
      // Add servicePath to Model so it can be accessed
      Object.defineProperties(Model, {
        servicePath: {
          value: servicePath
        },
        namespace: {
          value: namespace
        },
        store: {
          value: store
        }
      });

      // Add Model to the globalModels object, so it's available in the Vue plugin
      var modelInfo = (0, _utils.registerModel)(Model, globalModels, apiPrefix, servicePath);

      Object.defineProperty(Model, 'name', { value: modelInfo.name });
      module.state.modelPath = modelInfo.path;
      store.registerModule(namespace, module);

      // Upgrade the Model's API methods to use the store.actions
      Object.defineProperties(Model.prototype, {
        _clone: {
          value: function value(id) {
            store.commit(namespace + '/createCopy', id);

            if (store.state[Model.servicePath].keepCopiesInStore) {
              return store.getters[namespace + '/getCopyById'](id);
            } else {
              return Model.copiesById[id];
            }
          }
        },
        _commit: {
          value: function value(id) {
            store.commit(namespace + '/commitCopy', id);
          }
        },
        _reset: {
          value: function value(id) {
            store.commit(namespace + '/rejectCopy', id);
          }
        },
        _create: {
          value: function value(data, params) {
            return store.dispatch(namespace + '/create', [data, params]);
          }
        },
        _patch: {
          value: function value(id, data, params) {
            return store.dispatch(namespace + '/patch', [id, data, params]);
          }
        },
        _update: {
          value: function value(id, data, params) {
            return store.dispatch(namespace + '/update', [id, data, params]);
          }
        },
        _remove: {
          value: function value(id, params) {
            return store.dispatch(namespace + '/remove', [id, params]);
          }
        }
      });

      if (options.enableEvents) {
        // Listen to socket events when available.
        service.on('created', function (item) {
          return store.commit(namespace + '/addItem', item);
        });
        service.on('updated', function (item) {
          return store.commit(namespace + '/updateItem', item);
        });
        service.on('patched', function (item) {
          return store.commit(namespace + '/updateItem', item);
        });
        service.on('removed', function (item) {
          return store.commit(namespace + '/removeItem', item);
        });
      }
    };
  };

  var createServicePlugin = function createServicePlugin(servicePath) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var module = serviceModule(servicePath, options);
    var Model = serviceModel(options);

    return servicePlugin(module, Model, options);
  };

  Object.assign(createServicePlugin, {
    serviceModule: serviceModule,
    serviceModel: serviceModel,
    servicePlugin: servicePlugin
  });

  return createServicePlugin;
}
module.exports = exports['default'];