'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = makeServiceActions;

var _utils = require('../utils');

function makeServiceActions(service, _ref) {
  var debug = _ref.debug;

  var serviceActions = {
    find: function find(_ref2) {
      var commit = _ref2.commit,
          dispatch = _ref2.dispatch,
          getters = _ref2.getters,
          state = _ref2.state;
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var idField = state.idField;

      var handleResponse = function handleResponse(response) {
        var _params$qid = params.qid,
            qid = _params$qid === undefined ? 'default' : _params$qid,
            query = params.query;


        dispatch('addOrUpdateList', response);
        commit('unsetFindPending');

        // The pagination data will be under `pagination.default` or whatever qid is passed.
        if (response.data) {
          commit('updatePaginationForQuery', { qid: qid, response: response, query: query });
          response.data = response.data.map(function (item) {
            var id = item[idField];

            return state.keyedById[id];
          });
        } else {
          response = response.map(function (item) {
            var id = item[idField];

            return state.keyedById[id];
          });
        }

        return response;
      };
      var handleError = function handleError(error) {
        commit('setFindError', error);
        commit('unsetFindPending');
        return Promise.reject(error);
      };
      var request = service.find(params);

      commit('setFindPending');

      if (service.rx) {
        Object.getPrototypeOf(request).catch(handleError);
      } else {
        request.catch(handleError);
      }

      return request.subscribe ? request.subscribe(handleResponse) : request.then(handleResponse);
    },


    // Two query syntaxes are supported, since actions only receive one argument.
    //   1. Just pass the id: `get(1)`
    //   2. Pass arguments as an array: `get([null, params])`
    get: function get(_ref3, args) {
      var state = _ref3.state,
          getters = _ref3.getters,
          commit = _ref3.commit,
          dispatch = _ref3.dispatch;
      var idField = state.idField;

      var id = void 0;
      var params = void 0;
      var skipRequestIfExists = void 0;

      if (Array.isArray(args)) {
        id = args[0];
        params = args[1];
      } else {
        id = args;
        params = {};
      }

      if ('skipRequestIfExists' in params) {
        skipRequestIfExists = params.skipRequestIfExists;
        delete params.skipRequestIfExists;
      } else {
        skipRequestIfExists = state.skipRequestIfExists;
      }

      function getFromRemote() {
        commit('setGetPending');
        return service.get(id, params).then(function (item) {
          var id = item[idField];

          dispatch('addOrUpdate', item);
          commit('setCurrent', item);
          commit('unsetGetPending');
          return state.keyedById[id];
        }).catch(function (error) {
          commit('setGetError', error);
          commit('unsetGetPending');
          return Promise.reject(error);
        });
      }

      // If the records is already in store, return it
      var existedItem = getters.get(id, params);
      if (existedItem) {
        commit('setCurrent', existedItem);
        if (!skipRequestIfExists) getFromRemote();
        return Promise.resolve(existedItem);
      }
      return getFromRemote();
    },
    create: function create(_ref4, dataOrArray) {
      var commit = _ref4.commit,
          dispatch = _ref4.dispatch,
          state = _ref4.state;
      var idField = state.idField;

      var data = void 0;
      var params = void 0;

      if (Array.isArray(dataOrArray)) {
        data = dataOrArray[0];
        params = dataOrArray[1];
      } else {
        data = dataOrArray;
      }

      commit('setCreatePending');

      return service.create(data, params).then(function (response) {
        if (Array.isArray(response)) {
          dispatch('addOrUpdateList', response);
          response = response.map(function (item) {
            var id = item[idField];

            return state.keyedById[id];
          });
        } else {
          var id = response[idField];

          dispatch('addOrUpdate', response);
          commit('setCurrent', response);
          response = state.keyedById[id];
        }
        commit('unsetCreatePending');
        return response;
      }).catch(function (error) {
        commit('setCreateError', error);
        commit('unsetCreatePending');
        return Promise.reject(error);
      });
    },
    update: function update(_ref5, _ref6) {
      var commit = _ref5.commit,
          dispatch = _ref5.dispatch,
          state = _ref5.state;

      var _ref7 = _slicedToArray(_ref6, 3),
          id = _ref7[0],
          data = _ref7[1],
          params = _ref7[2];

      var idField = state.idField;


      commit('setUpdatePending');

      return service.update(id, data, params).then(function (item) {
        var id = item[idField];
        dispatch('addOrUpdate', item);
        commit('unsetUpdatePending');
        return state.keyedById[id];
      }).catch(function (error) {
        commit('setUpdateError', error);
        commit('unsetUpdatePending');
        return Promise.reject(error);
      });
    },
    patch: function patch(_ref8, _ref9) {
      var commit = _ref8.commit,
          dispatch = _ref8.dispatch,
          state = _ref8.state;

      var _ref10 = _slicedToArray(_ref9, 3),
          id = _ref10[0],
          data = _ref10[1],
          params = _ref10[2];

      var idField = state.idField;


      commit('setPatchPending');

      return service.patch(id, data, params).then(function (item) {
        var id = item[idField];

        dispatch('addOrUpdate', item);
        commit('unsetPatchPending');
        return state.keyedById[id];
      }).catch(function (error) {
        commit('setPatchError', error);
        commit('unsetPatchPending');
        return Promise.reject(error);
      });
    },
    remove: function remove(_ref11, idOrArray) {
      var commit = _ref11.commit,
          dispatch = _ref11.dispatch;

      var id = void 0;
      var params = void 0;

      if (Array.isArray(idOrArray)) {
        id = idOrArray[0];
        params = idOrArray[1];
      } else {
        id = idOrArray;
      }

      commit('setRemovePending');

      return service.remove(id, params).then(function (item) {
        commit('removeItem', id);
        commit('unsetRemovePending');
        return item;
      }).catch(function (error) {
        commit('setRemoveError', error);
        commit('unsetRemovePending');
        return Promise.reject(error);
      });
    }
  };

  var actions = {
    addOrUpdateList: function addOrUpdateList(_ref12, response) {
      var state = _ref12.state,
          commit = _ref12.commit;

      var list = response.data || response;
      var isPaginated = response.hasOwnProperty('total');
      var toAdd = [];
      var toUpdate = [];
      var toRemove = [];
      var idField = state.idField,
          autoRemove = state.autoRemove;


      list.forEach(function (item, index) {
        var id = item[idField];
        var existingItem = state.keyedById[id];

        var isIdOk = (0, _utils.checkId)(id, item, debug);

        if (isIdOk) {
          existingItem ? toUpdate.push(item) : toAdd.push(item);
        }
      });

      if (!isPaginated && autoRemove) {
        // Find IDs from the state which are not in the list
        state.ids.forEach(function (id) {
          if (id !== state.currentId && !list.some(function (item) {
            return item[idField] === id;
          })) {
            toRemove.push(state.keyedById[id]);
          }
        });
        commit('removeItems', toRemove); // commit removal
      }

      if (service.Model) {
        toAdd.forEach(function (item, index) {
          toAdd[index] = new service.Model(item);
        });
      }

      commit('addItems', toAdd);
      commit('updateItems', toUpdate);
    },
    addOrUpdate: function addOrUpdate(_ref13, item) {
      var state = _ref13.state,
          commit = _ref13.commit;
      var idField = state.idField;

      var id = item[idField];
      var existingItem = state.keyedById[id];

      var isIdOk = (0, _utils.checkId)(id, item, debug);

      if (service.Model && !existingItem && !item.isFeathersVuexInstance) {
        item = new service.Model(item);
      }

      if (isIdOk) {
        existingItem ? commit('updateItem', item) : commit('addItem', item);
      }
    }
  };
  Object.keys(serviceActions).map(function (method) {
    if (service[method] && typeof service[method] === 'function') {
      actions[method] = serviceActions[method];
    }
  });
  return actions;
}
module.exports = exports['default'];