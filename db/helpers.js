var fs          = require('fs');
var pg          = require('pg');
var dirac       = require('dirac');
var mosql       = require('mongo-sql');
var mosqlUtils  = require('mongo-sql/lib/utils');
var utils       = require('../utils');

dirac.setMoSql( mosql );

dirac.autoJoin = function( options ){
  [
    'target', 'on'
  ].forEach( function( k ){
    if ( !options[ k ] ){
      throw new Error('Missing required property: `' + k + '`');
    }
  });

  options = utils.defaults( options || {}, {
    operations: [ 'find', 'findOne' ]
  , tables:     []
  , columns:    []
  });

  return function( dirac ){
    var ensureJoin = function( $query, schema, next ){
      if ( !$query.columns ) $query.columns = ['*'];
      if ( !$query.joins ) $query.joins = [];

      $query.columns = $query.columns.concat( options.columns.map( function( c ){
        return [ options.target, c ].join('.');
      }));

      $query.joins.push({
        target: options.target
      , on:     utils.clone( options.on )
      });

      next();
    };

    options.tables.forEach( function( table ){
      options.operations.forEach( function( op ){
        dirac.dals[ table ].before( op, ensureJoin );
      });
    });
  }
}

// Fix PG date parsing (`date` type not to be confused with something with a timezone)
pg.types.setTypeParser( 1082, 'text', function( val ){
  return new Date( val + ' 00:00:00' );
});

// Temporaray fix for http://github.com/goodybag/mongo-sql/issues/80
mosql.registerConditionalHelper('$nin', { cascade: false }, function(column, set, values, collection){
  if (Array.isArray(set)) {
    return column + ' not in (' + set.map( function(val){
      return '$' + values.push( val );
    }).join(', ') + ')';
  }

  return column + ' not in (' + mosql.sql(set, values).toString() + ')';
});

mosql.registerConditionalHelper('$exists', { cascade: false }, function( column, sub, values, collection ){
  return 'exists (' + mosql.sql( sub, values ).toString() + ')';
});

mosql.registerConditionalHelper('$notExists', { cascade: false }, function( column, sub, values, collection ){
  return 'not exists (' + mosql.sql( sub, values ).toString() + ')';
});

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

mosql.registerConditionalHelper(
  '$is_future'
, { cascade: true }
, function( column, value, values, table, query ){
    // So, MoSQL insists on parameterizing my values for me
    // In the process, the value becomes a boolean string :/
    if ( value !== 'true' && value !== 'false'){
      // Bug was not as expected, let's just fail right away
      throw new Error('Unexpected input for $is_future helper: ' + value );
    }
    value = value === 'true';

    return [
      mosql.quoteObject( column, table )
    , value ? '>' : '<'
    , 'now()'
    ].join(' ');
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

// Make sure dates are formatted correctly
dirac.use( function(){
  var afterPSFinds = function( results, $query, schema, next ){
    results.forEach( function( r ){
      r.payment_date = moment( r.payment_date ).format('YYYY-MM-DD');
    });

    next();
  };

  dirac.dals.payment_summaries.after( 'find',     afterPSFinds );
  dirac.dals.payment_summaries.after( 'findOne',  afterPSFinds );
});

// Only use columns specified in schema as insert/update targets
dirac.use( function(){
  var options = {
    operations: [ 'insert', 'update' ]
  };

  var ensureTargets = function( $query, schema, next ){
    var columns = Object.keys( schema ), vals, target;

    if ( $query.type === 'insert' ){
      vals = $query.values;
      target = $query.values = {};
    } else if ( $query.type === 'update' ){
      vals = $query.updates;
      target = $query.updates = {};
    }

    for ( var key in vals ){
      if ( columns.indexOf( key ) === -1 ) continue;
      target[ key ] = vals[ key ];
    }

    next();
  };

  Object.keys( dirac.dals ).forEach( function( table ){
    options.operations.forEach( function( op ){
      dirac.dals[ table ].before( op, ensureTargets );
    });
  });
});

// Always join in region
dirac.use(
  dirac.autoJoin({
    tables:   ['restaurants']
  , columns:  ['sales_tax', 'timezone']
  , target:   'regions'
  , on:       { id: '$restaurants.region_id$' }
  })
);

// Ensure restaurant_id is on payment_summary_id records
dirac.use(
  dirac.autoJoin({
    tables:     [ 'payment_summary_items' ]
  , columns:    [ 'restaurant_id' ]
  , target:     'payment_summaries'
  , on:         { id: '$payment_summary_items.payment_summary_id$' }
  })
);

// Ensure total_payout is calculated when pulling out payment_summaries
dirac.use( function(){
  var options = {
    operations: [ 'find', 'findOne' ]
  , tables:     [ 'payment_summaries' ]
  , column:     'total_payout'
  };

  var ensureTotal = function( $query, schema, next ){
    if ( !$query.columns ) $query.columns = ['*'];

    $query.columns.push({
      type:     'select'
    , table:    'payment_summary_items'
    , columns:  [[
      , 'sum(round('
      , '+ ( sub_total + delivery_fee + tip )'
        // We aggressively round to match our notion of cents better
      , '- ( round( ( sub_total + delivery_fee ) + round( ( sub_total + delivery_fee ) * sales_tax ) + tip ) * gb_fee )'
      , '))::int + payment_summaries.adjustment as ' + options.column
      ].join('  \n')]
    , where:    { payment_summary_id: '$payment_summaries.id$' }
    });

    next();
  };

  options.tables.forEach( function( table ){
    options.operations.forEach( function( op ){
      dirac.dals[ table ].before( op, ensureTotal );
    });
  });
});

// Log queries to dirac
// dirac.use( function(){
//   var query = dirac.DAL.prototype.query;
//   dirac.DAL.prototype.query = function( query, callback ){
//     console.log( query );
//     return query.apply( this, arguments );
//   };

//   var raw = dirac.DAL.prototype.raw;
//   dirac.DAL.prototype.raw = function( query, values, callback ){
//     console.log( query, values );
//     return raw.apply( this, arguments );
//   };
// });