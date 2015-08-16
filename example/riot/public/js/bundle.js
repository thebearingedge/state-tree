(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

'use strict';

var eventBus = require('./modules/eventBus');
var viewTree = require('./modules/viewTree');
var resolveService = require('./modules/resolveService');
var router = require('./modules/router');
var stateRegistry = require('./modules/stateRegistry');
var stateMachine = require('./modules/stateMachine');


module.exports = screenMachine;


function screenMachine(config) {

  var document = config.document;
  var window = document.defaultView;
  var Promise = config.promises;
  var Component = config.components(document);
  var views = viewTree(document, Component);
  var resolves = resolveService(Promise);
  var routes = router(window, { html5: config.html5 });
  var states = stateRegistry(views, resolves, routes);
  var events = eventBus(config.events);

  var machine = stateMachine(events, states, resolves, routes, views);

  return machine.init(states.$root, {});
}


},{"./modules/eventBus":18,"./modules/resolveService":20,"./modules/router":21,"./modules/stateMachine":22,"./modules/stateRegistry":23,"./modules/viewTree":24}],2:[function(require,module,exports){
/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {

  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()

}('domready', function () {

  var fns = [], listener
    , doc = document
    , hack = doc.documentElement.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState)


  if (!loaded)
  doc.addEventListener(domContentLoaded, listener = function () {
    doc.removeEventListener(domContentLoaded, listener)
    loaded = 1
    while (listener = fns.shift()) listener()
  })

  return function (fn) {
    loaded ? setTimeout(fn, 0) : fns.push(fn)
  }

});

},{}],3:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":29}],4:[function(require,module,exports){
(function (global){
/*! Native Promise Only
    v0.8.1 (c) Kyle Simpson
    MIT License: http://getify.mit-license.org
*/

(function UMD(name,context,definition){
	// special form of UMD for polyfilling across evironments
	context[name] = context[name] || definition();
	if (typeof module != "undefined" && module.exports) { module.exports = context[name]; }
	else if (typeof define == "function" && define.amd) { define(function $AMD$(){ return context[name]; }); }
})("Promise",typeof global != "undefined" ? global : this,function DEF(){
	/*jshint validthis:true */
	"use strict";

	var builtInProp, cycle, scheduling_queue,
		ToString = Object.prototype.toString,
		timer = (typeof setImmediate != "undefined") ?
			function timer(fn) { return setImmediate(fn); } :
			setTimeout
	;

	// dammit, IE8.
	try {
		Object.defineProperty({},"x",{});
		builtInProp = function builtInProp(obj,name,val,config) {
			return Object.defineProperty(obj,name,{
				value: val,
				writable: true,
				configurable: config !== false
			});
		};
	}
	catch (err) {
		builtInProp = function builtInProp(obj,name,val) {
			obj[name] = val;
			return obj;
		};
	}

	// Note: using a queue instead of array for efficiency
	scheduling_queue = (function Queue() {
		var first, last, item;

		function Item(fn,self) {
			this.fn = fn;
			this.self = self;
			this.next = void 0;
		}

		return {
			add: function add(fn,self) {
				item = new Item(fn,self);
				if (last) {
					last.next = item;
				}
				else {
					first = item;
				}
				last = item;
				item = void 0;
			},
			drain: function drain() {
				var f = first;
				first = last = cycle = void 0;

				while (f) {
					f.fn.call(f.self);
					f = f.next;
				}
			}
		};
	})();

	function schedule(fn,self) {
		scheduling_queue.add(fn,self);
		if (!cycle) {
			cycle = timer(scheduling_queue.drain);
		}
	}

	// promise duck typing
	function isThenable(o) {
		var _then, o_type = typeof o;

		if (o != null &&
			(
				o_type == "object" || o_type == "function"
			)
		) {
			_then = o.then;
		}
		return typeof _then == "function" ? _then : false;
	}

	function notify() {
		for (var i=0; i<this.chain.length; i++) {
			notifyIsolated(
				this,
				(this.state === 1) ? this.chain[i].success : this.chain[i].failure,
				this.chain[i]
			);
		}
		this.chain.length = 0;
	}

	// NOTE: This is a separate function to isolate
	// the `try..catch` so that other code can be
	// optimized better
	function notifyIsolated(self,cb,chain) {
		var ret, _then;
		try {
			if (cb === false) {
				chain.reject(self.msg);
			}
			else {
				if (cb === true) {
					ret = self.msg;
				}
				else {
					ret = cb.call(void 0,self.msg);
				}

				if (ret === chain.promise) {
					chain.reject(TypeError("Promise-chain cycle"));
				}
				else if (_then = isThenable(ret)) {
					_then.call(ret,chain.resolve,chain.reject);
				}
				else {
					chain.resolve(ret);
				}
			}
		}
		catch (err) {
			chain.reject(err);
		}
	}

	function resolve(msg) {
		var _then, self = this;

		// already triggered?
		if (self.triggered) { return; }

		self.triggered = true;

		// unwrap
		if (self.def) {
			self = self.def;
		}

		try {
			if (_then = isThenable(msg)) {
				schedule(function(){
					var def_wrapper = new MakeDefWrapper(self);
					try {
						_then.call(msg,
							function $resolve$(){ resolve.apply(def_wrapper,arguments); },
							function $reject$(){ reject.apply(def_wrapper,arguments); }
						);
					}
					catch (err) {
						reject.call(def_wrapper,err);
					}
				})
			}
			else {
				self.msg = msg;
				self.state = 1;
				if (self.chain.length > 0) {
					schedule(notify,self);
				}
			}
		}
		catch (err) {
			reject.call(new MakeDefWrapper(self),err);
		}
	}

	function reject(msg) {
		var self = this;

		// already triggered?
		if (self.triggered) { return; }

		self.triggered = true;

		// unwrap
		if (self.def) {
			self = self.def;
		}

		self.msg = msg;
		self.state = 2;
		if (self.chain.length > 0) {
			schedule(notify,self);
		}
	}

	function iteratePromises(Constructor,arr,resolver,rejecter) {
		for (var idx=0; idx<arr.length; idx++) {
			(function IIFE(idx){
				Constructor.resolve(arr[idx])
				.then(
					function $resolver$(msg){
						resolver(idx,msg);
					},
					rejecter
				);
			})(idx);
		}
	}

	function MakeDefWrapper(self) {
		this.def = self;
		this.triggered = false;
	}

	function MakeDef(self) {
		this.promise = self;
		this.state = 0;
		this.triggered = false;
		this.chain = [];
		this.msg = void 0;
	}

	function Promise(executor) {
		if (typeof executor != "function") {
			throw TypeError("Not a function");
		}

		if (this.__NPO__ !== 0) {
			throw TypeError("Not a promise");
		}

		// instance shadowing the inherited "brand"
		// to signal an already "initialized" promise
		this.__NPO__ = 1;

		var def = new MakeDef(this);

		this["then"] = function then(success,failure) {
			var o = {
				success: typeof success == "function" ? success : true,
				failure: typeof failure == "function" ? failure : false
			};
			// Note: `then(..)` itself can be borrowed to be used against
			// a different promise constructor for making the chained promise,
			// by substituting a different `this` binding.
			o.promise = new this.constructor(function extractChain(resolve,reject) {
				if (typeof resolve != "function" || typeof reject != "function") {
					throw TypeError("Not a function");
				}

				o.resolve = resolve;
				o.reject = reject;
			});
			def.chain.push(o);

			if (def.state !== 0) {
				schedule(notify,def);
			}

			return o.promise;
		};
		this["catch"] = function $catch$(failure) {
			return this.then(void 0,failure);
		};

		try {
			executor.call(
				void 0,
				function publicResolve(msg){
					resolve.call(def,msg);
				},
				function publicReject(msg) {
					reject.call(def,msg);
				}
			);
		}
		catch (err) {
			reject.call(def,err);
		}
	}

	var PromisePrototype = builtInProp({},"constructor",Promise,
		/*configurable=*/false
	);

	// Note: Android 4 cannot use `Object.defineProperty(..)` here
	Promise.prototype = PromisePrototype;

	// built-in "brand" to signal an "uninitialized" promise
	builtInProp(PromisePrototype,"__NPO__",0,
		/*configurable=*/false
	);

	builtInProp(Promise,"resolve",function Promise$resolve(msg) {
		var Constructor = this;

		// spec mandated checks
		// note: best "isPromise" check that's practical for now
		if (msg && typeof msg == "object" && msg.__NPO__ === 1) {
			return msg;
		}

		return new Constructor(function executor(resolve,reject){
			if (typeof resolve != "function" || typeof reject != "function") {
				throw TypeError("Not a function");
			}

			resolve(msg);
		});
	});

	builtInProp(Promise,"reject",function Promise$reject(msg) {
		return new this(function executor(resolve,reject){
			if (typeof resolve != "function" || typeof reject != "function") {
				throw TypeError("Not a function");
			}

			reject(msg);
		});
	});

	builtInProp(Promise,"all",function Promise$all(arr) {
		var Constructor = this;

		// spec mandated checks
		if (ToString.call(arr) != "[object Array]") {
			return Constructor.reject(TypeError("Not an array"));
		}
		if (arr.length === 0) {
			return Constructor.resolve([]);
		}

		return new Constructor(function executor(resolve,reject){
			if (typeof resolve != "function" || typeof reject != "function") {
				throw TypeError("Not a function");
			}

			var len = arr.length, msgs = Array(len), count = 0;

			iteratePromises(Constructor,arr,function resolver(idx,msg) {
				msgs[idx] = msg;
				if (++count === len) {
					resolve(msgs);
				}
			},reject);
		});
	});

	builtInProp(Promise,"race",function Promise$race(arr) {
		var Constructor = this;

		// spec mandated checks
		if (ToString.call(arr) != "[object Array]") {
			return Constructor.reject(TypeError("Not an array"));
		}

		return new Constructor(function executor(resolve,reject){
			if (typeof resolve != "function" || typeof reject != "function") {
				throw TypeError("Not a function");
			}

			iteratePromises(Constructor,arr,function resolver(idx,msg){
				resolve(msg);
			},reject);
		});
	});

	return Promise;
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
/* Riot v2.2.4, @license MIT, (c) 2015 Muut Inc. + contributors */

;(function(window, undefined) {
  'use strict';
var riot = { version: 'v2.2.4', settings: {} },
  //// be aware, internal usage

  // counter to give a unique id to all the Tag instances
  __uid = 0,

  // riot specific prefixes
  RIOT_PREFIX = 'riot-',
  RIOT_TAG = RIOT_PREFIX + 'tag',

  // for typeof == '' comparisons
  T_STRING = 'string',
  T_OBJECT = 'object',
  T_UNDEF  = 'undefined',
  T_FUNCTION = 'function',
  // special native tags that cannot be treated like the others
  SPECIAL_TAGS_REGEX = /^(?:opt(ion|group)|tbody|col|t[rhd])$/,
  RESERVED_WORDS_BLACKLIST = ['_item', '_id', 'update', 'root', 'mount', 'unmount', 'mixin', 'isMounted', 'isLoop', 'tags', 'parent', 'opts', 'trigger', 'on', 'off', 'one'],

  // version# for IE 8-11, 0 for others
  IE_VERSION = (window && window.document || {}).documentMode | 0,

  // Array.isArray for IE8 is in the polyfills
  isArray = Array.isArray

riot.observable = function(el) {

  el = el || {}

  var callbacks = {},
      _id = 0

  el.on = function(events, fn) {
    if (isFunction(fn)) {
      if (typeof fn.id === T_UNDEF) fn._id = _id++

      events.replace(/\S+/g, function(name, pos) {
        (callbacks[name] = callbacks[name] || []).push(fn)
        fn.typed = pos > 0
      })
    }
    return el
  }

  el.off = function(events, fn) {
    if (events == '*') callbacks = {}
    else {
      events.replace(/\S+/g, function(name) {
        if (fn) {
          var arr = callbacks[name]
          for (var i = 0, cb; (cb = arr && arr[i]); ++i) {
            if (cb._id == fn._id) arr.splice(i--, 1)
          }
        } else {
          callbacks[name] = []
        }
      })
    }
    return el
  }

  // only single event supported
  el.one = function(name, fn) {
    function on() {
      el.off(name, on)
      fn.apply(el, arguments)
    }
    return el.on(name, on)
  }

  el.trigger = function(name) {
    var args = [].slice.call(arguments, 1),
        fns = callbacks[name] || []

    for (var i = 0, fn; (fn = fns[i]); ++i) {
      if (!fn.busy) {
        fn.busy = 1
        fn.apply(el, fn.typed ? [name].concat(args) : args)
        if (fns[i] !== fn) { i-- }
        fn.busy = 0
      }
    }

    if (callbacks.all && name != 'all') {
      el.trigger.apply(el, ['all', name].concat(args))
    }

    return el
  }

  return el

}
riot.mixin = (function() {
  var mixins = {}

  return function(name, mixin) {
    if (!mixin) return mixins[name]
    mixins[name] = mixin
  }

})()

;(function(riot, evt, win) {

  // browsers only
  if (!win) return

  var loc = win.location,
      fns = riot.observable(),
      started = false,
      current

  function hash() {
    return loc.href.split('#')[1] || ''   // why not loc.hash.splice(1) ?
  }

  function parser(path) {
    return path.split('/')
  }

  function emit(path) {
    if (path.type) path = hash()

    if (path != current) {
      fns.trigger.apply(null, ['H'].concat(parser(path)))
      current = path
    }
  }

  var r = riot.route = function(arg) {
    // string
    if (arg[0]) {
      loc.hash = arg
      emit(arg)

    // function
    } else {
      fns.on('H', arg)
    }
  }

  r.exec = function(fn) {
    fn.apply(null, parser(hash()))
  }

  r.parser = function(fn) {
    parser = fn
  }

  r.stop = function () {
    if (started) {
      if (win.removeEventListener) win.removeEventListener(evt, emit, false) //@IE8 - the if()
      else win.detachEvent('on' + evt, emit) //@IE8
      fns.off('*')
      started = false
    }
  }

  r.start = function () {
    if (!started) {
      if (win.addEventListener) win.addEventListener(evt, emit, false) //@IE8 - the if()
      else win.attachEvent('on' + evt, emit) //IE8
      started = true
    }
  }

  // autostart the router
  r.start()

})(riot, 'hashchange', window)
/*

//// How it works?


Three ways:

1. Expressions: tmpl('{ value }', data).
   Returns the result of evaluated expression as a raw object.

2. Templates: tmpl('Hi { name } { surname }', data).
   Returns a string with evaluated expressions.

3. Filters: tmpl('{ show: !done, highlight: active }', data).
   Returns a space separated list of trueish keys (mainly
   used for setting html classes), e.g. "show highlight".


// Template examples

tmpl('{ title || "Untitled" }', data)
tmpl('Results are { results ? "ready" : "loading" }', data)
tmpl('Today is { new Date() }', data)
tmpl('{ message.length > 140 && "Message is too long" }', data)
tmpl('This item got { Math.round(rating) } stars', data)
tmpl('<h1>{ title }</h1>{ body }', data)


// Falsy expressions in templates

In templates (as opposed to single expressions) all falsy values
except zero (undefined/null/false) will default to empty string:

tmpl('{ undefined } - { false } - { null } - { 0 }', {})
// will return: " - - - 0"

*/


var brackets = (function(orig) {

  var cachedBrackets,
      r,
      b,
      re = /[{}]/g

  return function(x) {

    // make sure we use the current setting
    var s = riot.settings.brackets || orig

    // recreate cached vars if needed
    if (cachedBrackets !== s) {
      cachedBrackets = s
      b = s.split(' ')
      r = b.map(function (e) { return e.replace(/(?=.)/g, '\\') })
    }

    // if regexp given, rewrite it with current brackets (only if differ from default)
    return x instanceof RegExp ? (
        s === orig ? x :
        new RegExp(x.source.replace(re, function(b) { return r[~~(b === '}')] }), x.global ? 'g' : '')
      ) :
      // else, get specific bracket
      b[x]
  }
})('{ }')


var tmpl = (function() {

  var cache = {},
      OGLOB = '"in d?d:' + (window ? 'window).' : 'global).'),
      reVars =
      /(['"\/])(?:[^\\]*?|\\.|.)*?\1|\.\w*|\w*:|\b(?:(?:new|typeof|in|instanceof) |(?:this|true|false|null|undefined)\b|function\s*\()|([A-Za-z_$]\w*)/g

  // build a template (or get it from cache), render with data
  return function(str, data) {
    return str && (cache[str] || (cache[str] = tmpl(str)))(data)
  }


  // create a template instance

  function tmpl(s, p) {

    if (s.indexOf(brackets(0)) < 0) {
      // return raw text
      s = s.replace(/\n|\r\n?/g, '\n')
      return function () { return s }
    }

    // temporarily convert \{ and \} to a non-character
    s = s
      .replace(brackets(/\\{/g), '\uFFF0')
      .replace(brackets(/\\}/g), '\uFFF1')

    // split string to expression and non-expresion parts
    p = split(s, extract(s, brackets(/{/), brackets(/}/)))

    // is it a single expression or a template? i.e. {x} or <b>{x}</b>
    s = (p.length === 2 && !p[0]) ?

      // if expression, evaluate it
      expr(p[1]) :

      // if template, evaluate all expressions in it
      '[' + p.map(function(s, i) {

        // is it an expression or a string (every second part is an expression)
        return i % 2 ?

          // evaluate the expressions
          expr(s, true) :

          // process string parts of the template:
          '"' + s

            // preserve new lines
            .replace(/\n|\r\n?/g, '\\n')

            // escape quotes
            .replace(/"/g, '\\"') +

          '"'

      }).join(',') + '].join("")'

    return new Function('d', 'return ' + s
      // bring escaped { and } back
      .replace(/\uFFF0/g, brackets(0))
      .replace(/\uFFF1/g, brackets(1)) + ';')

  }


  // parse { ... } expression

  function expr(s, n) {
    s = s

      // convert new lines to spaces
      .replace(/\n|\r\n?/g, ' ')

      // trim whitespace, brackets, strip comments
      .replace(brackets(/^[{ ]+|[ }]+$|\/\*.+?\*\//g), '')

    // is it an object literal? i.e. { key : value }
    return /^\s*[\w- "']+ *:/.test(s) ?

      // if object literal, return trueish keys
      // e.g.: { show: isOpen(), done: item.done } -> "show done"
      '[' +

          // extract key:val pairs, ignoring any nested objects
          extract(s,

              // name part: name:, "name":, 'name':, name :
              /["' ]*[\w- ]+["' ]*:/,

              // expression part: everything upto a comma followed by a name (see above) or end of line
              /,(?=["' ]*[\w- ]+["' ]*:)|}|$/
              ).map(function(pair) {

                // get key, val parts
                return pair.replace(/^[ "']*(.+?)[ "']*: *(.+?),? *$/, function(_, k, v) {

                  // wrap all conditional parts to ignore errors
                  return v.replace(/[^&|=!><]+/g, wrap) + '?"' + k + '":"",'

                })

              }).join('') +

        '].join(" ").trim()' :

      // if js expression, evaluate as javascript
      wrap(s, n)

  }


  // execute js w/o breaking on errors or undefined vars

  function wrap(s, nonull) {
    s = s.trim()
    return !s ? '' : '(function(v){try{v=' +

      // prefix vars (name => data.name)
      s.replace(reVars, function(s, _, v) { return v ? '(("' + v + OGLOB + v + ')' : s }) +

      // default to empty string for falsy values except zero
      '}catch(e){}return ' + (nonull === true ? '!v&&v!==0?"":v' : 'v') + '}).call(d)'
  }


  // split string by an array of substrings

  function split(str, substrings) {
    var parts = []
    substrings.map(function(sub, i) {

      // push matched expression and part before it
      i = str.indexOf(sub)
      parts.push(str.slice(0, i), sub)
      str = str.slice(i + sub.length)
    })
    if (str) parts.push(str)

    // push the remaining part
    return parts
  }


  // match strings between opening and closing regexp, skipping any inner/nested matches

  function extract(str, open, close) {

    var start,
        level = 0,
        matches = [],
        re = new RegExp('(' + open.source + ')|(' + close.source + ')', 'g')

    str.replace(re, function(_, open, close, pos) {

      // if outer inner bracket, mark position
      if (!level && open) start = pos

      // in(de)crease bracket level
      level += open ? 1 : -1

      // if outer closing bracket, grab the match
      if (!level && close != null) matches.push(str.slice(start, pos + close.length))

    })

    return matches
  }

})()

/*
  lib/browser/tag/mkdom.js

  Includes hacks needed for the Internet Explorer version 9 and bellow

*/
// http://kangax.github.io/compat-table/es5/#ie8
// http://codeplanet.io/dropping-ie8/

var mkdom = (function (checkIE) {

  var rootEls = {
        'tr': 'tbody',
        'th': 'tr',
        'td': 'tr',
        'tbody': 'table',
        'col': 'colgroup'
      },
      GENERIC = 'div'

  checkIE = checkIE && checkIE < 10

  // creates any dom element in a div, table, or colgroup container
  function _mkdom(html) {

    var match = html && html.match(/^\s*<([-\w]+)/),
        tagName = match && match[1].toLowerCase(),
        rootTag = rootEls[tagName] || GENERIC,
        el = mkEl(rootTag)

    el.stub = true

    if (checkIE && tagName && (match = tagName.match(SPECIAL_TAGS_REGEX)))
      ie9elem(el, html, tagName, !!match[1])
    else
      el.innerHTML = html

    return el
  }

  // creates tr, th, td, option, optgroup element for IE8-9
  /* istanbul ignore next */
  function ie9elem(el, html, tagName, select) {

    var div = mkEl(GENERIC),
        tag = select ? 'select>' : 'table>',
        child

    div.innerHTML = '<' + tag + html + '</' + tag

    child = div.getElementsByTagName(tagName)[0]
    if (child)
      el.appendChild(child)

  }
  // end ie9elem()

  return _mkdom

})(IE_VERSION)

// { key, i in items} -> { key, i, items }
function loopKeys(expr) {
  var b0 = brackets(0),
      els = expr.trim().slice(b0.length).match(/^\s*(\S+?)\s*(?:,\s*(\S+))?\s+in\s+(.+)$/)
  return els ? { key: els[1], pos: els[2], val: b0 + els[3] } : { val: expr }
}

function mkitem(expr, key, val) {
  var item = {}
  item[expr.key] = key
  if (expr.pos) item[expr.pos] = val
  return item
}


/* Beware: heavy stuff */
function _each(dom, parent, expr) {

  remAttr(dom, 'each')

  var tagName = getTagName(dom),
      template = dom.outerHTML,
      hasImpl = !!tagImpl[tagName],
      impl = tagImpl[tagName] || {
        tmpl: template
      },
      root = dom.parentNode,
      placeholder = document.createComment('riot placeholder'),
      tags = [],
      child = getTag(dom),
      checksum

  root.insertBefore(placeholder, dom)

  expr = loopKeys(expr)

  // clean template code
  parent
    .one('premount', function () {
      if (root.stub) root = parent.root
      // remove the original DOM node
      dom.parentNode.removeChild(dom)
    })
    .on('update', function () {
      var items = tmpl(expr.val, parent)

      // object loop. any changes cause full redraw
      if (!isArray(items)) {

        checksum = items ? JSON.stringify(items) : ''

        items = !items ? [] :
          Object.keys(items).map(function (key) {
            return mkitem(expr, key, items[key])
          })
      }

      var frag = document.createDocumentFragment(),
          i = tags.length,
          j = items.length

      // unmount leftover items
      while (i > j) {
        tags[--i].unmount()
        tags.splice(i, 1)
      }

      for (i = 0; i < j; ++i) {
        var _item = !checksum && !!expr.key ? mkitem(expr, items[i], i) : items[i]

        if (!tags[i]) {
          // mount new
          (tags[i] = new Tag(impl, {
              parent: parent,
              isLoop: true,
              hasImpl: hasImpl,
              root: SPECIAL_TAGS_REGEX.test(tagName) ? root : dom.cloneNode(),
              item: _item
            }, dom.innerHTML)
          ).mount()

          frag.appendChild(tags[i].root)
        } else
          tags[i].update(_item)

        tags[i]._item = _item

      }

      root.insertBefore(frag, placeholder)

      if (child) parent.tags[tagName] = tags

    }).one('updated', function() {
      var keys = Object.keys(parent)// only set new values
      walk(root, function(node) {
        // only set element node and not isLoop
        if (node.nodeType == 1 && !node.isLoop && !node._looped) {
          node._visited = false // reset _visited for loop node
          node._looped = true // avoid set multiple each
          setNamed(node, parent, keys)
        }
      })
    })

}


function parseNamedElements(root, tag, childTags) {

  walk(root, function(dom) {
    if (dom.nodeType == 1) {
      dom.isLoop = dom.isLoop || (dom.parentNode && dom.parentNode.isLoop || dom.getAttribute('each')) ? 1 : 0

      // custom child tag
      var child = getTag(dom)

      if (child && !dom.isLoop) {
        childTags.push(initChildTag(child, dom, tag))
      }

      if (!dom.isLoop)
        setNamed(dom, tag, [])
    }

  })

}

function parseExpressions(root, tag, expressions) {

  function addExpr(dom, val, extra) {
    if (val.indexOf(brackets(0)) >= 0) {
      var expr = { dom: dom, expr: val }
      expressions.push(extend(expr, extra))
    }
  }

  walk(root, function(dom) {
    var type = dom.nodeType

    // text node
    if (type == 3 && dom.parentNode.tagName != 'STYLE') addExpr(dom, dom.nodeValue)
    if (type != 1) return

    /* element */

    // loop
    var attr = dom.getAttribute('each')

    if (attr) { _each(dom, tag, attr); return false }

    // attribute expressions
    each(dom.attributes, function(attr) {
      var name = attr.name,
        bool = name.split('__')[1]

      addExpr(dom, attr.value, { attr: bool || name, bool: bool })
      if (bool) { remAttr(dom, name); return false }

    })

    // skip custom tags
    if (getTag(dom)) return false

  })

}
function Tag(impl, conf, innerHTML) {

  var self = riot.observable(this),
      opts = inherit(conf.opts) || {},
      dom = mkdom(impl.tmpl),
      parent = conf.parent,
      isLoop = conf.isLoop,
      hasImpl = conf.hasImpl,
      item = cleanUpData(conf.item),
      expressions = [],
      childTags = [],
      root = conf.root,
      fn = impl.fn,
      tagName = root.tagName.toLowerCase(),
      attr = {},
      propsInSyncWithParent = []

  if (fn && root._tag) {
    root._tag.unmount(true)
  }

  // not yet mounted
  this.isMounted = false
  root.isLoop = isLoop

  // keep a reference to the tag just created
  // so we will be able to mount this tag multiple times
  root._tag = this

  // create a unique id to this tag
  // it could be handy to use it also to improve the virtual dom rendering speed
  this._id = __uid++

  extend(this, { parent: parent, root: root, opts: opts, tags: {} }, item)

  // grab attributes
  each(root.attributes, function(el) {
    var val = el.value
    // remember attributes with expressions only
    if (brackets(/{.*}/).test(val)) attr[el.name] = val
  })

  if (dom.innerHTML && !/^(select|optgroup|table|tbody|tr|col(?:group)?)$/.test(tagName))
    // replace all the yield tags with the tag inner html
    dom.innerHTML = replaceYield(dom.innerHTML, innerHTML)

  // options
  function updateOpts() {
    var ctx = hasImpl && isLoop ? self : parent || self

    // update opts from current DOM attributes
    each(root.attributes, function(el) {
      opts[el.name] = tmpl(el.value, ctx)
    })
    // recover those with expressions
    each(Object.keys(attr), function(name) {
      opts[name] = tmpl(attr[name], ctx)
    })
  }

  function normalizeData(data) {
    for (var key in item) {
      if (typeof self[key] !== T_UNDEF)
        self[key] = data[key]
    }
  }

  function inheritFromParent () {
    if (!self.parent || !isLoop) return
    each(Object.keys(self.parent), function(k) {
      // some properties must be always in sync with the parent tag
      var mustSync = !~RESERVED_WORDS_BLACKLIST.indexOf(k) && ~propsInSyncWithParent.indexOf(k)
      if (typeof self[k] === T_UNDEF || mustSync) {
        // track the property to keep in sync
        // so we can keep it updated
        if (!mustSync) propsInSyncWithParent.push(k)
        self[k] = self.parent[k]
      }
    })
  }

  this.update = function(data) {
    // make sure the data passed will not override
    // the component core methods
    data = cleanUpData(data)
    // inherit properties from the parent
    inheritFromParent()
    // normalize the tag properties in case an item object was initially passed
    if (data && typeof item === T_OBJECT) {
      normalizeData(data)
      item = data
    }
    extend(self, data)
    updateOpts()
    self.trigger('update', data)
    update(expressions, self)
    self.trigger('updated')
  }

  this.mixin = function() {
    each(arguments, function(mix) {
      mix = typeof mix === T_STRING ? riot.mixin(mix) : mix
      each(Object.keys(mix), function(key) {
        // bind methods to self
        if (key != 'init')
          self[key] = isFunction(mix[key]) ? mix[key].bind(self) : mix[key]
      })
      // init method will be called automatically
      if (mix.init) mix.init.bind(self)()
    })
  }

  this.mount = function() {

    updateOpts()

    // initialiation
    if (fn) fn.call(self, opts)

    // parse layout after init. fn may calculate args for nested custom tags
    parseExpressions(dom, self, expressions)

    // mount the child tags
    toggle(true)

    // update the root adding custom attributes coming from the compiler
    // it fixes also #1087
    if (impl.attrs || hasImpl) {
      walkAttributes(impl.attrs, function (k, v) { root.setAttribute(k, v) })
      parseExpressions(self.root, self, expressions)
    }

    if (!self.parent || isLoop) self.update(item)

    // internal use only, fixes #403
    self.trigger('premount')

    if (isLoop && !hasImpl) {
      // update the root attribute for the looped elements
      self.root = root = dom.firstChild

    } else {
      while (dom.firstChild) root.appendChild(dom.firstChild)
      if (root.stub) self.root = root = parent.root
    }
    // if it's not a child tag we can trigger its mount event
    if (!self.parent || self.parent.isMounted) {
      self.isMounted = true
      self.trigger('mount')
    }
    // otherwise we need to wait that the parent event gets triggered
    else self.parent.one('mount', function() {
      // avoid to trigger the `mount` event for the tags
      // not visible included in an if statement
      if (!isInStub(self.root)) {
        self.parent.isMounted = self.isMounted = true
        self.trigger('mount')
      }
    })
  }


  this.unmount = function(keepRootTag) {
    var el = root,
        p = el.parentNode,
        ptag

    if (p) {

      if (parent) {
        ptag = getImmediateCustomParentTag(parent)
        // remove this tag from the parent tags object
        // if there are multiple nested tags with same name..
        // remove this element form the array
        if (isArray(ptag.tags[tagName]))
          each(ptag.tags[tagName], function(tag, i) {
            if (tag._id == self._id)
              ptag.tags[tagName].splice(i, 1)
          })
        else
          // otherwise just delete the tag instance
          ptag.tags[tagName] = undefined
      }

      else
        while (el.firstChild) el.removeChild(el.firstChild)

      if (!keepRootTag)
        p.removeChild(el)
      else
        // the riot-tag attribute isn't needed anymore, remove it
        p.removeAttribute('riot-tag')
    }


    self.trigger('unmount')
    toggle()
    self.off('*')
    // somehow ie8 does not like `delete root._tag`
    root._tag = null

  }

  function toggle(isMount) {

    // mount/unmount children
    each(childTags, function(child) { child[isMount ? 'mount' : 'unmount']() })

    // listen/unlisten parent (events flow one way from parent to children)
    if (parent) {
      var evt = isMount ? 'on' : 'off'

      // the loop tags will be always in sync with the parent automatically
      if (isLoop)
        parent[evt]('unmount', self.unmount)
      else
        parent[evt]('update', self.update)[evt]('unmount', self.unmount)
    }
  }

  // named elements available for fn
  parseNamedElements(dom, this, childTags)


}

function setEventHandler(name, handler, dom, tag) {

  dom[name] = function(e) {

    var item = tag._item,
        ptag = tag.parent,
        el

    if (!item)
      while (ptag && !item) {
        item = ptag._item
        ptag = ptag.parent
      }

    // cross browser event fix
    e = e || window.event

    // ignore error on some browsers
    try {
      e.currentTarget = dom
      if (!e.target) e.target = e.srcElement
      if (!e.which) e.which = e.charCode || e.keyCode
    } catch (ignored) { /**/ }

    e.item = item

    // prevent default behaviour (by default)
    if (handler.call(tag, e) !== true && !/radio|check/.test(dom.type)) {
      if (e.preventDefault) e.preventDefault()
      e.returnValue = false
    }

    if (!e.preventUpdate) {
      el = item ? getImmediateCustomParentTag(ptag) : tag
      el.update()
    }

  }

}

// used by if- attribute
function insertTo(root, node, before) {
  if (root) {
    root.insertBefore(before, node)
    root.removeChild(node)
  }
}

function update(expressions, tag) {

  each(expressions, function(expr, i) {

    var dom = expr.dom,
        attrName = expr.attr,
        value = tmpl(expr.expr, tag),
        parent = expr.dom.parentNode

    if (expr.bool)
      value = value ? attrName : false
    else if (value == null)
      value = ''

    // leave out riot- prefixes from strings inside textarea
    // fix #815: any value -> string
    if (parent && parent.tagName == 'TEXTAREA') value = ('' + value).replace(/riot-/g, '')

    // no change
    if (expr.value === value) return
    expr.value = value

    // text node
    if (!attrName) {
      dom.nodeValue = '' + value    // #815 related
      return
    }

    // remove original attribute
    remAttr(dom, attrName)
    // event handler
    if (isFunction(value)) {
      setEventHandler(attrName, value, dom, tag)

    // if- conditional
    } else if (attrName == 'if') {
      var stub = expr.stub,
          add = function() { insertTo(stub.parentNode, stub, dom) },
          remove = function() { insertTo(dom.parentNode, dom, stub) }

      // add to DOM
      if (value) {
        if (stub) {
          add()
          dom.inStub = false
          // avoid to trigger the mount event if the tags is not visible yet
          // maybe we can optimize this avoiding to mount the tag at all
          if (!isInStub(dom)) {
            walk(dom, function(el) {
              if (el._tag && !el._tag.isMounted) el._tag.isMounted = !!el._tag.trigger('mount')
            })
          }
        }
      // remove from DOM
      } else {
        stub = expr.stub = stub || document.createTextNode('')
        // if the parentNode is defined we can easily replace the tag
        if (dom.parentNode)
          remove()
        else
        // otherwise we need to wait the updated event
          (tag.parent || tag).one('updated', remove)

        dom.inStub = true
      }
    // show / hide
    } else if (/^(show|hide)$/.test(attrName)) {
      if (attrName == 'hide') value = !value
      dom.style.display = value ? '' : 'none'

    // field value
    } else if (attrName == 'value') {
      dom.value = value

    // <img src="{ expr }">
    } else if (startsWith(attrName, RIOT_PREFIX) && attrName != RIOT_TAG) {
      if (value)
        dom.setAttribute(attrName.slice(RIOT_PREFIX.length), value)

    } else {
      if (expr.bool) {
        dom[attrName] = value
        if (!value) return
      }

      if (typeof value !== T_OBJECT) dom.setAttribute(attrName, value)

    }

  })

}
function each(els, fn) {
  for (var i = 0, len = (els || []).length, el; i < len; i++) {
    el = els[i]
    // return false -> remove current item during loop
    if (el != null && fn(el, i) === false) i--
  }
  return els
}

function isFunction(v) {
  return typeof v === T_FUNCTION || false   // avoid IE problems
}

function remAttr(dom, name) {
  dom.removeAttribute(name)
}

function getTag(dom) {
  return dom.tagName && tagImpl[dom.getAttribute(RIOT_TAG) || dom.tagName.toLowerCase()]
}

function initChildTag(child, dom, parent) {
  var tag = new Tag(child, { root: dom, parent: parent }, dom.innerHTML),
      tagName = getTagName(dom),
      ptag = getImmediateCustomParentTag(parent),
      cachedTag

  // fix for the parent attribute in the looped elements
  tag.parent = ptag

  cachedTag = ptag.tags[tagName]

  // if there are multiple children tags having the same name
  if (cachedTag) {
    // if the parent tags property is not yet an array
    // create it adding the first cached tag
    if (!isArray(cachedTag))
      ptag.tags[tagName] = [cachedTag]
    // add the new nested tag to the array
    if (!~ptag.tags[tagName].indexOf(tag))
      ptag.tags[tagName].push(tag)
  } else {
    ptag.tags[tagName] = tag
  }

  // empty the child node once we got its template
  // to avoid that its children get compiled multiple times
  dom.innerHTML = ''

  return tag
}

function getImmediateCustomParentTag(tag) {
  var ptag = tag
  while (!getTag(ptag.root)) {
    if (!ptag.parent) break
    ptag = ptag.parent
  }
  return ptag
}

function getTagName(dom) {
  var child = getTag(dom),
    namedTag = dom.getAttribute('name'),
    tagName = namedTag && namedTag.indexOf(brackets(0)) < 0 ? namedTag : child ? child.name : dom.tagName.toLowerCase()

  return tagName
}

function extend(src) {
  var obj, args = arguments
  for (var i = 1; i < args.length; ++i) {
    if ((obj = args[i])) {
      for (var key in obj) {      // eslint-disable-line guard-for-in
        src[key] = obj[key]
      }
    }
  }
  return src
}

// with this function we avoid that the current Tag methods get overridden
function cleanUpData(data) {
  if (!(data instanceof Tag) && !(data && typeof data.trigger == T_FUNCTION)) return data

  var o = {}
  for (var key in data) {
    if (!~RESERVED_WORDS_BLACKLIST.indexOf(key))
      o[key] = data[key]
  }
  return o
}

function walk(dom, fn) {
  if (dom) {
    if (fn(dom) === false) return
    else {
      dom = dom.firstChild

      while (dom) {
        walk(dom, fn)
        dom = dom.nextSibling
      }
    }
  }
}

// minimize risk: only zero or one _space_ between attr & value
function walkAttributes(html, fn) {
  var m,
      re = /([-\w]+) ?= ?(?:"([^"]*)|'([^']*)|({[^}]*}))/g

  while ((m = re.exec(html))) {
    fn(m[1].toLowerCase(), m[2] || m[3] || m[4])
  }
}

function isInStub(dom) {
  while (dom) {
    if (dom.inStub) return true
    dom = dom.parentNode
  }
  return false
}

function mkEl(name) {
  return document.createElement(name)
}

function replaceYield(tmpl, innerHTML) {
  return tmpl.replace(/<(yield)\/?>(<\/\1>)?/gi, innerHTML || '')
}

function $$(selector, ctx) {
  return (ctx || document).querySelectorAll(selector)
}

function $(selector, ctx) {
  return (ctx || document).querySelector(selector)
}

function inherit(parent) {
  function Child() {}
  Child.prototype = parent
  return new Child()
}

function setNamed(dom, parent, keys) {
  if (dom._visited) return
  var p,
      v = dom.getAttribute('id') || dom.getAttribute('name')

  if (v) {
    if (keys.indexOf(v) < 0) {
      p = parent[v]
      if (!p)
        parent[v] = dom
      else if (isArray(p))
        p.push(dom)
      else
        parent[v] = [p, dom]
    }
    dom._visited = true
  }
}

// faster String startsWith alternative
function startsWith(src, str) {
  return src.slice(0, str.length) === str
}

/*
 Virtual dom is an array of custom tags on the document.
 Updates and unmounts propagate downwards from parent to children.
*/

var virtualDom = [],
    tagImpl = {},
    styleNode

function injectStyle(css) {

  if (riot.render) return // skip injection on the server

  if (!styleNode) {
    styleNode = mkEl('style')
    styleNode.setAttribute('type', 'text/css')
  }

  var head = document.head || document.getElementsByTagName('head')[0]

  if (styleNode.styleSheet)
    styleNode.styleSheet.cssText += css
  else
    styleNode.innerHTML += css

  if (!styleNode._rendered)
    if (styleNode.styleSheet) {
      document.body.appendChild(styleNode)
    } else {
      var rs = $('style[type=riot]')
      if (rs) {
        rs.parentNode.insertBefore(styleNode, rs)
        rs.parentNode.removeChild(rs)
      } else head.appendChild(styleNode)

    }

  styleNode._rendered = true

}

function mountTo(root, tagName, opts) {
  var tag = tagImpl[tagName],
      // cache the inner HTML to fix #855
      innerHTML = root._innerHTML = root._innerHTML || root.innerHTML

  // clear the inner html
  root.innerHTML = ''

  if (tag && root) tag = new Tag(tag, { root: root, opts: opts }, innerHTML)

  if (tag && tag.mount) {
    tag.mount()
    virtualDom.push(tag)
    return tag.on('unmount', function() {
      virtualDom.splice(virtualDom.indexOf(tag), 1)
    })
  }

}

riot.tag = function(name, html, css, attrs, fn) {
  if (isFunction(attrs)) {
    fn = attrs
    if (/^[\w\-]+\s?=/.test(css)) {
      attrs = css
      css = ''
    } else attrs = ''
  }
  if (css) {
    if (isFunction(css)) fn = css
    else injectStyle(css)
  }
  tagImpl[name] = { name: name, tmpl: html, attrs: attrs, fn: fn }
  return name
}

riot.mount = function(selector, tagName, opts) {

  var els,
      allTags,
      tags = []

  // helper functions

  function addRiotTags(arr) {
    var list = ''
    each(arr, function (e) {
      list += ', *[' + RIOT_TAG + '="' + e.trim() + '"]'
    })
    return list
  }

  function selectAllTags() {
    var keys = Object.keys(tagImpl)
    return keys + addRiotTags(keys)
  }

  function pushTags(root) {
    var last
    if (root.tagName) {
      if (tagName && (!(last = root.getAttribute(RIOT_TAG)) || last != tagName))
        root.setAttribute(RIOT_TAG, tagName)

      var tag = mountTo(root,
        tagName || root.getAttribute(RIOT_TAG) || root.tagName.toLowerCase(), opts)

      if (tag) tags.push(tag)
    }
    else if (root.length) {
      each(root, pushTags)   // assume nodeList
    }
  }

  // ----- mount code -----

  if (typeof tagName === T_OBJECT) {
    opts = tagName
    tagName = 0
  }

  // crawl the DOM to find the tag
  if (typeof selector === T_STRING) {
    if (selector === '*')
      // select all the tags registered
      // and also the tags found with the riot-tag attribute set
      selector = allTags = selectAllTags()
    else
      // or just the ones named like the selector
      selector += addRiotTags(selector.split(','))

    els = $$(selector)
  }
  else
    // probably you have passed already a tag or a NodeList
    els = selector

  // select all the registered and mount them inside their root elements
  if (tagName === '*') {
    // get all custom tags
    tagName = allTags || selectAllTags()
    // if the root els it's just a single tag
    if (els.tagName)
      els = $$(tagName, els)
    else {
      // select all the children for all the different root elements
      var nodeList = []
      each(els, function (_el) {
        nodeList.push($$(tagName, _el))
      })
      els = nodeList
    }
    // get rid of the tagName
    tagName = 0
  }

  if (els.tagName)
    pushTags(els)
  else
    each(els, pushTags)

  return tags
}

// update everything
riot.update = function() {
  return each(virtualDom, function(tag) {
    tag.update()
  })
}

// @deprecated
riot.mountTo = riot.mount

  // share methods for other riot parts, e.g. compiler
  riot.util = { brackets: brackets, tmpl: tmpl }

  // support CommonJS, AMD & browser
  /* istanbul ignore next */
  if (typeof exports === T_OBJECT)
    module.exports = riot
  else if (typeof define === 'function' && define.amd)
    define(function() { return (window.riot = riot) })
  else
    window.riot = riot

})(typeof window != 'undefined' ? window : void 0);

},{}],6:[function(require,module,exports){

'use strict';

module.exports = function (machine) {

  machine
    .state('home', {
      path: '/',
      component: 'home',
      resolve: {
        today: function () {
          return new Date();
        }
      },
      cacheable: false
    });
};
},{}],7:[function(require,module,exports){

'use strict';

module.exports = function (machine) {

  machine
    .state('views', {
      path: 'views',
      views: {
        '': {
          component: 'views'
        },
        '@views': {
          component: 'views-landing'
        }
      }
    })
    .state('views.riot', {
      path: 'riot',
      component: 'view-description',
      resolve: {
        content: function () {
          return 'Riot is super-cool';
        }
      }
    });
};
},{}],8:[function(require,module,exports){
riot.tag('home', '<h2>Welcome to the Riot Screen Machine Demo</h2> <p>The current date is { today }</p>', function(opts) {
    
    this.today = opts.today;

    this.interval = setInterval(function () {
      'use strict';
      this.today = new Date();
      this.update();
    }.bind(this), 1000);

    this.on('unmount', function () {
      'use strict';
      clearInterval(this.interval);
    }.bind(this));

  
});
riot.tag('view-description', '<h3>Riot JS</h3> <p>{ opts.content }</p>', function(opts) {


});
riot.tag('views-landing', '<p>This is the "Views" landing page.</p>', function(opts) {


});
riot.tag('views', '<h2>This is the views page</h2> <input type="text"> <sm-view></sm-view>', function(opts) {


});
},{}],9:[function(require,module,exports){
(function (global){

'use strict';

/* global -document */
/* global -Promise */
var document = require('global/document');
var riot = global.riot = require('riot');
var screenMachine = require('../../../ScreenMachine');
var riotComponent = require('../../../riotComponent');
var EventEmitter = require('events').EventEmitter;
var Promise = require('native-promise-only');
var emitter = new EventEmitter();


var config = {
  components: riotComponent(riot),
  document: document,
  promises: Promise,
  events: {
    emitter: emitter,
    trigger: 'emit'
  }
};

var machine = global.machine = screenMachine(config);

require('./tags');

var domready = require('domready');
var homeScreen = require('./screens/home');
var viewsScreen = require('./screens/views');

homeScreen(machine);
viewsScreen(machine);

domready(function () {

  machine.start();
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../../ScreenMachine":1,"../../../riotComponent":28,"./screens/home":6,"./screens/views":7,"./tags":8,"domready":2,"events":30,"global/document":3,"native-promise-only":4,"riot":5}],10:[function(require,module,exports){

'use strict';

module.exports = BaseComponent;


function BaseComponent(componentName, viewKey, state) {

  this.name = componentName;
  this.state = state;
  this.childViews = [];
}


BaseComponent.prototype.node = null;


BaseComponent.prototype.setView = function (view) {

  this.view = view;

  return this;
};


BaseComponent.prototype.addChildView = function (view) {

  this.childViews.push(view);

  return this;
};


BaseComponent.prototype.shouldRender = function () {

  return !this.view.isShadowed() &&
    this.view.nextComponent === this &&
    this.view.currentComponent !== this;
};


BaseComponent.prototype.load = function () {

  this.view.loadComponent(this);

  return this;
};

},{}],11:[function(require,module,exports){

'use strict';

module.exports = DependentResolve;


function DependentResolve(resolveKey, state) {

  var resolveDef = state.resolve[resolveKey];
  var invokableIndex = resolveDef.length - 1;

  this.key = resolveKey;
  this.id = resolveKey + '@' + state.name;
  this.state = state;
  this.invokable = resolveDef[invokableIndex];
  this.injectables = resolveDef
    .slice(0, invokableIndex)
    .map(function (injectable) {

      return injectable.indexOf('@') > -1
        ? injectable
        : injectable + '@' + state.name;
    });
  this.cacheable = state.cacheable === false
    ? false
    : true;
}


DependentResolve.prototype.execute = function (params, dependencies) {

  var args = this
    .injectables
    .map(function (injectableId) {

      return dependencies[injectableId];
    })
    .concat(params);

  return this.invokable.apply(null, args);
};

},{}],12:[function(require,module,exports){

'use strict';


module.exports = ResolveTask;


function ResolveTask(resolve, params, resolveCache, Promise) {

  this.resolve = resolve;
  this.id = resolve.id;
  this.params = params;
  this.cache = resolveCache;
  this.Promise = Promise;
  this.waitingFor = resolve.injectables
    ? resolve.injectables.slice()
    : [];
}


ResolveTask.prototype.dependencies = undefined;


ResolveTask.prototype.isWaitingFor = function (dependencyId) {

  return this.waitingFor.indexOf(dependencyId) > -1;
};


ResolveTask.prototype.setDependency = function (dependencyId, result) {

  this.dependencies || (this.dependencies = {});
  this.dependencies[dependencyId] = result;
  this.waitingFor.splice(this.waitingFor.indexOf(dependencyId), 1);

  return this;
};


ResolveTask.prototype.isReady = function () {

  return !this.waitingFor.length;
};


ResolveTask.prototype.run = function (transition, queue, complete, wait) {

  if (transition.isCanceled()) {

    return this.Promise.resolve();
  }

  queue.splice(queue.indexOf(this), 1);

  return this
    .exec()
    .then(function (result) {

      this.result = result;
      complete.push(this);

      if (complete.length === wait) {

        return this.Promise.resolve();
      }

      return this.runNext(transition, queue, complete, wait);
    }.bind(this));
};


ResolveTask.prototype.runNext = function (transition, queue, complete, wait) {

  var nextTasks = queue
    .filter(function (queued) {

      return queued.isWaitingFor(this.id);
    }, this)
    .map(function (dependent) {

      return dependent.setDependency(this.id, this.result);
    }, this)
    .filter(function (maybeReady) {

      return maybeReady.isReady();
    })
    .map(function (ready) {

      return ready.run(transition, queue, complete, wait);
    });

  return this.Promise.all(nextTasks);
};


ResolveTask.prototype.exec = function () {

  return new this.Promise(function (resolve, reject) {

    var resultOrPromise;

    try {

      resultOrPromise = this
        .resolve
        .execute(this.params, this.dependencies);
    }

    catch (e) {

      reject(e);
    }

    resolve(resultOrPromise);
  }.bind(this));
};


ResolveTask.prototype.commit = function () {

  this.cache.set(this.id, this.result);

  return this;
};

},{}],13:[function(require,module,exports){

'use strict';

var UrlPattern = require('url-pattern');
var reversePath = require('reverse-path');


module.exports = Route;


function Route(name, pathSegments, querySegments) {

  this.name = name;
  this.path = '/' + pathSegments.join('/');
  this.pattern = new UrlPattern(this.path);
  this.queryKeys = querySegments
    .map(function (segment) {

      return segment.split('&');
    })
    .reduce(function (keys, splitSegment) {

      return keys.concat(splitSegment);
    }, []);

}


Route.prototype.match = function (path) {

  return this.pattern.match.call(this.pattern, path);
};


Route.prototype.toRouteString = function (params) {

  var path = reversePath(this.path, params);
  var queryPairs = this
    .queryKeys
    .reduce(function (pairs, key) {

      if (typeof params[key] !== 'undefined') {

        pairs.push(key + '=' + params[key]);
      }

      return pairs;
    }, []);

  if (queryPairs.length) {

    path += '?' + queryPairs.join('&');
  }

  return path;
};


Route.prototype.parseQuery = function (queryString) {

  var queryKeys = this.queryKeys;

  return queryString
    .split('&')
    .reduce(function (queryParams, pair) {

      var querySplit = pair.split('=');

      if (queryKeys.indexOf(querySplit[0]) > -1 ) {

        queryParams[querySplit[0]] = querySplit[1];
      }

      return queryParams;
    }, {});
};

},{"reverse-path":25,"url-pattern":26}],14:[function(require,module,exports){

'use strict';

module.exports = SimpleResolve;


function SimpleResolve(resolveKey, state) {

  this.key = resolveKey;
  this.id = resolveKey + '@' + state.name;
  this.state = state;
  this.invokable = state.resolve[resolveKey];
  this.cacheable = state.cacheable === false
    ? false
    : true;
}


SimpleResolve.prototype.execute = function (params) {

  return this.invokable.call(null, params);
};

},{}],15:[function(require,module,exports){

'use strict';

var xtend = require('xtend/mutable');


module.exports = State;


function State(definition) {

  definition.cacheable = definition.cacheable === false
    ? false
    : true;

  this.$definition = definition;
  this.$ancestors = {};
  this.$includes = {};

  xtend(this, definition);

  this.$includes[this.name] = true;
  this.$ancestors[this.name] = this;

  if (!definition.parent) {

    var splitNames = definition.name.split('.');

    this.parent = splitNames[1]
      ? splitNames.slice(0, splitNames.length - 1).join('.')
      : null;
  }

  if (!definition.path) {

    this.$pathSegments = [''];
    this.$querySegments = [];
    this.$paramKeys = [];
    this.$queryKeys = [];
  }
  else {

    var pathOnly;
    var querySegment;
    var queryStart = definition.path.indexOf('?');

    if (queryStart > -1) {

      pathOnly = definition.path.slice(0, queryStart);
      querySegment = definition.path.slice(queryStart + 1);
    }
    else {

      pathOnly = definition.path;
      querySegment = '';
    }

    var splitPath = pathOnly.split('/');

    this.$pathSegments = !!splitPath[0]
      ? splitPath
      : splitPath.slice(1);
    this.$querySegments = querySegment
      ? [querySegment]
      : [];
    this.$paramKeys = this
      .$pathSegments
      .filter(function (anySegment) {

        return anySegment[0] === ':';
      })
      .map(function (dynamicSegment) {

        return dynamicSegment.slice(1);
      });
    this.$queryKeys = querySegment
      ? querySegment.split('&')
      : [];
  }
}


State.prototype.$parent = null;
State.prototype.$branch = null;
State.prototype.$resolves = null;
State.prototype.$views = null;
State.prototype.$components = null;
State.prototype.$paramCache = null;
State.prototype.$pathSegments = null;


State.prototype.inheritFrom = function (parentNode) {

  this.data = xtend({}, parentNode.data, this.data || {});

  xtend(this.$includes, parentNode.$includes);
  xtend(this.$ancestors, parentNode.$ancestors);

  this.$branch = parentNode
    .getBranch()
    .concat(this);
  this.$pathSegments = parentNode.$pathSegments.concat(this.$pathSegments);
  this.$querySegments = parentNode.$querySegments.concat(this.$querySegments);
  this.$paramKeys = parentNode.$paramKeys.concat(this.$paramKeys);
  this.$parent = parentNode;

  return this;
};


State.prototype.contains = function (state) {

  return this.$includes[state.name] || false;
};


State.prototype.getBranch = function () {

  return this.$branch
    ? this.$branch.slice()
    : [this];
};


State.prototype.getParent = function () {

  return this.$parent;
};


State.prototype.getAncestor = function (stateName) {

  return this.$ancestors[stateName];
};


State.prototype.addResolve = function (resolve) {

  this.$resolves || (this.$resolves = []);
  this.$resolves.push(resolve);

  return this;
};


State.prototype.getResolves = function () {

  return this.$resolves
    ? this.$resolves.slice()
    : [];
};


State.prototype.getResolveResults = function (resolveCache) {

  return this
    .$resolves
    .reduce(function (results, resolve) {

      results[resolve.key] = resolveCache.get(resolve.id);

      return results;
    }, {});
};


State.prototype.filterParams = function (allParams) {

  return this
    .$paramKeys
    .concat(this.$queryKeys)
    .reduce(function (ownParams, key) {

      ownParams[key] = allParams[key];

      return ownParams;
    }, {});
};


State.prototype.isStale = function (oldParams, newParams) {

  return this
    .$paramKeys
    .concat(this.$queryKeys)
    .some(function (key) {

      return newParams[key] !== oldParams[key];
    });
};


State.prototype.sleep = function () {

  this.$views.forEach(function (view) {

    view.detach();
  });

  this.$resolves.forEach(function (resolve) {

    resolve.clearCache();
  });

  this.$paramCache = null;

  return this;
};


State.prototype.addView = function (view) {

  this.$views || (this.$views = []);
  this.$views.push(view);

  return this;
};


State.prototype.getViews = function () {

  return this.$views
    ? this.$views.slice()
    : [];
};


State.prototype.addComponent = function (component) {

  this.$components || (this.$components = []);
  this.$components.push(component);

  return this;
};


State.prototype.getComponents = function () {

  return this.$components
    ? this.$components.slice().reverse()
    : [];
};


State.prototype.getAllComponents = function () {

  return this
    .getBranch()
    .reverse()
    .reduce(function (components, state) {

      return components.concat(state.getComponents());
    }, []);
};


State.prototype.shouldResolve = function (resolved) {

  if (!this.cacheable) return true;

  return this.$resolves && this.$resolves.length &&
    this.$resolves.some(function (resolve) {

      return !(resolve.id in resolved);
    });
};

},{"xtend/mutable":27}],16:[function(require,module,exports){

'use strict';


module.exports = Transition;


function Transition(machine, to, toParams) {

  this.machine = machine;
  this.to = to;
  this.toParams = toParams;
  this.from = machine.currentState;
  this.fromParams = machine.currentParams;
}


Transition.prototype.canceled = false;
Transition.prototype.succeeded = false;
Transition.prototype.error = null;
Transition.prototype.handled = null;


Transition.prototype.setError = function (err) {

  this.canceled = true;
  this.handled = false;
  this.error = err;
};


Transition.prototype.errorHandled = function () {

  this.handled = true;
};


Transition.prototype.isHandled = function () {

  return this.handled;
};


Transition.prototype.isCanceled = function isCanceled() {

  if (this.succeeded) return false;

  if (!this.canceled && this !== this.machine.$state.transition) {

    this.canceled = true;
  }

  return this.canceled;
};


Transition.prototype.cancel = function () {

  this.canceled = true;

  return this;
};


Transition.prototype.finish = function () {

  this.succeeded = true;
  this.machine.init(this.to, this.toParams);
};


Transition.prototype.redirect = function () {

  return this.machine.transitionTo.apply(this.machine, arguments);
};


Transition.prototype.retry = function () {

  return this.redirect(this.to, this.toParams);
};

},{}],17:[function(require,module,exports){

'use strict';


module.exports = View;


function View(viewKey, tree) {

  this.viewKey = viewKey;
  this.tree = tree;

  var viewName = viewKey.slice(0, viewKey.indexOf('@'));

  this.selector = viewName
    ? 'sm-view[name="' + viewName + '"]'
    : 'sm-view:not([name])';
  this.components = {};
}


View.prototype.parent = null;
View.prototype.children = null;
View.prototype.container = null;
View.prototype.element = null;
View.prototype.content = null;
View.prototype.nextComponent = null;
View.prototype.currentComponent = null;
View.prototype.lastComponent = null;


View.prototype.attachWithin = function (node) {

  this.element = node.querySelector(this.selector);
  this.content = this.element
    ? this.element.firstElementChild
    : null;

  return this;
};


View.prototype.detach = function () {

  this.close();
  this.element = null;

  return this;
};


View.prototype.addComponent = function (stateName, component) {

  component.setView(this);
  this.components[stateName] = component;

  return this;
};


View.prototype.addChild = function (view) {

  view.parent = this;

  this.children || (this.children = []);
  this.children.push(view);

  return this;
};


View.prototype.setContainer = function (component) {

  component.view.addChild(this);
  component.addChildView(this);
  this.container = component;

  return this;
};


View.prototype.loadComponent = function (component) {

  if (this.isLoaded()) return this;

  this.nextComponent = component;
  this.tree.loadedViews.push(this);

  return this;
};


View.prototype.unload = function () {

  if (this.children) {

    this
      .children
      .filter(function (child) {

        return child.isLoaded();
      }, this)
      .forEach(function (child) {

        child.unload();
      });
  }

  var loadedViews = this.tree.loadedViews;

  loadedViews.splice(loadedViews.indexOf(this), 1);

  this.nextComponent = null;

  return this;
};


View.prototype.isLoaded = function () {

  return this.tree.loadedViews.indexOf(this) > -1;
};


View.prototype.isShadowed = function () {

  return !!this.container &&
    this.container.view.nextComponent !== this.container;
};


View.prototype.publish = function (resolved, params) {

  if (this.shouldUpdate()) {

    this.currentComponent.update(resolved, params);

    return this;
  }

  if (this.content) {

    this.element.replaceChild(this.nextComponent.node, this.content);
  }
  else {

    this.element.appendChild(this.nextComponent.node);
  }

  this.content = this.nextComponent.node;
  this.lastComponent = this.currentComponent;
  this.currentComponent = this.nextComponent;
  this.nextComponent = null;

  return this;
};


View.prototype.shouldUpdate = function () {

  return !!this.currentComponent &&
    (this.currentComponent === this.nextComponent);
};


View.prototype.shouldClose = function () {

  return !this.isLoaded();
};


View.prototype.close = function () {

  if (this.content) {

    this.element.removeChild(this.content);
  }

  if (this.currentComponent) {

    this.currentComponent.destroy();
  }

  this.content = this.currentComponent = null;

  return this;
};


View.prototype.cleanUp = function () {

  if (this.lastComponent) {

    this.lastComponent.destroy();
  }

  this.lastComponent = null;

  return this;
};

},{}],18:[function(require,module,exports){

'use strict';


module.exports = eventBus;


function eventBus(events) {

  var emitter = events.emitter;
  var trigger = events.trigger;

  return {

    notify: function notify() {

      emitter[trigger].apply(emitter, arguments);
    }

  };
}

},{}],19:[function(require,module,exports){

'use strict';

var xtend = require('xtend/mutable');


module.exports = resolveCache;


var cache = {

  $store: {},


  set: function (resolveId, value) {

    this.$store[resolveId] = value;

    return this;
  },


  unset: function (resolveId) {

    delete this.$store[resolveId];

    return this;
  },


  get: function (resolveId) {

    return this.$store[resolveId];
  }

};


function resolveCache(options) {

  var instance;

  if (options && options.stateless) {

    instance = xtend({}, cache);
    instance.$store = {};
  }
  else {

    instance = cache;
  }

  return instance;
}

},{"xtend/mutable":27}],20:[function(require,module,exports){

'use strict';

var resolveCache = require('./resolveCache');
var SimpleResolve = require('./SimpleResolve');
var DependentResolve = require('./DependentResolve');
var ResolveTask = require('./ResolveTask');


module.exports = resolveService;


function resolveService(Promise) {

  return {

    Promise: Promise,


    stateless: false,


    getCache: function () {

      return resolveCache({ stateless: this.stateless });
    },


    instantiate: function (resolveKey, state) {

      return Array.isArray(state.resolve[resolveKey])
        ? new DependentResolve(resolveKey, state)
        : new SimpleResolve(resolveKey, state);
    },


    addResolvesTo: function (state) {

      if (state.resolve != null && typeof state.resolve === 'object') {

        Object
          .keys(state.resolve)
          .forEach(function (resolveKey) {

            var resolve = this.instantiate(resolveKey, state);
            state.addResolve(resolve);
          }, this);
      }

      return this;
    },


    createTask: function (resolve, params, resolveCache) {

      var taskParams = resolve.state.filterParams(params);

      return new ResolveTask(resolve, taskParams, resolveCache, Promise);
    },


    runTasks: function (tasks, resolveCache, transition) {

      if (!tasks.length) {

        return Promise.all([]);
      }

      this.prepareTasks(tasks, resolveCache);

      var queue = tasks.slice();
      var complete = [];
      var wait = queue.length;

      var runTasks = queue
        .filter(function (task) {

          return task.isReady();
        })
        .map(function (ready) {

          return ready.run(transition, queue, complete, wait);
        });

      return Promise.all(runTasks)
        .then(function () {

          return Promise.resolve(complete);
        });
    },


    prepareTasks: function (tasks, resolveCache) {

      var graph = tasks
        .reduce(function (graph, task) {

          graph[task.id] = task.waitingFor;

          return graph;
        }, {});

      tasks
        .filter(function (task) {

          return !task.isReady();
        })
        .forEach(function (dependent) {

          dependent
            .waitingFor
            .filter(function (dependency) {

              return !(dependency in graph);
            })
            .forEach(function (absent) {

              var cached = resolveCache.get(absent);

              dependent.setDependency(absent, cached);
            });
        });


      var VISITING = 1;
      var OK = 2;
      var visited = {};
      var stack = [];
      var taskId;

      for (taskId in graph) {

        visit(taskId);
      }

      return this;


      function visit(taskId) {

        if (visited[taskId] === OK) return;

        stack.push(taskId);

        if (visited[taskId] === VISITING) {

          stack.splice(0, stack.indexOf(taskId));

          throw new Error('Cyclic resolve dependency: ' + stack.join(' -> '));
        }

        visited[taskId] = VISITING;

        graph[taskId].forEach(visit);

        stack.pop();
        visited[taskId] = OK;
      }
    }

  };
}

},{"./DependentResolve":11,"./ResolveTask":12,"./SimpleResolve":14,"./resolveCache":19}],21:[function(require,module,exports){

'use strict';

var xtend = require('xtend/mutable');
var Route = require('./Route');


module.exports = router;


function router(window, options) {

  options || (options = {});

  var location = window.location;
  var history = window.history;
  var windowEvent = history.pushState && (options.html5 !== false)
    ? 'popstate'
    : 'hashchange';

  return {

    onChange: null,


    sendRouteChange: function () {

      var url = this.getUrl();
      var found = this.findRoute(url);

      this.onChange.apply(null, found);
    },


    routes: {},


    routesByLength: {},


    add: function (name, pathSegments, querySegment) {

      var route = new Route(name, pathSegments, querySegment);
      var pathLength = pathSegments.length;
      var routesByLength = this.routesByLength;

      routesByLength[pathLength] || (routesByLength[pathLength] = []);
      routesByLength[pathLength].push(route);
      this.routes[name] = route;

      return route;
    },


    findRoute: function (url) {

      var queryStart = url.indexOf('?');
      var path;
      var query;

      if (queryStart > -1) {

        path = url.slice(0, queryStart);
        query = url.slice(queryStart + 1);
      }
      else {

        path = url;
      }

      var pathLength = path.split('/').length - 1;
      var possibleRoutes = this.routesByLength[pathLength] || [];
      var routeIndex = 0;
      var route, params;

      while (!params && routeIndex < possibleRoutes.length) {

        route = possibleRoutes[routeIndex];
        params = route.match(path);
        routeIndex++;
      }

      if (!params) return null;

      if (query) {

        xtend(params, route.parseQuery(query));
      }

      return [route.name, params];
    },


    href: function (name, params) {

      return this.routes[name].toRouteString(params);
    },


    listen: function (onChange) {

      this.onChange = onChange;
      this.watchLocation();
      this.sendRouteChange();
    },


    watchLocation: function () {

      window.addEventListener(windowEvent, this.sendRouteChange.bind(this));
    },


    ignoreLocation: function () {

      window.removeEventListener(windowEvent, this.sendRouteChange.bind(this));
    },


    update: function (stateName, params, options) {

      var url = this.href(stateName, params);

      this.setUrl(url, options);
    },


    getUrl: function () {

      return windowEvent === 'popstate'
        ? location.pathname + location.search + location.hash
        : location.hash.slice(1) || '/';
    },


    setUrl: function (url, options) {

      var defaults = { replace: false };

      options || (options = {});
      options = xtend(defaults, options);

      if (windowEvent === 'popstate') {

        if (options.replace) {

          history.replaceState({}, null, url);
        }
        else {

          history.pushState({}, null, url);
        }
      }
      else {

        if (options.replace) {

          var href = location.protocol +
            '//' +
            location.host +
            location.pathname +
            location.search +
            '#' +
            url;

          this.ignoreLocation();
          location.replace(href);
          this.watchLocation();
        }
        else {

          this.ignoreLocation();
          location.hash = url;
          this.watchLocation();
        }
      }
    }

  };
}

},{"./Route":13,"xtend/mutable":27}],22:[function(require,module,exports){

'use strict';

var Transition = require('./Transition');


module.exports = stateMachine;


function stateMachine(events, registry, resolves, router, views) {

  var Promise = resolves.Promise;

  return {

    $state: {
      current: null,
      params: null,
      transition: null
    },


    init: function init(state, params) {

      this.$state.current = state;
      this.$state.params = params;
      this.$state.transition = null;

      return this;
    },


    state: function () {

      registry.add.apply(registry, arguments);

      return this;
    },


    start: function () {

      views.mountRoot();
      router.listen(function onRouteChange(name, params) {

        return this.transitionTo(name, params, { routeChange: true });
      }.bind(this));

      return this;
    },


    transitionTo: function (stateName, toParams, options) {

      options || (options = {});

      var toState = typeof stateName === 'string'
        ? registry.states[stateName]
        : stateName;
      var fromParams = this.$state.params;
      var resolveCache = resolves.getCache();
      var transition = new Transition(this, toState, toParams);

      this.$state.transition = transition;

      events.notify('stateChangeStart', transition);

      if (transition.isCanceled()) {

        events.notify('stateChangeCanceled', transition);

        return Promise.resolve(transition);
      }

      var tasks = toState
        .getBranch()
        .filter(function (state) {

          return state.isStale(fromParams, toParams) ||
            state.shouldResolve(resolveCache.$store);
        })
        .reduce(function (resolves, state) {

          return resolves.concat(state.getResolves());
        }, [])
        .map(function (resolve) {

          return resolves.createTask(resolve, toParams, resolveCache);
        });

      return resolves
        .runTasks(tasks, resolveCache, transition)
        .then(function (completed) {

          if (transition.isCanceled()) {

            events.notify('stateChangeCanceled', transition);

            return Promise.resolve(transition);
          }

          completed
            .forEach(function (task) {

              task.commit();
            });

          transition.finish();

          var components = toState.getAllComponents();
          var resolved = resolveCache.$store;

          views.compose(components, resolved, toParams);

          if (!options.routeChange) {

            router.update(toState.name, toParams, { replace: false });
          }

          events.notify('stateChangeSuccess', transition);

        }.bind(this))
        .catch(function (err) {

          transition.setError(err);
          events.notify('stateChangeError', transition);

          if (transition.isHandled()) {

            return Promise.resolve(transition);
          }

          throw err;
        });
    }

  };
}

},{"./Transition":16}],23:[function(require,module,exports){

'use strict';

var State = require('./State');


module.exports = stateRegistry;


function stateRegistry(viewTree, resolveService, router) {

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
      router.add(state.name, state.$pathSegments, state.$queryKeys);

      return this.flushQueueFor(state);
    },


    enqueue: function (parentName, state) {

      this.queues[parentName] || (this.queues[parentName] = []);
      this.queues[parentName].push(state);

      return this;
    },


    flushQueueFor: function (state) {

      var queue = this.queues[state.name];

      while (queue && queue.length) {

        this.register(queue.pop());
      }

      return this;
    }

  };

  var rootState = registry.$root = new State({ name: '' });

  rootState.addView(viewTree.views['@']);
  rootState.$pathSegments = [];

  return registry;
}

},{"./State":15}],24:[function(require,module,exports){

'use strict';

var View = require('./View');


module.exports = viewTree;


function viewTree(document, Component) {

  var tree = {
    loadedViews: [],
    activeViews: []
  };

  var rootView = new View('@', tree);

  return {

    $root: rootView,


    views: {
      '@': rootView
    },


    mountRoot: function () {

      rootView.attachWithin(document.body);
      tree.activeViews.push(rootView);
    },


    processState: function (state) {

      var componentName;
      var view;

      if (state.views != null) {

        Object
          .keys(state.views)
          .sort()
          .forEach(function (viewKey) {

            componentName = viewKey;
            view = this.ensureView(viewKey, state);
            this.createComponent(componentName, viewKey, state, view);
          }, this);
      }
      else if (state.component) {

        componentName = '';
        view = this.ensureView(null, state);
        this.createComponent(componentName, view.viewKey, state, view);
      }

      return this;
    },


    ensureView: function (viewKey, state) {

      viewKey || (viewKey = '@' + (state.parent || ''));

      return this.views[viewKey] || this.createView(viewKey, state);
    },


    createView: function (viewKey, state) {

      viewKey = viewKey.indexOf('@') > -1
        ? viewKey
        : viewKey + '@' + state.parent;

      var targetStateName = viewKey.slice(viewKey.indexOf('@') + 1);
      var targetState = targetStateName === state.name
        ? state
        : state.getAncestor(targetStateName);
      var view = this.views[viewKey] = new View(viewKey, tree);

      targetState.addView(view);

      var container = targetState
        .getComponents()
        .sort()[0];

      view.setContainer(container);

      return view;
    },


    createComponent: function (componentName, viewKey, state, view) {

      var component = new Component(componentName, viewKey, state, view);

      view.addComponent(state.name, component);
      state.addComponent(component);

      return component;
    },


    compose: function (components, resolved, params) {

      components
        .map(function (component) {

          return component.load();
        })
        .filter(function (component) {

          return component.shouldRender();
        })
        .forEach(function (component) {

          component.render(resolved, params);
        });

      tree
        .loadedViews
        .filter(function (loaded) {

          return loaded.isShadowed();
        })
        .forEach(function (shadowed) {

          shadowed.unload();
        });

      var toClose = tree
        .activeViews
        .filter(function (active) {

          return active.shouldClose();
        });

      tree.activeViews = tree.loadedViews.slice();

      tree
        .loadedViews
        .map(function (view) {

          return view.publish(resolved, params);
        })
        .forEach(function (view) {

          return view.cleanUp();
        });

      toClose
        .forEach(function (view) {

          view.close();
        });

      tree
        .loadedViews
        .slice()
        .forEach(function (view) {

          view.unload();
        });
    }

  };
}
},{"./View":17}],25:[function(require,module,exports){
'use strict';

module.exports = reversePath;

// regex from https://github.com/component/path-to-regexp
var PATH_REGEXP = new RegExp([
  // Match already escaped characters that would otherwise incorrectly appear
  // in future matches. This allows the user to escape special characters that
  // shouldn't be transformed.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
  '([\\/.])?(?:\\:(\\w+)(?:\\((.+)\\))?|\\((.+)\\))([?])?',
  // Match regexp special characters that should always be escaped.
  '([.+*?=^!:${}()[\\]|\\/])'
].join('|'), 'g');

function reversePath(path, params, options) {
    var index = 0;
    params = params || {};
    options = options || {};

    return path.replace(PATH_REGEXP, replace);


  function replace(match, escaped, prefix, key, capture, group, optional, escape) {
      if(escaped) return escaped;
      if(escape) return escape;

      prefix = prefix || '';

      var value = params[key || index++];

      if(value === undefined) {
          if(optional) {
              value = '';
          } else {
              throw new Error('Parameter "' + key + '" is required.');
          }
      }

      return prefix + value;
  }
}

},{}],26:[function(require,module,exports){
// Generated by CoffeeScript 1.9.2
(function(root, factory) {
  if (('function' === typeof define) && (define.amd != null)) {
    return define([], factory);
  } else if (typeof exports !== "undefined" && exports !== null) {
    return module.exports = factory();
  } else {
    return root.UrlPattern = factory();
  }
})(this, function() {
  var Compiler, UrlPattern, escapeForRegex;
  escapeForRegex = function(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };
  Compiler = function() {};
  Compiler.prototype.escapeChar = '\\';
  Compiler.prototype.segmentNameStartChar = ':';
  Compiler.prototype.segmentNameCharset = 'a-zA-Z0-9';
  Compiler.prototype.segmentValueCharset = 'a-zA-Z0-9-_ %';
  Compiler.prototype.optionalSegmentStartChar = '(';
  Compiler.prototype.optionalSegmentEndChar = ')';
  Compiler.prototype.wildcardChar = '*';
  Compiler.prototype.segmentValueRegexString = function() {
    return "([" + this.segmentValueCharset + "]+)";
  };
  Compiler.prototype.segmentNameCharRegex = function() {
    return new RegExp('^[' + this.segmentNameCharset + ']$');
  };
  Compiler.prototype.transition = function(nextMode) {
    if (this.mode === nextMode) {
      if (this.mode === 'namedSegment' || this.mode === 'staticSegment') {
        this.segment += this.char;
      }
      return;
    }
    if (this.mode === 'staticSegmentEscapeNextChar' && nextMode === 'staticSegment') {
      this.segment += this.char;
      this.mode = nextMode;
      return;
    }
    if (!(this.mode === 'staticSegment' && nextMode === 'staticSegmentEscapeNextChar')) {
      switch (this.mode) {
        case 'namedSegment':
          this.names.push(this.segment);
          this.regexString += this.segmentValueRegexString();
          break;
        case 'staticSegment':
          this.regexString += escapeForRegex(this.segment);
          break;
        case 'namedSegmentStart':
          if (nextMode !== 'namedSegment') {
            throw new Error("`" + this.segmentNameStartChar + "` must be followed by the name of the named segment consisting of at least one character in character set `" + this.segmentNameCharset + "` at " + this.index);
          }
      }
    }
    if (this.mode !== 'staticSegment' && nextMode === 'staticSegmentEscapeNextChar') {
      this.segment = '';
    }
    if (nextMode === 'namedSegment' || nextMode === 'staticSegment') {
      this.segment = this.char;
    }
    return this.mode = nextMode;
  };
  Compiler.prototype.compile = function(string) {
    var length, segmentNameCharRegex;
    this.string = string;
    this.index = -1;
    this.char = '';
    this.mode = 'unknown';
    this.segment = '';
    this.openParens = 0;
    this.names = [];
    this.regexString = '^';
    segmentNameCharRegex = this.segmentNameCharRegex();
    length = this.string.length;
    while (++this.index < length) {
      this.char = this.string.charAt(this.index);
      if (this.mode === 'staticSegmentEscapeNextChar') {
        this.transition('staticSegment');
        continue;
      }
      switch (this.char) {
        case this.segmentNameStartChar:
          if (this.mode === 'namedSegment') {
            throw new Error("cannot start named segment right after named segment at " + this.index);
          }
          this.transition('namedSegmentStart');
          break;
        case this.escapeChar:
          this.transition('staticSegmentEscapeNextChar');
          break;
        case this.optionalSegmentStartChar:
          this.transition('unknown');
          this.openParens++;
          this.regexString += '(?:';
          break;
        case this.optionalSegmentEndChar:
          this.transition('unknown');
          this.openParens--;
          if (this.openParens < 0) {
            throw new Error("did not expect " + this.optionalSegmentEndChar + " at " + this.index);
          }
          this.regexString += ')?';
          break;
        case this.wildcardChar:
          this.transition('unknown');
          this.regexString += '(.*?)';
          this.names.push('_');
          break;
        default:
          switch (this.mode) {
            case 'namedSegmentStart':
              if (segmentNameCharRegex.test(this.char)) {
                this.transition('namedSegment');
              } else {
                this.transition('staticSegment');
              }
              break;
            case 'namedSegment':
              if (segmentNameCharRegex.test(this.char)) {
                this.transition('namedSegment');
              } else {
                this.transition('staticSegment');
              }
              break;
            case 'staticSegment':
              this.transition('staticSegment');
              break;
            case 'unknown':
              this.transition('staticSegment');
          }
      }
    }
    if (this.openParens > 0) {
      throw new Error("unclosed parentheses at " + this.index);
    }
    this.transition('unknown');
    this.regexString += '$';
    this.regex = new RegExp(this.regexString);
  };
  UrlPattern = function(arg, compiler) {
    if (compiler == null) {
      compiler = new UrlPattern.Compiler;
    }
    if (arg instanceof UrlPattern) {
      this.isRegex = arg.isRegex;
      this.regex = arg.regex;
      this.names = arg.names;
      return;
    }
    this.isRegex = arg instanceof RegExp;
    if (!(('string' === typeof arg) || this.isRegex)) {
      throw new TypeError('argument must be a regex or a string');
    }
    if (this.isRegex) {
      this.regex = arg;
    } else {
      compiler.compile(arg);
      this.regex = compiler.regex;
      this.names = compiler.names;
    }
  };
  UrlPattern.prototype.match = function(url) {
    var bound, captured, index, length, match, name, value;
    match = this.regex.exec(url);
    if (match == null) {
      return null;
    }
    captured = match.slice(1);
    if (this.isRegex) {
      return captured;
    }
    bound = {};
    index = -1;
    length = captured.length;
    while (++index < length) {
      value = captured[index];
      name = this.names[index];
      if (value == null) {
        continue;
      }
      if (bound[name] != null) {
        if (!Array.isArray(bound[name])) {
          bound[name] = [bound[name]];
        }
        bound[name].push(value);
      } else {
        bound[name] = value;
      }
    }
    return bound;
  };
  UrlPattern.Compiler = Compiler;
  UrlPattern.escapeForRegex = escapeForRegex;
  return UrlPattern;
});

},{}],27:[function(require,module,exports){
module.exports = extend

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],28:[function(require,module,exports){

'use strict';

var xtend = require('xtend/mutable');
var BaseComponent = require('./modules/BaseComponent');


module.exports = riotComponent;


function riotComponent(riot) {

  return function component(document) {

    function RiotComponent(componentName, viewKey, state) {

      BaseComponent.apply(this, arguments);

      this.tagName = state.views
        ? state.views[viewKey].component
        : state.component;
    }


    xtend(RiotComponent.prototype, BaseComponent.prototype, {

      constructor: RiotComponent,


      tagInstance: null,


      render: function (resolved, params) {

        var opts = this.getOpts(resolved, params);

        this.node = document.createElement(this.tagName);
        this.tagInstance = riot.mount(this.node, this.tagName, opts)[0];

        this
          .childViews
          .forEach(function (view) {

            view.attachWithin(this.node);
          }, this);

        return this;
      },


      update: function (resolved, params) {

        this.tagInstance.opts = this.getOpts(resolved, params);
        this.tagInstance.update();

        return this;
      },


      destroy: function () {

        this.tagInstance.unmount();
        this.tagInstance = this.node = null;

        this
          .childViews
          .forEach(function (view) {

            view.detach();
          });

        return this;
      },


      getOpts: function (resolved, params) {

        var opts = {
          params: params
        };

        return this
          .state
          .getResolves()
          .reduce(function (opts, resolve) {

            opts[resolve.key] = resolved[resolve.id];

            return opts;
          }, opts);
      }

    });

    return RiotComponent;
  };

}

},{"./modules/BaseComponent":10,"xtend/mutable":27}],29:[function(require,module,exports){

},{}],30:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[9]);