import Vue from 'vue'
import _merge from 'lodash.merge'
import serializeError from 'serialize-error'
import isObject from 'lodash.isobject'

export default function makeServiceMutations (servicePath) {
  function addItem (state, item) {
    const { idField } = state
    let id = item[idField]
    const Model = globalModels.byServicePath[servicePath]
    const isIdOk = checkId(id, item, debug)

    if (isIdOk) {
      if (Model && !item.isFeathersVuexInstance) {
        item = new Model(item)
      }

      // Only add the id if it's not already in the `ids` list.
      if (!state.ids.includes(id)) {
        state.ids.push(id)
      }

      state.keyedById = Object.assign({}, state.keyedById, { [id]: item })
    }

    Vue.set(state, 'keyedById', { ...state.keyedById, [id]: item })
  }

  function updateItem (state, item) {
    const { idField } = state
    let id = item[idField]
    const isIdOk = checkId(id, item, debug)

    // Simply rewrite the record if the it's already in the `ids` list.
    if (isIdOk && state.ids.includes(id)) {
      if (replaceItems) {
        state.keyedById[id] = item
      } else {
        _merge(state.keyedById[id], item)
      }
      return
    }

    // if addOnUpsert then add the record into the state, else discard it.
    if (addOnUpsert) {
      state.ids.push(id)
      state.keyedById = Object.assign({}, state.keyedById, { [id]: item })
    }
  }

  return {
    addItem (state, item) {
      addItem(state, item)
    },
    addItems (state, items) {
      items.forEach(item => addItem(state, item))
    },
    updateItem (state, item) {
      updateItem(state, item)
    },
    updateItems (state, items) {
      if (!Array.isArray(items)) {
        throw new Error('You must provide an array to the `removeItems` mutation.')
      }
      items.forEach(item => updateItem(state, item))
    },

    removeItem (state, item) {
      const { idField } = state
      const idToBeRemoved = isObject(item) ? item[idField] : item
      const keyedById = {}
      const { currentId } = state

      state.ids = state.ids.filter(id => {
        if (id === idToBeRemoved) {
          return false
        } else {
          keyedById[id] = state.keyedById[id]
          return true
        }
      })

      Vue.set(state, 'keyedById', keyedById)

      if (currentId === idToBeRemoved) {
        Vue.set(state, 'currentId', undefined)
        Vue.set(state, 'copy', undefined)
      }
    },

    removeItems (state, items) {
      const { idField } = state

      if (!Array.isArray(items)) {
        throw new Error('You must provide an array to the `removeItems` mutation.')
      }
      const containsObjects = items[0] && isObject(items[0])
      const keyedById = {}
      const currentId = state.currentId
      let idsToRemove = items
      const mapOfIdsToRemove = {}

      // If the array contains objects, create an array of ids. Assume all are the same.
      if (containsObjects) {
        idsToRemove = items.map(item => item[idField])
      }

      // Make a hash map of the idsToRemove, so we don't have to iterate inside a loop
      idsToRemove.forEach(idToRemove => {
        mapOfIdsToRemove[idToRemove] = idToRemove
      })

      // Filter the ids to be those we're keeping. Also create new keyedById.
      Vue.set(state, 'ids', state.ids.filter(id => {
        if (mapOfIdsToRemove[id]) {
          return false
        } else {
          keyedById[id] = state.keyedById[id]
          return true
        }
      }))

      Vue.set(state, 'keyedById', keyedById)

      if (currentId && mapOfIdsToRemove[currentId]) {
        Vue.set(state, 'currentId', undefined)
        Vue.set(state, 'copy', undefined)
      }
    },

    clearAll (state) {
      Vue.set(state, 'ids', [])
      Vue.set(state, 'currentId', undefined)
      Vue.set(state, 'copy', undefined)
      Vue.set(state, 'keyedById', {})
    },

    clearList (state) {
      let currentId = state.currentId
      let current = state.keyedById[currentId]

      if (currentId && current) {
        Vue.set(state, 'keyedById', {
          [currentId]: current
        })
        Vue.set(state, 'ids', [currentId])
      } else {
        Vue.set(state, 'keyedById', {})
        Vue.set(state, 'ids', [])
      }
    },

    setCurrent (state, itemOrId) {
      const { idField } = state
      const Model = globalModels.byServicePath[servicePath]
      let id
      let item

      if (isObject(itemOrId)) {
        id = itemOrId[idField]
        item = itemOrId
      } else {
        id = itemOrId
        item = state.keyedById[id]
      }
      state.currentId = id

      state.copy = new Model(item, { isClone: true })
    },

    clearCurrent (state) {
      Vue.set(state, 'currentId', undefined)
      Vue.set(state, 'copy', undefined)
    },

    // Deep assigns current to copy
    rejectCopy (state) {
      let current = state.keyedById[state.currentId]
      Vue.set(state, 'copy', _merge(state.copy, current))
    },

    // Deep assigns copy to current
    commitCopy (state) {
      let current = state.keyedById[state.currentId]
      Vue.set(state, 'copy', _merge(current, state.copy))
    },

    // Resets the copy to match the original record, locally
    rejectCopy (state, id) {
      const isIdOk = checkId(id, undefined, debug)
      const current = isIdOk ? state.keyedById[id] : state.keyedById[state.currentId]
      const Model = globalModels.byServicePath[servicePath]
      let copy

      if (state.keepCopiesInStore || !Model) {
        copy = isIdOk ? state.copiesById[id] : state.copy
      } else {
        copy = Model.copiesById[id]
      }

      _merge(copy, current)
    },

    // Deep assigns copy to original record, locally
    commitCopy (state, id) {
      const isIdOk = checkId(id, undefined, debug)
      const current = isIdOk ? state.keyedById[id] : state.keyedById[state.currentId]
      const Model = globalModels.byServicePath[servicePath]
      let copy

      if (state.keepCopiesInStore || !Model) {
        copy = isIdOk ? state.copiesById[id] : state.copy
      } else {
        copy = Model.copiesById[id]
      }

      Object.assign(current, copy)
    },

    // Stores pagination data on state.pagination based on the query identifier (qid)
    // The qid must be manually assigned to `params.qid`
    updatePaginationForQuery (state, { qid, response, query }) {
      const { data, limit, skip, total } = response
      const { idField } = state
      const ids = data.map(item => {
        return item[idField]
      })
      Vue.set(state.pagination, qid, { limit, skip, total, ids, query })
    },

    setFindPending (state) {
      Vue.set(state, 'isFindPending', true)
    },
    unsetFindPending (state) {
      Vue.set(state, 'isFindPending', false)
    },
    setGetPending (state) {
      Vue.set(state, 'isGetPending', true)
    },
    unsetGetPending (state) {
      Vue.set(state, 'isGetPending', false)
    },
    setCreatePending (state) {
      Vue.set(state, 'isCreatePending', true)
    },
    unsetCreatePending (state) {
      Vue.set(state, 'isCreatePending', false)
    },
    setUpdatePending (state) {
      Vue.set(state, 'isUpdatePending', true)
    },
    unsetUpdatePending (state) {
      Vue.set(state, 'isUpdatePending', false)
    },
    setPatchPending (state) {
      Vue.set(state, 'isPatchPending', true)
    },
    unsetPatchPending (state) {
      Vue.set(state, 'isPatchPending', false)
    },
    setRemovePending (state) {
      Vue.set(state, 'isRemovePending', true)
    },
    unsetRemovePending (state) {
      Vue.set(state, 'isRemovePending', false)
    },

    setFindError (state, payload) {
      Vue.set(state, 'errorOnFind', Object.assign({}, serializeError(payload)))
    },
    clearFindError (state) {
      Vue.set(state, 'errorOnFind', undefined)
    },
    setGetError (state, payload) {
      Vue.set(state, 'errorOnGet', Object.assign({}, serializeError(payload)))
    },
    clearGetError (state) {
      Vue.set(state, 'errorOnGet', undefined)
    },
    setCreateError (state, payload) {
      Vue.set(state, 'errorOnCreate', Object.assign({}, serializeError(payload)))
    },
    clearCreateError (state) {
      Vue.set(state, 'errorOnCreate', undefined)
    },
    setUpdateError (state, payload) {
      Vue.set(state, 'errorOnUpdate', Object.assign({}, serializeError(payload)))
    },
    clearUpdateError (state) {
      Vue.set(state, 'errorOnUpdate', undefined)
    },
    setPatchError (state, payload) {
      Vue.set(state, 'errorOnPatch', Object.assign({}, serializeError(payload)))
    },
    clearPatchError (state) {
      Vue.set(state, 'errorOnPatch', undefined)
    },
    setRemoveError (state, payload) {
      Vue.set(state, 'errorOnRemove', Object.assign({}, serializeError(payload)))
    },
    clearRemoveError (state) {
      Vue.set(state, 'errorOnRemove', undefined)
    }
  }
}
