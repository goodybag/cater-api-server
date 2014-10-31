define(function(require){
  var utils = require('utils');

  return utils.View.extend({
    status: 'none'
  , statuses: ['none', 'waiting', 'working', 'error', 'complete']

  , setStatus: function( status ){
      var $status = this.$el.find('.og-status');

      $status.attr( 'data-status', status );

      if ( status === 'working' ){
        this.disableActions();
      } else {
        this.enableActions();
      }

      status = status;

      return this;
    }

  , setSummary: function( summary ){
      this.summary = summary;

      this.$el.find('[data-role="edit"]')
        .removeClass('hide')
        .attr( 'href', [
          '/admin/restaurants'
        , this.summary.get('restaurant_id')
        , 'payment-summaries'
        , summary.get('id')
        ].join('/'));

      this.$el.find('[data-role="view"]')
        .removeClass('hide')
        .attr( 'href', '/payment-summaries/ps-:id.pdf'.replace( ':id', summary.get('id') ) );

      return this;
    }

  , enableActions: function(){
      this.$el.find('.actions .btn').attr( 'disabled', null ).removeClass('disabled');
      return this;
    }

  , disableActions: function(){
      this.$el.find('.actions .btn').attr( 'disabled', true ).addClass('disabled');
      return this;
    }
  });
});