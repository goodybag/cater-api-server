var RestaurantFiltersView = Backbone.View.extend({
  events: {
    'change .checkbox': 'onFilterChange'
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
    this.$checkboxes.each( function(){
      var $this     = $(this);

      if ( $this.find(':checked').length ) return;

      var criteria  = _.clone( existingCriteria );
      var $label    = $this.find('label');
      var facet     = $this.parents('.panel').eq(0).data('facet');

      for ( var key in criteria ) criteria[ key ] = criteria[ key ].slice( 0 );

console.log(JSON.stringify(criteria))
      if ( !criteria[ facet ] ) criteria[ facet ] = [];
      var i = criteria[ facet ].push( $this.find('input').attr('value') ) - 1;

      if ( facet === 'prices' ) criteria[ facet ][i] = +criteria[ facet ][i];

console.log(facet, criteria)
      $label.html( $label.html() + ' (' + searchByFacets( restaurants, criteria ).length + ')' );
    });
  }
});
