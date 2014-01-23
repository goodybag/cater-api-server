var mosql = require('mongo-sql');
var mosqlUtils = require('mongo-sql/lib/utils');
var utils = require('../utils');

mosql.registerConditionalHelper( '$contains', {cascade: false}, function( column, set, values, collection ) {
  if (Array.isArray(set)) {
    return column + ' @> ARRAY[' + set.map( function(val) {
      return '$' + values.push(val);
    }).join(', ') + ']';
  }
});

mosql.registerConditionalHelper( '$dateContains', function( column, set, values, collection ) {
  return column + ' @> ' + set + '::date';
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

mosql.registerConditionalHelper(
  '$between_days_from_now'
, { cascade: false }
, function( column, value, values, table, query ){
    var tz = value.timezone ? ' at time zone ' + mosqlUtils.quoteColumn( value.timezone ) : '';

    return [
      [
        column
      , tz
      , " >= date_trunc(\'day\', (now() ", tz, ") + interval '"
      , value.from
      , " days')"
      ].join('')
    , [
        column
      , tz
      , "  < date_trunc(\'day\', (now() ", tz, ") + interval '"
      , value.to
      , " days')"
      ].join('')
    ].join(' and ');
  }
);

mosql.registerConditionalHelper(
  '$older_than'
, { cascade: false }
, function( column, value, values, table, query ){
    var tz = value.timezone ? ' at time zone ' + mosqlUtils.quoteColumn( value.timezone ) : '';

    return [
      column
    , tz
    , " < now() ", tz, " - interval '"
    , value.value
    , ' '
    , value.unit || 'days'
    , "'"
    ].join('')
  }
);

// Upsert query type
// Warning: This is subject to some sort of race condition
// but it will work like 99% of the time
//
// Example
// {
//   type: 'upsert'
// , table: 'reminders'
// , upsert: {
//     name: 'Bob'
//   , data: '{}'
//   }
// , where: {
//     name: 'Bob'
//   }
// }
mosql.registerQueryType(
  'upsert'
, [
    '{upsert} with "update_tbl" as ('
  , '  update {table} {updates}'
  , '  {where} returning *'
  , ')'
  , 'insert into {table} {columns}'
  , 'select {expression}'
  , 'where not exists ( select * from "update_tbl" )'
  ].join('\n')
);

mosql.registerQueryHelper( 'upsert', function( upsert, values, query ){
  query.type = 'insert';
  process.nextTick( function(){ query.type = 'upsert'; });

  query.updates = upsert;
  query.columns = Object.keys( upsert );
  query.expression = utils.values( upsert ).map( function( v ){
    if ( typeof v !== 'string' ) return v;
    return "'" + v + "'";
  });

  return '';
});