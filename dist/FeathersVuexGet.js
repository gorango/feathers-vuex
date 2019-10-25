'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
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
    // For get requests
    id: {
      type: [Number, String],
      default: null
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
    }
  },
  data: function() {
    return {
      isFindPending: false,
      isGetPending: false
    }
  },
  computed: {
    item: function() {
      var getArgs = this.getArgs(this.query)
      if (this.id) {
        return (
          this.$store.getters[this.service + '/get'](
            getArgs.length === 1 ? this.id : getArgs
          ) || null
        )
      } else {
        return null
      }
    },
    scope: function() {
      var _a = this,
        item = _a.item,
        isGetPending = _a.isGetPending
      var defaultScope = { item: item, isGetPending: isGetPending }
      return this.editScope(defaultScope) || defaultScope
    }
  },
  methods: {
    getArgs: function(queryToUse) {
      var query = queryToUse || this.fetchQuery || this.query
      var getArgs = [this.id]
      if (query && Object.keys(query).length > 0) {
        getArgs.push({ query: query })
      }
      return getArgs
    },
    getData: function() {
      var _this = this
      var getArgs = this.getArgs()
      if (
        typeof this.queryWhen === 'function'
          ? this.queryWhen.apply(this, getArgs)
          : this.queryWhen
      ) {
        this.isGetPending = true
        if (this.id) {
          return this.$store
            .dispatch(
              this.service + '/get',
              getArgs.length === 1 ? this.id : getArgs
            )
            .then(function() {
              _this.$emit('done')
              _this.isGetPending = false
            })
        }
      }
    },
    fetchData: function() {
      if (!this.local) {
        if (
          this.id !== null &&
          this.id !== undefined &&
          !this.query &&
          !this.fetchQuery
        ) {
          return this.getData()
        } else {
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
        "You must first Vue.use the FeathersVuex plugin before using the 'feathers-vuex-get' component."
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
    if (
      this.fetchQuery ||
      this.query ||
      (this.id !== null && this.id !== undefined)
    ) {
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
//# sourceMappingURL=FeathersVuexGet.js.map
