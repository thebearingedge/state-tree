
'use strict';

var xtend = require('xtend/mutable');

module.exports = State;

function State(stateDef) {

  this.$includes = {};
  this.$ancestors = {};
  this.$paramKeys = [];
  this.$resolves = [];
  this.$viewports = [];
  this.$branch = [this];

  this.data = {};

  xtend(this, stateDef);

  this.$includes[this.name] = true;
  this.$ancestors[this.name] = this;

  if (this.parent && typeof this.parent === 'string') return this;

  var splitNames = this.name.split('.');

  this.parent = splitNames[1]
    ? splitNames.slice(1).join('.')
    : null;
}


State.prototype.$parent = null;


State.prototype.inheritFrom = function (parentNode) {

  this.data = xtend({}, parentNode.data, this.data);

  xtend(this.$includes, parentNode.$includes);
  xtend(this.$ancestors, parentNode.$ancestors);

  this.$branch = parentNode.$branch.concat(this.$branch);
  this.$parent = parentNode;

  return this;
};


State.prototype.contains = function (state) {

  return this.$includes[state.name] || false;
};


State.prototype.getBranch = function () {

  return this.$branch.slice();
};


State.prototype.shouldReload = function (newParams) {

  if (this.$paramsKeys.length === 0) return false;

  if (!this.$params) return true;

  var self = this;

  return self.$paramsKeys.some(function (key) {

    return self.$params[key] != newParams[key];
  });
};


State.prototype.addResolve = function (resolve) {

  this.$resolves.push(resolve);

  return this;
};


State.prototype.filterParams = function (allParams) {

  return this
    .$paramKeys
    .reduce(function (ownParams, key) {

      ownParams[key] = allParams[key];

      return ownParams;
    }, {});
};


State.prototype.shutDown = function () {

  this.$views.forEach(function (view) {

    view.destroy();
  });

  this.$params = null;

  return this;
};


State.prototype.getViews = function () {

  return this.$views.slice();
};


State.prototype.getAllViews = function () {

  return this
    .getBranch()
    .reverse()
    .reduce(function (allViews, state) {

      return allViews.concat(state.getViews());
    }, []);
};


State.prototype.getAncestor = function (stateName) {

  return this.$ancestors[stateName] || null;
};


State.prototype.getResolveResults = function () {

  return this
    .$resolves
    .reduce(function (results, resolve) {

      results[resolve.key] = resolve.getResult();

      return results;
    }, {});
};


State.prototype.definesViews = function () {

  return !!this.views || !!this.template;
};


State.prototype.addViewport = function (viewport) {

  this.$viewports.push(viewport);
};
