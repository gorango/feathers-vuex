'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = makeServiceGetters;

var _feathersQueryFilters = require('feathers-query-filters');

var _feathersQueryFilters2 = _interopRequireDefault(_feathersQueryFilters);

var _sift = require('sift');

var _sift2 = _interopRequireDefault(_sift);

var _feathersCommons = require('feathers-commons');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function makeServiceGetters(servicePath) {
  return {
    list: function list(state) {
      return state.ids.map(function (id) {
        return state.keyedById[id];
      });
    },

    find: function find(state) {
      return function () {
        var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var _getFilter = (0, _feathersQueryFilters2.default)(params.query || {}),
            query = _getFilter.query,
            filters = _getFilter.filters;

        var values = _feathersCommons._.values(state.keyedById);
        values = (0, _sift2.default)(query, values);

        var total = values.length;

        if (filters.$sort) {
          values.sort((0, _feathersCommons.sorter)(filters.$sort));
        }

        if (filters.$skip) {
          values = values.slice(filters.$skip);
        }

        if (typeof filters.$limit !== 'undefined') {
          values = values.slice(0, filters.$limit);
        }

        if (filters.$select) {
          values = values.map(function (value) {
            return _feathersCommons._.pick.apply(_feathersCommons._, [value].concat(_toConsumableArray(filters.$select)));
          });
        }

        return {
          total: total,
          limit: filters.$limit || 0,
          skip: filters.$skip || 0,
          data: values
        };
      };
    },
    get: function get(_ref) {
      var keyedById = _ref.keyedById,
          idField = _ref.idField;
      return function (id) {
        var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        return keyedById[id] ? (0, _feathersCommons.select)(params, idField)(keyedById[id]) : undefined;
      };
    },
    current: function current(state) {
      return state.currentId ? state.keyedById[state.currentId] : null;
    },
    getCopy: function getCopy(state) {
      return state.copy ? state.copy : null;
    },

    getCopyById: function getCopyById(state) {
      return function (id) {
        return state.copiesById[id];
      };
    }
  };
}
module.exports = exports['default'];