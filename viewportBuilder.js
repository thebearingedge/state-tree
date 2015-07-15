
'use strict';

var Viewport = require('./Viewport');

/*
 * State objects can come with view keys that refer to Viewports:
 *
 * views: {
 *  main: { blah blah blah },
 *  'side@home': { blah blah blah }
 * }
 *
 * Different Views may populate the same Viewport at different States. We want
 * the State to hold references to its Viewports. We only need to create a
 * Viewport the first time it is inferred. A given State object
 * may imply a Viewport that exists on a yet unaccounted-for State,
 * so we will enqueue the Viewport until we can set it on its State.
 */

module.exports = {

  states: {},


  queues: {},


  viewports: {},


  addState: function (state) {

    this.states[state.name] || (this.states[state.name] = state);

    if (!state.definesViews()) return this;

    return this
      .inferViewportsFrom(state)
      .flushQueueOf(state);
  },


  inferViewportsFrom: function (state) {

    if (!state.views) {

      return this.createOne(null, state.name);
    }

    return this.createMany(state.views, state);
  },


  createOne: function (viewportName, stateName) {

    viewportName || (viewportName = '@' + stateName);
    this.viewports[stateName] || (this.viewports[stateName] = {});

    if (this.viewports[stateName][viewportName]) return this;

    var viewport = new Viewport(viewportName);
    var state = this.states[stateName];

    this.viewports[stateName][viewportName] = viewport;

    if (!state) {

      return this.enqueue(viewport, stateName);
    }

    state.$viewports.push(viewport);

    return this;
  },


  createMany: function (viewDefs, state) {

    var key, splitNames, viewportName, stateName;

    for (key in viewDefs) {

      splitNames = key.split('@');
      viewportName = splitNames[0] || null;
      stateName = splitNames[1] || state.name;

      this.createOne(viewportName, stateName);
    }

    return this;
  },


  enqueue: function (viewport, stateName) {

    this.queues[stateName] || (this.queues[stateName] = []);
    this.queues[stateName].push(viewport);

    return this;
  },


  flushQueueOf: function (state) {

    var queue = this.queues[state.name];

    while (queue && queue.length) {

      state.$viewports.push(queue.pop());
    }

    return this;
  }

};
