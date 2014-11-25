define(function(require){
  var utils = require('utils');
  var Hbs   = require('handlebars');

  return function( options ){
    options = utils.defaults( options || {}, {
      selector:   '.tx-fee-popover'
    , methodName: 'initTxFeePopover'
    , template:   Hbs.partials.menu_order_summary_tx_fee_popover
    , delay:      1000
    });

    var mixins = {};

    mixins[ options.methodName ] = function(){
      var $el = this.$el.find( options.selector );
      var isShowing = false;
      var hideTimeout;

      $el.popover('destroy');

      $el.popover({
        placement: 'top'
      , container: $el
      , trigger: 'manual'
      , content: options.template.apply( Hbs, arguments )
      , html: true
      });

      // Using hover + delay produces some funky blinking
      // Some implement my own solution for delayed hiding and hover show
      $el.mouseenter( function(){
        if ( hideTimeout ) clearTimeout( hideTimeout );
        if ( !isShowing ){
          isShowing = true;
          $el.popover('show');
        }
      });

      $el.mouseleave( function(){
        hideTimeout = setTimeout( function(){
          isShowing = false;
          $el.popover('hide');
        }, options.delay );
      });
    };;

    return mixins;
  };
});