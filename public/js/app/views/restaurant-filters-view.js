define(function(require, exports, module) {
  var Backbone = require('backbone');
  var $ = require('jquery');
  var utils = require('utils');

  return module.exports = Backbone.View.extend({
    events: {
      'change .checkbox': 'onFilterChange'
    }

  , criteriaTypes: {
      prices: 'or'
    , meal_styles: 'and'
    , meal_types: 'and'
    , diets: 'and'
    , cuisine: 'or'
    }

  , initialize: function() {
      var collapsibles = this.$el.find('.collapse');
      collapsibles.on('show.bs.collapse', this.toggleCollapsible);
      collapsibles.on('hide.bs.collapse', this.toggleCollapsible);

      this.$checkboxes = this.$el.find('.checkbox');

      this.updateCounts();
    }

  , onFilterChange: function(e) {
      this.trigger('filters:change');
    }

  , getProps: function() {
      return {
        diets:        _.pluck(this.$el.find('#panelDiet input:checked'), 'value')
      , cuisines:     _.pluck(this.$el.find('#panelCuisine input:checked'), 'value')
      , prices:       _.pluck(this.$el.find('#panelPrice input:checked'), 'value')
      , mealTypes:    _.pluck(this.$el.find('#panelMealTypes input:checked'), 'value')
      , mealStyles:   _.pluck(this.$el.find('#panelMealStyles input:checked'), 'value')
      };
    }

  , toggleCollapsible: function(e) {
      // toggle collapse panel icon
      var $panelIcon = $(e.currentTarget).siblings('.panel-heading').find('.glyphicon');
      $panelIcon.toggleClass('glyphicon-chevron-down glyphicon-chevron-right');
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
});
