
'use strict';

var State = require('./State');


module.exports = stateRegistry;


function stateRegistry(viewTree, resolveService) {

  var registry = {

    states: {},


    queues: {},


    add: function (name, definition) {

      if (arguments.length === 2) definition.name = name;
      else definition = name;

      if (!definition.name || typeof definition.name !== 'string') {

        throw new Error('State definitions must include a string name');
      }

      var state = new State(definition);

      return this.register(state);
    },


    register: function (state) {

      var parentName = state.parent;
      var parentState = this.states[parentName];

      if (parentName && !parentState) {

        return this.enqueue(parentName, state);
      }

      this.states[state.name] = state.inheritFrom(parentState || this.$root);
      viewTree.processState(state);
      resolveService.addResolvesTo(state);

      return this.flushQueueOf(state);
    },


    enqueue: function (parentName, state) {

      this.queues[parentName] || (this.queues[parentName] = []);
      this.queues[parentName].push(state);

      return this;
    },


    flushQueueOf: function (state) {

      var queue = this.queues[state.name];

      while (queue && queue.length) {

        this.register(queue.pop());
      }

      return this;
    }

  };

  var rootState = new State({ name: '' });

  rootState.addView(viewTree.views['@']);

  registry.$root = rootState;
  registry.states[''] = rootState;

  return registry;
}
