'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initAuth = exports.isBrowser = exports.isNode = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.stripSlashes = stripSlashes;
exports.upperCaseFirst = upperCaseFirst;
exports.getShortName = getShortName;
exports.getNameFromPath = getNameFromPath;
exports.getValidPayloadFromToken = getValidPayloadFromToken;
exports.payloadIsValid = payloadIsValid;
exports.readCookie = readCookie;
exports.checkId = checkId;
exports.registerModel = registerModel;
exports.getModelName = getModelName;
exports.setByDot = setByDot;

var _lodash = require('lodash.trim');

var _lodash2 = _interopRequireDefault(_lodash);

var _jwtDecode = require('jwt-decode');

var _jwtDecode2 = _interopRequireDefault(_jwtDecode);

var _inflection = require('inflection');

var _inflection2 = _interopRequireDefault(_inflection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function stripSlashes(location) {
  return Array.isArray(location) ? location.map(function (l) {
    return (0, _lodash2.default)(l, '/');
  }) : (0, _lodash2.default)(location, '/');
}

function upperCaseFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getShortName(service) {
  var namespace = stripSlashes(service);
  if (Array.isArray(namespace)) {
    namespace = namespace.slice(-1);
  } else if (namespace.includes('/')) {
    namespace = namespace.slice(namespace.lastIndexOf('/') + 1);
  }
  return namespace;
}

function getNameFromPath(service) {
  return stripSlashes(service);
}

// from https://github.com/iliakan/detect-node
var isNode = exports.isNode = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';

var isBrowser = exports.isBrowser = !isNode;

var authDefaults = {
  commit: undefined,
  req: undefined,
  moduleName: 'auth',
  cookieName: 'feathers-jwt'
};

var initAuth = exports.initAuth = function initAuth(options) {
  var _Object$assign = Object.assign({}, authDefaults, options),
      commit = _Object$assign.commit,
      req = _Object$assign.req,
      moduleName = _Object$assign.moduleName,
      cookieName = _Object$assign.cookieName;

  if (typeof commit !== 'function') {
    throw new Error('You must pass the `commit` function in the `initAuth` function options.');
  }
  if (!req) {
    throw new Error('You must pass the `req` object in the `initAuth` function options.');
  }

  var accessToken = readCookie(req.headers.cookie, cookieName);
  var payload = getValidPayloadFromToken(accessToken);

  if (payload) {
    commit(moduleName + '/setAccessToken', accessToken);
    commit(moduleName + '/setPayload', payload);
  }
  return Promise.resolve(payload);
};

function getValidPayloadFromToken(token) {
  if (token) {
    try {
      var payload = (0, _jwtDecode2.default)(token);
      return payloadIsValid(payload) ? payload : undefined;
    } catch (error) {
      return undefined;
    }
  }
  return undefined;
}

// Pass a decoded payload and it will return a boolean based on if it hasn't expired.
function payloadIsValid(payload) {
  return payload && payload.exp * 1000 > new Date().getTime();
}

// Reads and returns the contents of a cookie with the provided name.
function readCookie(cookies, name) {
  if (!cookies) {
    return undefined;
  }
  var nameEQ = name + '=';
  var ca = cookies.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
}

function checkId(id, item, debug) {
  if (id === undefined || id === null) {
    if (debug) {
      console.error('No id found for item. Do you need to customize the `idField`?', item);
    }
    return false;
  }
  return true;
}

function registerModel(Model, globalModels, apiPrefix, servicePath) {
  var modelName = getModelName(Model);
  var path = apiPrefix ? apiPrefix + '.' + modelName : modelName;

  setByDot(globalModels, path, Model);
  globalModels.byServicePath[servicePath] = Model;
  return {
    path: path,
    name: modelName
  };
}

// Creates a Model class name from the last part of the servicePath
function getModelName(Model) {
  // If the Model.name has been customized, use it.
  // if (Model.name && Model.name !== 'FeathersVuexModel') {
  //   return Model.name
  // }

  // Otherwise, use an inflection of the last bit of the servicePath
  var parts = Model.servicePath.split('/');
  var name = parts[parts.length - 1];
  name = _inflection2.default.titleize(name);
  name = name.split('-').join('');
  name = _inflection2.default.singularize(name);
  return name;
}

//  From feathers-plus/feathers-hooks-common
function setByDot(obj, path, value, ifDelete) {
  if (ifDelete) {
    console.log('DEPRECATED. Use deleteByDot instead of setByDot(obj,path,value,true). (setByDot)');
  }

  if (path.indexOf('.') === -1) {
    obj[path] = value;

    if (value === undefined && ifDelete) {
      delete obj[path];
    }

    return;
  }

  var parts = path.split('.');
  var lastIndex = parts.length - 1;
  return parts.reduce(function (obj1, part, i) {
    if (i !== lastIndex) {
      if (!obj1.hasOwnProperty(part) || _typeof(obj1[part]) !== 'object') {
        obj1[part] = {};
      }
      return obj1[part];
    }

    obj1[part] = value;
    if (value === undefined && ifDelete) {
      delete obj1[part];
    }
    return obj1;
  }, obj);
}