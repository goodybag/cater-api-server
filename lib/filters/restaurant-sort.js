var utils = require('../../utils');
var RestaurantSort = function(callback) {
  callback(null, function(query) {

    query = query || '';
    var sortApplied = query.indexOf('sort:') >= 0;
    var resource = 'sort';
    var options = [
      { name: 'Name', value: 'name', active: sortApplied ? false : true }
    , { name: 'ID', value: 'id', active: false }
    ];

    var tokens = query.split(' ');
    var existing = utils.find(tokens, function(token){
      return token.indexOf('sort:') >= 0;
    });

    options.forEach(function(option) {
      var key = resource + ':' + option.name.toLowerCase();
      if ( query.indexOf(key) >= 0 ) {
        option.active = true;
        option.qs = query.replace(key, '');
      } else if (existing && existing !== key){
        option.qs = utils.without(tokens, existing).concat(key).join(' ');
      } else {
        option.qs = key + ' ' + query;
      }
      option.qs = option.qs.trim();
    });

    return {
      type: 'radio'
    , resource: resource
    , data: options
    };
  });
};

module.exports = RestaurantSort;
