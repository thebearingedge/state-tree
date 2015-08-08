
'use strict';

var router = require('./modules/router');
var stateRegistry = require('./modules/stateRegistry');
var resolveService = require('./modules/resolveService');
var viewTree = require('./modules/viewTree');
var View = require('./modules/View');
var eventBus = require('./modules/eventBus');
var stateMachine = require('./modules/stateMachine');


module.exports = ScreenMachine;


function ScreenMachine(options) {

  if (!(this instanceof ScreenMachine)) {

    return new ScreenMachine(options);
  }

  var Promise = options.promises;
  var Component = options.components;
  var events = eventBus(options.events);


  var views = viewTree(View, Component);
  var resolves = resolveService(Promise);
  var routes = router();
  var registry = stateRegistry(views, resolves, routes);
  var machine = stateMachine(events);


  machine.init(registry.$root, {});


  this.state = function () {

    registry.add.apply(registry, arguments);

    return this;
  };


  this.transitionTo = function (stateName, params) {

    var state = registry.states[stateName];

    return machine.transitionTo(state, params);
  };


  this.go = function () {

    return this.transitionTo.apply(this, arguments);
  };

}
