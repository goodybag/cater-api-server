var stampit = require('stampit');
var utils = require('utils');

/**
 * Get the first and last submitted dates per organization
 */

module.exports = stampit().enclose(function() {
  this.transforms.push(function organizationSubmitted() {
    if ( this.organizationSubmitted ) {
      this.$query['os.status'] = 'submitted';
      this.$query['status'] = 'accepted';

      this.$options = utils.defaults(this.$options, {
        columns:  []
      , joins:    []
      , groupBy:  []
      , order:    []
      });

      // this.$options.with.last_subbies = {
      //   type: 'select'
      // , table: 'order_statuses'
      // , join:
      // };

      // this.$options.columns.push( { expression: 'max(u.email)' } );
      /*
      todo
      translate to mosql

      select created_at, email, organization, status, submitted_rank from (
        select order_statuses.created_at, users.email, users.organization, order_statuses.status,
        rank() over (partition by users.organization order by order_statuses.created_at desc) submitted_rank
        from order_statuses
        join orders on orders.id = order_statuses.order_id
        join users on users.id = orders.user_id
        where order_statuses.status = 'submitted'
        and orders.status = 'accepted'
      ) as foo where submitted_rank = 1
      order by created_at desc;
      
      select * from (select rank() over (partition by ...) from orders) where rank = 1;

      */

      this.$options.with = this.$options.with || {};
      this.$options.with.last_submitted = {

      };

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
