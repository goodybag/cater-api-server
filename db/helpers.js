var mosql = require('mongo-sql');

mosql.registerConditionalHelper( '$contains', {cascade: false}, function( column, set, values, collection ){
  if (Array.isArray(set)) {
    return column + ' @> ARRAY[' + set.map( function(val) {
      return '$' + values.push(val);
    }).join(', ') + ']';
  }
});