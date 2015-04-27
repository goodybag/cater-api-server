var stampit = require('stampit');

/**
 * Get the first and last submitted dates per organization
 */
module.exports = stampit().enclose(function() {
  this.transforms.push(function organizationSubmitted() {
    if ( this.organizationSubmitted ) {
      this.$query['os.status'] = 'submitted';

      this.$options.columns = [
        'u.organization'
      , { type: 'min', expression: 'os.created_at', alias: 'first_submitted' }
      , { type: 'max', expression: 'os.created_at', alias: 'last_submitted' }
      , { expression: 'extract(month from now()) + (12 * extract(year from now())) - extract(month from max(os.created_at)) - (12 * extract(year from max(os.created_at)))', alias: 'months_since_last_submitted' }
      ];

      this.$options.joins = [
        { type: 'left', target: 'order_statuses', on: { order_id: '$orders.id$' }, alias: 'os' }
      , { type: 'left', target: 'users', on: { id: '$orders.user_id$' }, alias: 'u' }
      ];

      this.$options.groupBy = ['u.organization'];
      this.$options.order = ['first_submitted desc'];
    }
  });
});
