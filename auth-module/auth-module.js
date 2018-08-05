'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = authPluginInit;

var _state = require('./state');

var _state2 = _interopRequireDefault(_state);

var _getters = require('./getters');

var _getters2 = _interopRequireDefault(_getters);

var _mutations = require('./mutations');

var _mutations2 = _interopRequireDefault(_mutations);

var _actions = require('./actions');

var _actions2 = _interopRequireDefault(_actions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaults = {
  namespace: 'auth',
  userService: '', // Set this to automatically populate the user (using an additional request) on login success.
  state: {}, // for custom state
  getters: {}, // for custom getters
  mutations: {}, // for custom mutations
  actions: {} // for custom actions
};

function authPluginInit(feathersClient) {
  var globalOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var globalModels = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!feathersClient || !feathersClient.service) {
    throw new Error('You must pass a Feathers Client instance to feathers-vuex');
  }

  return function createAuthModule(options) {
    options = Object.assign({}, defaults, options);

    if (!feathersClient.authenticate) {
      throw new Error('You must register the feathers-authentication-client plugin before using the feathers-vuex auth module');
    }

    var defaultState = (0, _state2.default)(options);
    var defaultGetters = (0, _getters2.default)();
    var defaultMutations = (0, _mutations2.default)(feathersClient);
    var defaultActions = (0, _actions2.default)(feathersClient, globalModels);

    return function setupStore(store) {
      var _options = options,
          namespace = _options.namespace;


      store.registerModule(namespace, {
        namespaced: true,
        state: Object.assign({}, defaultState, options.state),
        getters: Object.assign({}, defaultGetters, options.getters),
        mutations: Object.assign({}, defaultMutations, options.mutations),
        actions: Object.assign({}, defaultActions, options.actions)
      });
    };
  };
}
module.exports = exports['default'];