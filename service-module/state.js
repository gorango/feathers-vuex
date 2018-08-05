export default function makeDefaultState (servicePath, options) {
  const { idField, autoRemove, enableEvents, addOnUpsert, skipRequestIfExists, preferUpdate, replaceItems } = options
  const state = {
    ids: [],
    keyedById: {},
    currentId: undefined,
    copy: undefined,
    idField,
    servicePath,
    autoRemove,
    enableEvents,
    addOnUpsert,
    skipRequestIfExists,
    preferUpdate,
    replaceItems,
    pagination: {},

    isFindPending: false,
    isGetPending: false,
    isCreatePending: false,
    isUpdatePending: false,
    isPatchPending: false,
    isRemovePending: false,

    errorOnFind: undefined,
    errorOnGet: undefined,
    errorOnCreate: undefined,
    errorOnUpdate: undefined,
    errorOnPatch: undefined,
    errorOnRemove: undefined
  }

  return state
}
