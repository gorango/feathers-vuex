"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = makeDefaultState;
function makeDefaultState(servicePath, options) {
  var idField = options.idField,
      autoRemove = options.autoRemove,
      paginate = options.paginate,
      enableEvents = options.enableEvents,
      addOnUpsert = options.addOnUpsert,
      skipRequestIfExists = options.skipRequestIfExists,
      preferUpdate = options.preferUpdate,
      replaceItems = options.replaceItems;

  var state = {
    ids: [],
    keyedById: {},
    copiesById: {},
    currentId: null,
    copy: null,
    idField: idField,
    servicePath: servicePath,
    autoRemove: autoRemove,
    enableEvents: enableEvents,
    addOnUpsert: addOnUpsert,
    skipRequestIfExists: skipRequestIfExists,
    preferUpdate: preferUpdate,
    replaceItems: replaceItems,

    isFindPending: false,
    isGetPending: false,
    isCreatePending: false,
    isUpdatePending: false,
    isPatchPending: false,
    isRemovePending: false,

    errorOnFind: null,
    errorOnGet: null,
    errorOnCreate: null,
    errorOnUpdate: null,
    errorOnPatch: null,
    errorOnRemove: null
  };
  if (paginate) {
    state.pagination = {};
  }
  return state;
}
module.exports = exports["default"];