var stampit = require('stampit');
var utils = require('utils');

/**
 * Get the first and last submitted dates per organization
 */

module.exports = stampit().enclose(function() {
  this.transforms.push(function organizationSubmitted() {
    if ( this.organizationSubmitted ) {
      this.$query['os.status'] = 'submitted';

      this.$options = utils.defaults(this.$options, {
        columns:  []
      , joins:    []
      , groupBy:  []
      , order:    []
      });

      this.$options.columns.push( 'u.organization' );
      this.$options.columns.push( { type: 'min', expression: 'os.created_at', alias: 'first_submitted' } );
      this.$options.columns.push( { type: 'max', expression: 'os.created_at', alias: 'last_submitted' } );
      this.$options.columns.push( { expression: 'extract(month from now()) + (12 * extract(year from now())) - extract(month from max(os.created_at)) - (12 * extract(year from max(os.created_at)))', alias: 'months_since_last_submitted' } );

      this.$options.joins.push( { type: 'left', target: 'order_statuses', on: { order_id: '$orders.id$' }, alias: 'os' } );
      this.$options.joins.push( { type: 'left', target: 'users', on: { id: '$orders.user_id$' }, alias: 'u' } );

      this.$options.groupBy.push( ['u.organization'] );

      this.$options.order.push( ['first_submitted desc'] );
    }
  });
});
