import setupState from './state'
import setupMutations from './mutations'
import setupActions from './actions'

const defaults = {
  namespace: 'auth',
  userService: '', // Set this to automatically populate the user (using an additional request) on login success.
  state: {}, // for custom state
  getters: {}, // for custom getters
  mutations: {}, // for custom mutations
  actions: {} // for custom actions
}

export default function authPluginInit (feathersClient) {
  if (!feathersClient || !feathersClient.service) {
    throw new Error('You must pass a Feathers Client instance to feathers-vuex')
  }

  return function createAuthModule (options) {
    options = Object.assign({}, defaults, options)

    if (!feathersClient.authenticate) {
      throw new Error('You must register the feathers-authentication-client plugin before using the feathers-vuex auth module')
    }

    const defaultState = setupState(options)
    const defaultMutations = setupMutations(feathersClient)
    const defaultActions = setupActions(feathersClient)

    return function setupStore (store) {
      const { namespace } = options

      store.registerModule(namespace, {
        namespaced: true,
        state: Object.assign({}, defaultState, options.state),
        mutations: Object.assign({}, defaultMutations, options.mutations),
        actions: Object.assign({}, defaultActions, options.actions)
      })
    }
  }
}
