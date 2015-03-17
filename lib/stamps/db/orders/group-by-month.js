var stampit = require('stampit');

// Passing a truthy groupByMonth option automatically formats
// total order volume and guests over monthly intervals
module.exports = stampit().enclose(function() {
  this.transforms.push(function groupByMonth() {
    var enable = this.groupByMonth;
    if ( enable) {
      this.$query.$notNull = this.$query.$notNull || {};
      this.$query.$notNull['submitted_dates.submitted'] = true;

      this.$options.columns = this.$options.columns || [];
      this.$options.columns.push({ type: 'sum', expression: 'total', alias: 'volume' });
      this.$options.columns.push({ type: 'sum', expression: 'guests', alias: 'guests' });
      this.$options.columns.push({ expression: 'extract(year from submitted) as year' });
      this.$options.columns.push({ expression: 'to_char(submitted, \'MM\') as month' });

      this.$options.groupBy = this.$options.groupBy || [];
      this.$options.groupBy.push({ expression: 'year' });
      this.$options.groupBy.push({ expression: 'month' });

      this.$options.order = this.$options.order || [];
      this.$options.order.push({ expression: 'year desc' });
      this.$options.order.push({ expression: 'month desc' });
    }
  });
});
