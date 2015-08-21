
'use strict';

var routeSegment = require('./routeSegment');


module.exports = Route;


function Route(name, path) {

  var splitPath = path.split('/');

  var rawSegments = path[0] === '/'
    ? splitPath.slice(1)
    : splitPath;

  this.name = name;
  this.path = path;
  this.segments = rawSegments
    .map(function (segmentString) {

      return routeSegment.create(segmentString);
    });
  this.specificity = this.segments
    .map(function (segment) {

      return segment.specificity;
    })
    .join('');

  var splitNames = name.split('.');

  this.parentName = splitNames[1]
    ? splitNames.slice(0, splitNames.length - 1).join('.')
    : null;
}


Route.prototype.parent = null;
Route.prototype.children = null;


Route.prototype.isAbsolute = function isAbsolute() {

  return this.path[0] === '/';
};


Route.prototype.match = function (unmatched) {

  var toMatch = this.segments.length;
  var i = 0;
  var matched = [];

  while (i < toMatch && toMatch <= unmatched.length) {

    var result;
    var segment = this.segments[i];

    if (segment.type === 'splat') {

      var remainder = unmatched.slice(matched.length).join('/');
      result = segment.match(remainder);
      matched.push(result);
      unmatched.splice(0);

      return matched;
    }

    // jshint -W084
    if (result = segment.match(unmatched[i])) {

      matched.push(result);
    }
    else {

      break;
    }

    i++;
  }

  if (matched.length < toMatch) {

    return null;
  }

  unmatched.splice(0, toMatch);

  return matched;
};


Route.prototype.addChild = function (route) {

  route.parent = this;

  this.children || (this.children = []);
  this.children.push(route);
};


Route.prototype.generate = function (params) {

  var child = this;
  var allSegments = [];

  while (child) {

    child.segments.slice().reverse().forEach(collectSegment);
    child = child.parent;
  }

  var path = allSegments
    .map(function (segment) {

      return segment.interpolate(params);
    })
    .filter(function (segment) {

      return segment !== '';
    })
    .join('/');

  return '/' + path;

  function collectSegment(segment) { allSegments.unshift(segment); }
};
