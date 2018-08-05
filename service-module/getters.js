import getFilter from 'feathers-query-filters'
import sift from 'sift'
import commons from '@feathersjs/commons'

const { sorter, select, _ } = commons

export default function makeServiceGetters (servicePath) {
  return {
    list (state) {
      return state.ids.map(id => state.keyedById[id])
    },
    find: state => (params = {}) => {
      const { query, filters } = getFilter(params.query || {})
      let values = _.values(state.keyedById).filter(matcher(query))

      const total = values.length

      if (filters.$sort) {
        values.sort(sorter(filters.$sort))
      }

      if (filters.$skip) {
        values = values.slice(filters.$skip)
      }

      if (typeof filters.$limit !== 'undefined') {
        values = values.slice(0, filters.$limit)
      }

      if (filters.$select) {
        values = values.map(value => _.pick(value, filters.$select.slice()))
      }

      return {
        total,
        limit: filters.$limit || 0,
        skip: filters.$skip || 0,
        data: values
      }
    },
    get: ({ keyedById, idField }) => (id, params = {}) => {
      return keyedById[id] ? select(params, idField)(keyedById[id]) : undefined
    },
    current (state) {
      return state.currentId ? state.keyedById[state.currentId] : null
    }
  }
}
