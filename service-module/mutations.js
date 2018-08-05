'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = makeServiceMutations;

var _lodash = require('lodash.merge');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.clonedeep');

var _lodash4 = _interopRequireDefault(_lodash3);

var _serializeError = require('serialize-error');

var _serializeError2 = _interopRequireDefault(_serializeError);

var _lodash5 = require('lodash.isobject');

var _lodash6 = _interopRequireDefault(_lodash5);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function makeServiceMutations(servicePath, _ref) {
  var debug = _ref.debug,
      globalModels = _ref.globalModels;

  globalModels = globalModels || { byServicePath: {} };

  function _addItem(state, item) {
    var idField = state.idField;

    var Model = globalModels.byServicePath[servicePath];
    var id = item[idField];
    var isIdOk = (0, _utils.checkId)(id, item, debug);

    if (isIdOk) {
      if (Model && !item.isFeathersVuexInstance) {
        item = new Model(item);
      }

      // Only add the id if it's not already in the `ids` list.
      if (!state.ids.includes(id)) {
        state.ids.push(id);
      }

      state.keyedById = _extends({}, state.keyedById, _defineProperty({}, id, item));
    }
  }

  function _updateItem(state, item) {
    var idField = state.idField,
        replaceItems = state.replaceItems,
        addOnUpsert = state.addOnUpsert;

    var id = item[idField];
    var isIdOk = (0, _utils.checkId)(id, item, debug);

    // Simply rewrite the record if the it's already in the `ids` list.
    if (isIdOk && state.ids.includes(id)) {
      if (replaceItems) {
        state.keyedById[id] = item;
      } else {
        (0, _lodash2.default)(state.keyedById[id], item);
      }
      return;
    }

    // if addOnUpsert then add the record into the state, else discard it.
    if (addOnUpsert) {
      state.ids.push(id);
      state.keyedById = _extends({}, state.keyedById, _defineProperty({}, id, item));
    }
  }

  return {
    addItem: function addItem(state, item) {
      _addItem(state, item);
    },
    addItems: function addItems(state, items) {
      items.forEach(function (item) {
        return _addItem(state, item);
      });
    },
    updateItem: function updateItem(state, item) {
      _updateItem(state, item);
    },
    updateItems: function updateItems(state, items) {
      if (!Array.isArray(items)) {
        throw new Error('You must provide an array to the `removeItems` mutation.');
      }
      items.forEach(function (item) {
        return _updateItem(state, item);
      });
    },
    removeItem: function removeItem(state, item) {
      var idField = state.idField;

      var idToBeRemoved = (0, _lodash6.default)(item) ? item[idField] : item;
      var keyedById = {};
      var currentId = state.currentId;

      var isIdOk = (0, _utils.checkId)(idToBeRemoved, item, debug);

      if (isIdOk) {
        state.ids = state.ids.filter(function (id) {
          if (id === idToBeRemoved) {
            return false;
          } else {
            keyedById[id] = state.keyedById[id];
            return true;
          }
        });

        state.keyedById = keyedById;

        if (currentId === idToBeRemoved) {
          state.currentId = null;
          state.copy = null;
        }
      }
    },
    removeItems: function removeItems(state, items) {
      var idField = state.idField;


      if (!Array.isArray(items)) {
        throw new Error('You must provide an array to the `removeItems` mutation.');
      }
      var containsObjects = items[0] && (0, _lodash6.default)(items[0]);
      var keyedById = {};
      var currentId = state.currentId;
      var idsToRemove = items;
      var mapOfIdsToRemove = {};

      // If the array contains objects, create an array of ids. Assume all are the same.
      if (containsObjects) {
        idsToRemove = items.map(function (item) {
          return item[idField];
        });
      }

      // Make a hash map of the idsToRemove, so we don't have to iterate inside a loop
      idsToRemove.forEach(function (idToRemove) {
        mapOfIdsToRemove[idToRemove] = idToRemove;
      });

      // Filter the ids to be those we're keeping. Also create new keyedById.
      state.ids = state.ids.filter(function (id) {
        if (mapOfIdsToRemove[id]) {
          return false;
        } else {
          keyedById[id] = state.keyedById[id];
          return true;
        }
      });

      state.keyedById = keyedById;

      if (currentId && mapOfIdsToRemove[currentId]) {
        state.currentId = null;
        state.copy = null;
      }
    },
    clearAll: function clearAll(state) {
      state.ids = [];
      state.currentId = null;
      state.copy = null;
      state.keyedById = {};
    },
    clearList: function clearList(state) {
      var currentId = state.currentId;
      var current = state.keyedById[currentId];

      if (currentId && current) {
        state.keyedById = _defineProperty({}, currentId, current);
        state.ids = [currentId];
      } else {
        state.keyedById = {};
        state.ids = [];
      }
    },
    setCurrent: function setCurrent(state, itemOrId) {
      var idField = state.idField;

      var id = void 0;
      var item = void 0;
      if ((0, _lodash6.default)(itemOrId)) {
        id = itemOrId[idField];
        item = itemOrId;
      } else {
        id = itemOrId;
        item = state.keyedById[id];
      }
      state.currentId = id;
      state.copy = (0, _lodash4.default)(item);
    },
    clearCurrent: function clearCurrent(state) {
      state.currentId = null;
      state.copy = null;
    },


    // Removes the copy from copiesById
    clearCopy: function clearCopy(state, id) {
      var newCopiesById = Object.assign({}, state.copiesById);
      delete newCopiesById[id];
      state.copiesById = newCopiesById;
    },


    // Creates a copy of the record with the passed-in id, stores it in copiesById
    createCopy: function createCopy(state, id) {
      var current = state.keyedById[id];
      var Model = globalModels.byServicePath[servicePath];
      var copyData = (0, _lodash2.default)({}, current);
      var copy = new Model(copyData, { isClone: true });

      if (state.keepCopiesInStore) {
        state.copiesById[id] = copy;
      } else {
        Model.copiesById[id] = copy;
      }
    },


    // Resets the copy to match the original record, locally
    rejectCopy: function rejectCopy(state, id) {
      var isIdOk = (0, _utils.checkId)(id, undefined, debug);
      var current = isIdOk ? state.keyedById[id] : state.keyedById[state.currentId];
      var Model = globalModels.byServicePath[servicePath];
      var copy = void 0;

      if (state.keepCopiesInStore || !Model) {
        copy = isIdOk ? state.copiesById[id] : state.copy;
      } else {
        copy = Model.copiesById[id];
      }

      (0, _lodash2.default)(copy, current);
    },


    // Deep assigns copy to original record, locally
    commitCopy: function commitCopy(state, id) {
      var isIdOk = (0, _utils.checkId)(id, undefined, debug);
      var current = isIdOk ? state.keyedById[id] : state.keyedById[state.currentId];
      var Model = globalModels.byServicePath[servicePath];
      var copy = void 0;

      if (state.keepCopiesInStore || !Model) {
        copy = isIdOk ? state.copiesById[id] : state.copy;
      } else {
        copy = Model.copiesById[id];
      }

      (0, _lodash2.default)(current, copy);
    },


    // Stores pagination data on state.pagination based on the query identifier (qid)
    // The qid must be manually assigned to `params.qid`
    updatePaginationForQuery: function updatePaginationForQuery(state, _ref2) {
      var qid = _ref2.qid,
          response = _ref2.response,
          query = _ref2.query;
      var data = response.data,
          limit = response.limit,
          skip = response.skip,
          total = response.total;
      var idField = state.idField;

      var ids = data.map(function (item) {
        return item[idField];
      });
      state.pagination = _extends({}, state.pagination, _defineProperty({}, qid, { limit: limit, skip: skip, total: total, ids: ids, query: query }));
    },
    setFindPending: function setFindPending(state) {
      state.isFindPending = true;
    },
    unsetFindPending: function unsetFindPending(state) {
      state.isFindPending = false;
    },
    setGetPending: function setGetPending(state) {
      state.isGetPending = true;
    },
    unsetGetPending: function unsetGetPending(state) {
      state.isGetPending = false;
    },
    setCreatePending: function setCreatePending(state) {
      state.isCreatePending = true;
    },
    unsetCreatePending: function unsetCreatePending(state) {
      state.isCreatePending = false;
    },
    setUpdatePending: function setUpdatePending(state) {
      state.isUpdatePending = true;
    },
    unsetUpdatePending: function unsetUpdatePending(state) {
      state.isUpdatePending = false;
    },
    setPatchPending: function setPatchPending(state) {
      state.isPatchPending = true;
    },
    unsetPatchPending: function unsetPatchPending(state) {
      state.isPatchPending = false;
    },
    setRemovePending: function setRemovePending(state) {
      state.isRemovePending = true;
    },
    unsetRemovePending: function unsetRemovePending(state) {
      state.isRemovePending = false;
    },
    setFindError: function setFindError(state, payload) {
      state.errorOnFind = Object.assign({}, (0, _serializeError2.default)(payload));
    },
    clearFindError: function clearFindError(state) {
      state.errorOnFind = null;
    },
    setGetError: function setGetError(state, payload) {
      state.errorOnGet = Object.assign({}, (0, _serializeError2.default)(payload));
    },
    clearGetError: function clearGetError(state) {
      state.errorOnGet = null;
    },
    setCreateError: function setCreateError(state, payload) {
      state.errorOnCreate = Object.assign({}, (0, _serializeError2.default)(payload));
    },
    clearCreateError: function clearCreateError(state) {
      state.errorOnCreate = null;
    },
    setUpdateError: function setUpdateError(state, payload) {
      state.errorOnUpdate = Object.assign({}, (0, _serializeError2.default)(payload));
    },
    clearUpdateError: function clearUpdateError(state) {
      state.errorOnUpdate = null;
    },
    setPatchError: function setPatchError(state, payload) {
      state.errorOnPatch = Object.assign({}, (0, _serializeError2.default)(payload));
    },
    clearPatchError: function clearPatchError(state) {
      state.errorOnPatch = null;
    },
    setRemoveError: function setRemoveError(state, payload) {
      state.errorOnRemove = Object.assign({}, (0, _serializeError2.default)(payload));
    },
    clearRemoveError: function clearRemoveError(state) {
      state.errorOnRemove = null;
    }
  };
}
module.exports = exports['default'];