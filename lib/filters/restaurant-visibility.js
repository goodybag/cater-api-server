var VisibilityFilter = function(callback) {
  callback(null, function(query) {
    query = query || '';
    var resource = 'show';
    var options = [
      { name: 'Visible', value: false, active: query ? false : true }
    , { name: 'Hidden', value: true, active: false }
    ];

    options.forEach(function(option) {
      var key = resource + ':' + option.name.toLowerCase();
      if ( query.indexOf(key) >= 0 ) {
        option.active = true;
        option.qs = query.replace(key, '');
      } else {
        option.qs = key + ' ' + query;
      }
      option.qs = option.qs.trim();
    });

    return {
      type: 'multiple'
    , resource: 'show'
    , data: options
    };
  });
};

module.exports = VisibilityFilter;
