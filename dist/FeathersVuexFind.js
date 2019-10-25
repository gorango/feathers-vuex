'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
var utils_1 = require('./utils')
exports.default = {
  props: {
    service: {
      type: String,
      required: true
    },
    query: {
      type: Object,
      default: null
    },
    queryWhen: {
      type: [Boolean, Function],
      default: true
    },
    // If a separate query is desired to fetch data, use fetchQuery
    // The watchers will automatically be updated, so you don't have to write 'fetchQuery.propName'
    fetchQuery: {
      type: Object
    },
    watch: {
      type: [String, Array],
      default: function() {
        return []
      }
    },
    local: {
      type: Boolean,
      default: false
    },
    editScope: {
      type: Function,
      default: function(scope) {
        return scope
      }
    },
    qid: {
      type: String,
      default: function() {
        return utils_1.randomString(10)
      }
    }
  },
  data: function() {
    return {
      isFindPending: false
    }
  },
  computed: {
    items: function() {
      var _a = this,
        query = _a.query,
        service = _a.service,
        $store = _a.$store
      return query
        ? $store.getters[service + '/find']({ query: query }).data
        : []
    },
    pagination: function() {
      return this.$store.state[this.service].pagination[this.qid]
    },
    scope: function() {
      var _a = this,
        items = _a.items,
        isFindPending = _a.isFindPending,
        pagination = _a.pagination
      var defaultScope = {
        isFindPending: isFindPending,
        pagination: pagination,
        items: items
      }
      return this.editScope(defaultScope) || defaultScope
    }
  },
  methods: {
    findData: function() {
      var _this = this
      var query = this.fetchQuery || this.query
      if (
        typeof this.queryWhen === 'function'
          ? this.queryWhen(this.query)
          : this.queryWhen
      ) {
        this.isFindPending = true
        if (query) {
          var params = { query: query, qid: this.qid || 'default' }
          return this.$store
            .dispatch(this.service + '/find', params)
            .then(function(res) {
              _this.$emit('done', res)
              _this.isFindPending = false
            })
        }
      }
    },
    fetchData: function() {
      if (!this.local) {
        if (this.query) {
          return this.findData()
        } else {
          // TODO: access debug boolean from from the store config, somehow.
          console.log(
            'No query and no id provided, so no data will be fetched.'
          )
        }
      }
    }
  },
  created: function() {
    var _this = this
    if (!this.$FeathersVuex) {
      throw new Error(
        "You must first Vue.use the FeathersVuex plugin before using the 'feathers-vuex-find' component."
      )
    }
    if (!this.$store.state[this.service]) {
      throw new Error(
        "The '" +
          this.service +
          "' plugin cannot be found. Did you register the service with feathers-vuex?"
      )
    }
    var watch = Array.isArray(this.watch) ? this.watch : [this.watch]
    if (this.fetchQuery || this.query) {
      watch.forEach(function(prop) {
        if (typeof prop !== 'string') {
          throw new Error("Values in the 'watch' array must be strings.")
        }
        if (_this.fetchQuery) {
          if (prop.startsWith('query')) {
            prop.replace('query', 'fetchQuery')
          }
        }
        _this.$watch(prop, _this.fetchData)
      })
      this.fetchData()
    }
  },
  render: function() {
    return this.$scopedSlots.default(this.scope)
  }
}
//# sourceMappingURL=FeathersVuexFind.js.map
