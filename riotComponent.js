
'use strict';

var xtend = require('xtend/mutable');
var BaseComponent = require('./modules/BaseComponent');


module.exports = riotComponent;


function riotComponent(riot) {

  return function component(document, events, machine, router) {

    riot.tag(
      'sm-link',
      '<a href="{ href }" class="{ active: active }"><yield/></a>',
      function (opts) {

        var stateName = opts.to;
        var params = opts.params || {};
        var query = opts.query || {};
        var hash = opts.hash || '';

        this.href = router.href(stateName, params, query, hash);
        this.active = machine.hasState(stateName, params, query);

        this.matchState = function () {

          this.active = machine.hasState(stateName, params, query);
          this.update();

        }.bind(this);

        events.subscribe('stateChangeSuccess', this.matchState);

        this.on('unmount', function () {

          events.unsubscribe('stateChangeSuccess', this.matchState);
        });
      }
    );

    function RiotComponent(componentName, viewKey, state) {

      BaseComponent.apply(this, arguments);

      this.tagName = state.views
        ? state.views[viewKey].component
        : state.component;
    }


    xtend(RiotComponent.prototype, BaseComponent.prototype, {

      constructor: RiotComponent,


      tagInstance: null,


      render: function (resolved, params, query) {

        var opts = this.getOpts(resolved, params, query);

        this.node = document.createElement(this.tagName);
        this.tagInstance = riot.mount(this.node, this.tagName, opts)[0];

        this
          .childViews
          .forEach(function (view) {

            view.attachWithin(this.node);
          }, this);

        return this;
      },


      update: function (resolved, params, query) {

        this.tagInstance.opts = this.getOpts(resolved, params, query);
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


      getOpts: function (resolved, params, query) {

        var opts = {
          params: params,
          query: query
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
