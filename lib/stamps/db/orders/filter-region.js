var stampit = require('stampit');
var utils = require('utils');

var targets = function(list, target) {
  return !!utils.filter(list, function(obj) {
    return obj.target === target;
  }).length;
};

function region() {
  if ( !this.filters || !this.filters.region) return;

  var regions = this.filters.region;

  regions = utils.filter(regions, function(option) {
    return option.active;
  });

  regions = utils.pluck(regions, 'name');

  if ( regions.length ) {
    var joins = this.$options.joins = this.$options.joins || [];

    if ( !targets(joins, 'restaurants') ) {
      joins.push({
        type: 'left'
      , target: "restaurants"
      , on: { id: '$orders.restaurant_id$' }
      });
    }

    if ( !targets(joins, 'regions') ) {
      joins.push({
        type: 'left'
      , target: "regions"
      , on: { id: '$restaurants.region_id$' }
      });
    }

    this.$query['regions.name'] = this.$query['regions.name'] || {};
    this.$query['regions.name']['$in'] = regions;
  }
}

module.exports = stampit().enclose(function() {
  this.transforms.push(region);
});
