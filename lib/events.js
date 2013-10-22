var venter  = require('./venter');
var receipt = require('./receipt');

/**
 * Rebuild the Order Receipt when an order changes
 */
venter.on( 'order:change', function( orderId ){
  receipt.build( orderId );
});