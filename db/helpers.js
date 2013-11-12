var mosql = require('mongo-sql');

mosql.registerConditionalHelper( '$contains', {cascade: false}, function( column, set, values, collection ) {
  if (Array.isArray(set)) {
    return column + ' @> ARRAY[' + set.map( function(val) {
      return '$' + values.push(val);
    }).join(', ') + ']';
  }
});

mosql.registerConditionalHelper( '$overlap', {cascade: false}, function( column, set, values, collection ) {
  if (Array.isArray(set)) {
    return column + ' && ARRAY[' + set.map( function(val) {
      return '$' + values.push(val);
    }).join(', ') + ']';
  }
});

mosql.registerConditionalHelper('$notExists', {cascade: false}, function( column, value, values, collection ){
  return 'not exists (' + mosql.sql( value, values ).toString() + ')';
});