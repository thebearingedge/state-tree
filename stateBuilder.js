
'use strict';

var StateNode = require('./StateNode');
var resolveFactory = require('./resolveFactory');


module.exports = {

  build: function (name, stateDef) {

    if (arguments.length === 2) stateDef.name = name;
    else stateDef = name;

    var stateNode = new StateNode(stateDef);

    return this.addResolves(stateNode);
  },


  addResolves: function (stateNode) {

    var raw = stateNode.resolve;
    var key, resolve;

    for (key in raw) {

      resolve = resolveFactory.instantiate(key, stateNode);

      stateNode.addResolve(resolve);
    }

    return stateNode;
  }

};