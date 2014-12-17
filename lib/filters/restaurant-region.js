var utils = require('../../utils');
var db = require('../../db');
var cache = [];

var RegionFilter = function(callback) {
  function format(query) {
    query = query || '';
    var resource = 'region';
    var regions = cache.map(function(region) {
      var key = resource + ':' + region.name.toLowerCase();
      var exists = query.indexOf(key) >= 0;
      return {
          id: region.id
        , resource: resource
        , name: region.name
        , active: exists
        , qs: (exists ? query.replace(key, '') : key + ' ' + query).trim()
      };
    });

    var filter = {
      type: 'checklist'
    , resource: resource
    , data: regions
    };
    return filter;
  }

  // lazy load at server start
  if (!cache.length) {
    db.regions.find({}, function(err, results) {
      cache = results.map(function(result) {
        result.active = false;
        return result;
      });
      callback(err, format);
    });
  } else {
    callback(null, format);
  }
};
module.exports = RegionFilter;
