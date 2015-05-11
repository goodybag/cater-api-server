define(function(require, exports, module) {
  var Backbone = require('backbone');
  var $ = require('jquery');
  var utils = require('utils');

  module.exports = Backbone.View.extend({
    events: function() {
      return {
        'change input':                   'propagate'
      , 'change .immediate':              'onFilterChange'
      , 'click .popover-modal button':    'onFilterChange'
      };
    }

  , criteriaTypes: {
      prices: 'or'
    , meal_types: 'and'
    , diets: 'and'
    , cuisine: 'or'
    }

  , initialize: function() {
      this.options.changeEvent = this.options.changeEvent || 'filters:change';
      this.options.facets = this.options.facets || {};
      this.$checkboxes = this.$el.find('.checkbox');

      // Sorry for this hackiness, but IE8 just will not stop having errors with this
      if ( window.navigator.userAgent.indexOf('MSIE 8.0') === -1 ){
        this.updateCounts();
      }
    }

  , addFacet: function(name, selector) {
      this.options.facets[name] = selector;
    }

  , onFilterChange: function(e) {
      this.trigger(this.options.changeEvent);
    }

  , propagate: function(e) {
      // propagate input changes to mirror inputs
      // some serious jquery hackery
      var $target = $(e.target);
      var checked = $target.is(':checked');
      this.$el.find('input[value="' + $target.val() + '"]').prop('checked', checked);
    }

  , getProps: function() {
      return Object.keys(this.options.facets).reduce(function(props, facet) {
        props[facet] = _.unique(_.pluck(this.$el.find(this.options.facets[facet]), 'value'));
        return props;
      }.bind(this), {});
    }

  , updateCounts: function(){
      var this_ = this;

      this.$checkboxes.each( function(){
        var $this     = $(this);

        if ( $this.find(':checked').length ) return;

        var criteria  = utils.clone( this_.options.existingCriteria );
        var $label    = $this.find('label');
        var facet     = $this.parents('.panel').eq(0).data('facet');

        for ( var key in criteria ) criteria[ key ] = criteria[ key ].slice( 0 );

        if ( !criteria[ facet ] ) criteria[ facet ] = [];
        var i = criteria[ facet ].push( $this.find('input').attr('value') ) - 1;

        if ( facet === 'prices' ) criteria[ facet ][ i ] = +criteria[ facet ][ i ];

        $label.html([
          $label.html()
        , ' ('
        , utils.searchByFacets( this_.options.restaurants, criteria, this_.criteriaTypes ).length
        , ')'
        ].join(''));
      });
    }
  });

  return module.exports;
});
