
'use strict';

module.exports = ResolveGraph;


function ResolveGraph(resolveTasks, resolveCache) {

  this.tasks = resolveTasks;
  this.cache = resolveCache;
  this.graph = resolveTasks
    .reduce(function (graph, task) {

      graph[task.name] = task.waitingFor;

      return graph;
    }, {});
}


ResolveGraph.prototype.ensureDependencies = function () {

  var self = this;

  self.tasks
    .filter(function (task) {

      return !task.isReady();
    })
    .forEach(function (dependent) {

      dependent
        .waitingFor
        .filter(function (dependency) {

          return !(dependency in self.graph);
        })
        .forEach(function (absent) {

          var cached = self.cache.get(absent);

          dependent.setDependency(absent, cached);
        });
    });

  return this;
};


ResolveGraph.prototype.throwIfCyclic = function () {

  var graph = this.graph;
  var VISITING = 1;
  var OK = 2;
  var visited = {};
  var stack = [];
  var taskName;

  for (taskName in graph) {

    visit(taskName);
  }

  return this;


  function visit(taskName) {

    if (visited[taskName] === OK) return;

    stack.push(taskName);

    if (visited[taskName] === VISITING) {

      stack.splice(0, stack.indexOf(taskName));

      throw new Error('Cyclic resolve dependency: ' + stack.join(' -> '));
    }

    visited[taskName] = VISITING;

    graph[taskName].forEach(visit);

    stack.pop();
    visited[taskName] = OK;
  }
};


ResolveGraph.prototype.getTasks = function () {

  return this.tasks;
};
