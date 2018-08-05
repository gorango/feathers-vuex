import Vue from 'vue'

export default function makeAuthMutations (feathers) {
  return {
    setAccessToken (state, payload) {
      Vue.set(state, 'accessToken', payload)
    },
    setPayload (state, payload) {
      Vue.set(state, 'payload', payload)
    },
    setUser (state, payload) {
      Vue.set(state, 'user', payload)
    },

    setAuthenticatePending (state) {
      Vue.set(state, 'isAuthenticatePending', true)
    },
    unsetAuthenticatePending (state) {
      Vue.set(state, 'isAuthenticatePending', false)
    },
    setLogoutPending (state) {
      Vue.set(state, 'isLogoutPending', true)
    },
    unsetLogoutPending (state) {
      Vue.set(state, 'isLogoutPending', false)
    },

    setAuthenticateError (state, error) {
      Vue.set(state, 'errorOnAuthenticate', Object.assign({}, error))
    },
    clearAuthenticateError (state) {
      Vue.set(state, 'errorOnAuthenticate', undefined)
    },
    setLogoutError (state, error) {
      Vue.set(state, 'errorOnLogout', Object.assign({}, error))
    },
    clearLogoutError (state) {
      Vue.set(state, 'errorOnLogout', undefined)
    },

    logout (state) {
      Vue.set(state, 'payload', undefined)
      Vue.set(state, 'accessToken', undefined)
      if (state.user) {
        Vue.set(state, 'user', undefined)
      }
    }
  }
}
