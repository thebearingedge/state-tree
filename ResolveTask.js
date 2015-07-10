
'use strict';

module.exports = ResolveTask;


function ResolveTask(resolve, params, resolveCache) {

  this.resolve = resolve;
  this.name = resolve.name;
  this.params = params;
  this.cache = resolveCache;
  this.waitingFor = resolve.injectables
    ? resolve.injectables.slice()
    : [];
}


ResolveTask.prototype.isWaitingFor = function (dependency) {

  return this.waitingFor.length && this.waitingFor.indexOf(dependency) > -1;
};


ResolveTask.prototype.setDependency = function (dependency, value) {

  this.dependencies || (this.dependencies = {});
  this.dependencies[dependency] = value;
  this.waitingFor.splice(this.waitingFor.indexOf(dependency), 1);

  return this;
};


ResolveTask.prototype.isReady = function () {

  return !!!this.waitingFor.length;
};


ResolveTask.prototype.execute = function () {

  var self = this;

  return new ResolveTask.Promise(function (resolve, reject) {

    var resultOrPromise;

    try {

      resultOrPromise = self
        .resolve
        .execute(self.params, self.dependencies);
    }
    catch (e) {

      return reject(e);
    }

    return resolve(resultOrPromise);
  });
};


ResolveTask.prototype.commit = function () {

  this.cache.set(this.name, this.result);

  return this;
};
