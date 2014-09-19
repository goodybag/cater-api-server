var fs          = require('fs');
var path        = require('path');
var pg          = require('pg');
var dirac       = require('dirac');
var mosql       = require('mongo-sql');
var mosqlUtils  = require('mongo-sql/lib/utils');
var utils       = require('../utils');
var logger      = require('../lib/logger');
var config      = require('../config');

dirac.setMoSql( mosql );

// Logging for dals
// Leaving commented for now because it just makes logs too noisy
// We'll probably figure out a better way to do this
// if ( config.isDev ){
//   dirac.use( function( dirac ){
//     var dbLogger = logger.create('DB');

//     Object.keys( dirac.dals ).forEach( function( table ){
//       var dalLogger = dbLogger.create( table );

//       [
//         'find', 'findOne', 'remove', 'insert', 'update'
//       ].forEach( function( op ){
//         dirac.dals[ table ].before( op, function( $query, schema, next ){
//           var _query = utils.deepClone( $query );

//           // use a different character for query helpers
//           // because mongo does not like `$`
//           utils.editAllKeys( _query, function( key ){
//             if ( key[ 0 ] === '$' ){
//               return '@' + key.slice(1);
//             } else {
//               return key;
//             }
//           });

//           dalLogger.info( op, { query: _query });

//           next();
//         });
//       });
//     });
//   });
// }

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
};

mosql.registerQueryType( 'one', [
  'select row_to_json( {table} )'
, '  from {table}'
, '  {where}'
, '  limit 1'
].join(''));

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
  if (Array.isArray(set)){
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

mosql.registerConditionalHelper( '$matches', function( column, set, values, collection ) {
  return column + ' @@ plainto_tsquery(' + set + ')';
});

mosql.registerConditionalHelper( '$partialMatches', function( column, set, values, collection ) {
  // join all tokens with logical AND and append with partial match (:*)
  var idx = parseInt(set.slice(1)) - 1;
  values[idx] = values[idx]
                  .trim()
                  .split(' ')
                  .map(function(str) { return str.replace(/\W+/g, ''); } )
                  .join(':*&') + ':*';
  return column + ' @@ to_tsquery(' + set + ')';
});

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

dirac.use( function(){
  var includeUserGroups = function($query, schema, next ){
    $query.columns = $query.columns || [ '*' ];
    $query.columns.push({
        type: 'array'
      , expression: {
          type: 'select'
        , table: 'users_groups'
        , columns: ['group']
        , where: { user_id: '$users.id$' }
        }
      , alias: 'groups'
    });
    next();
  }
  dirac.dals.users.before( 'find', includeUserGroups );
  dirac.dals.users.before( 'findOne', includeUserGroups );
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

// Remove existing zip defs, replace with new ones
// TODO: use transaction
dirac.use( function( dirac ){
  dirac.dals.delivery_services.before( 'update', function( $query, schema, next ){
    if ( !$query.updates.zips ) return next();
    if ( !$query.where && !$query.where.id ) return next();
    if ( !Array.isArray( $query.updates.zips ) || $query.updates.zips.length === 0 ) return next();

    if ( !$query.with ) $query.with = [];

    $query.with.push({
      type:   'insert'
    , name:   'insert_zips'
    , table:  'delivery_service_zips'
    , values: $query.updates.zips.map( function( zip ){
                return utils.extend( { delivery_service_id: $query.where.id }, zip );
              })
    });

    dirac.dals.delivery_service_zips.remove( { delivery_service_id: $query.where.id }, next );
  });

  dirac.dals.delivery_services.before( 'insert', function( $query, schema, next ){
    if ( !$query.values.zips ) return next();

    // Save zips for later
    if ( $query.values.zips.length > 0 ){
      $query.__zips = $query.values.zips;
    }

    next();
  });

  dirac.dals.delivery_services.after( 'insert', function( results, $query, schema, next ){
    if ( !$query.__zips ) return next();

    var onResult = function( result, done ){
      var zips = $query.__zips.map( function( zip ){
        return utils.extend( { delivery_zip_id: result.id }, zip );
      });

      dirac.dals.delivery_service_zips.insert( zips, done );
    };

    utils.async.each( results, onResult, next );
  });
});

// Only use columns specified in schema as insert/update targets
dirac.use( function(){
  var options = {
    operations: [ 'insert', 'update' ]
  };

  var ensureTargets = function( $query, schema, next ){
    var columns = Object.keys( schema ), vals, target;

    if ( $query.type === 'insert' ){
      vals = Array.isArray( $query.values ) ? $query.values : [ $query.values ];
    } else if ( $query.type === 'update' ){
      vals = [ $query.updates ];
    }

    vals.forEach( function( val ){
      for ( var key in val ){
        if ( columns.indexOf( key ) === -1 ){
          delete val[ key ];
        }
      }
    });

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

// Embed queries into each other
dirac.use( function( dirac ){
  var options = {
    operations: ['find', 'findOne']
  , pluginName: 'many'
  , tmpl: function( data ){
      var where = utils.extend( {}, data.where );

      data.pivots.forEach( function( p ){
        where[ p.target_col ] = '$' + mosqlUtils.quoteObject( p.source_col, data.source ) + '$';
      });

      return {
        type: 'expression'
      , alias: data.alias
      , expression: {
          parenthesis: true
        , expression: {
            type: 'array_to_json'
          , expression: {
              type: 'array'
            , expression: {
                type: 'select'
              , alias: 'r'
              , table: data.target
              , columns: [{ type: 'row_to_json', expression: 'r' }]
              , where: where
              }
            }
          }
        }
      };
    }
  };

  Object.keys( dirac.dals ).forEach( function( table_name ){
    var dal = dirac.dals[ table_name ];

    options.operations.forEach( function( op ){
      dal.before( op, function( $query, schema, next ){
        if ( !Array.isArray( $query[ options.pluginName ] ) ) return next();

        $query[ options.pluginName ].forEach( function( target ){
          var targetDal = dirac.dals[ target.table ];

          // Immediate dependency not met and not specifying how to get there
          if ( !targetDal.dependencies[ table_name ] )
          if ( !target.where ){
            throw new Error( 'Table: `' + target.table + '` does not depend on `' + table_name + '`' );
          }

          var pivots = [];

          if ( targetDal.dependencies[ table_name ] ){
             pivots = Object.keys( targetDal.dependencies[ table_name ] ).map( function( p ){
              return {
                source_col: targetDal.dependencies[ table_name ][ p ]
              , target_col: p
              };
            });
          }

          var col = options.tmpl({
            source:     table_name
          , target:     target.table
          , where:      target.where
          , alias:      target.alias || target.table
          , pivots:     pivots
          });

          if ( !$query.columns ){
            $query.columns = ['*'];
          }

          $query.columns.push( col );
        });

        next();
      });
    });
  });
});

// Same as one-to-many, but with a single JSON object
// and searches target dependents instead of dependencies
dirac.use( function( dirac ){
  var options = {
    operations: ['find', 'findOne']
  , pluginName: 'one'
  , tmpl: function( data ){
      var where = utils.extend( {}, data.where );

      data.pivots.forEach( function( p ){
        where[ p.target_col ] = '$' + mosqlUtils.quoteObject( p.source_col, data.source ) + '$';
      });

      return {
        type: 'expression'
      , alias: data.alias
      , expression: {
          parenthesis: true
        , expression: {
            type: 'select'
          , alias: 'r'
          , table: data.target
          , columns: [{ type: 'row_to_json', expression: 'r' }]
          , where: where
          , limit: 1
          }
        }
      };
    }
  };

  Object.keys( dirac.dals ).forEach( function( table_name ){
    var dal = dirac.dals[ table_name ];

    options.operations.forEach( function( op ){
      dal.before( op, function( $query, schema, next ){
        if ( !Array.isArray( $query[ options.pluginName ] ) ) return next();

        $query[ options.pluginName ].forEach( function( target ){
          var targetDal = dirac.dals[ target.table ];

          // Immediate dependency not met and not specifying how to get there
          if ( !targetDal.dependents[ table_name ] )
          if ( !target.where ){
            throw new Error( 'Table: `' + target.table + '` does not depend on `' + table_name + '`' );
          }

          var pivots = [];

          if ( targetDal.dependents[ table_name ] ){
             pivots = Object.keys( targetDal.dependents[ table_name ] ).map( function( p ){
              return {
                source_col: targetDal.dependents[ table_name ][ p ]
              , target_col: p
              };
            });
          }

          var col = options.tmpl({
            source:     table_name
          , target:     target.table
          , where:      target.where
          , alias:      target.alias || target.table
          , pivots:     pivots
          });

          if ( !$query.columns ){
            $query.columns = ['*'];
          }

          $query.columns.push( col );
        });

        next();
      });
    });
  });
});

dirac.DAL = dirac.DAL.extend({
  initialize: function(){
    // Setup cached dependency graph for use by relationship helpers
    this.dependents   = {};
    this.dependencies = {};
    return this._super.apply( this, arguments );
  }

, insert: function( values, options, callback ){
    if ( Array.isArray( values ) && values.length === 0 ){
      if ( typeof options === 'function' ){
        callback = options;
      }
      return callback();
    }
    return this._super( values, options, callback );
  }
});

dirac.use( function( dirac ){
  // Filter down to dals whose schema contains a `references` key
  Object.keys( dirac.dals ).filter( function( table_name ){
    var dal = dirac.dals[ table_name ];

    return Object.keys( dal.schema ).some( function( col_name ){
      return dal.schema[ col_name ].references;
    });
  }).forEach( function( table_name ){
    var dal = dirac.dals[ table_name ];

    Object.keys( dal.schema ).filter( function( col_name ){
      return dal.schema[ col_name ].references;
    }).forEach( function( col_name ){
      var col = dal.schema[ col_name ];
      var target = dirac.dals[ col.references.table ];

      if ( !target.dependents[ table_name ] ){
        target.dependents[ table_name ] = {};
      }

      if ( !dal.dependencies[ col.references.table ] ){
        dal.dependencies[ col.references.table ] = {};
      }

      target.dependents[ table_name ][ col.references.column ] = col_name;
      dal.dependencies[ col.references.table ][ col_name ] = col.references.column;
    });
  });
});

// Order status sorting
dirac.use( function( dirac ){
  dirac.dals.orders.before( 'find', function( $query, schema, next ){
    if ( !$query.statusDateSort ) return next();

    $query.with     = $query.with     || [];
    $query.joins    = $query.joins    || [];
    $query.columns  = $query.columns  || ['*'];

    $query.columns.push({
      table:  'statuses'
    , name:   'created_at'
    , alias:  'status_date'
    });

    $query.with.push({
      name:     'statuses'
    , type:     'select'
    , table:    'order_statuses'
    , columns:  [ 'order_id', 'status', 'created_at']
    , distinct: [ 'order_id' ]
    , order:    [ 'order_id desc', 'created_at desc' ]
    , where:    { status: $query.statusDateSort.status }
    });

    $query.joins.push({
      type:   'left'
    , target: 'statuses'
    , on:     { order_id: '$orders.id$' }
    });

    $query.order = [ 'status_date ' + ($query.statusDateSort.direction || 'desc') ];

    next();
  });
});

// Order submitted date
dirac.use( function( dirac ){
  dirac.dals.orders.before( 'find', function( $query, schema, next ){
    if ( !$query.submittedDate ) return next();

    $query.with     = $query.with     || [];
    $query.joins    = $query.joins    || [];
    $query.columns  = $query.columns  || ['*'];

    $query.with.push({
      name:     'submitted_dates'
    , type:     'select'
    , table:    'order_statuses'
    , columns:  [ 'order_id', { type: 'max', expression: 'created_at', alias: 'submitted' } ]
    , groupBy:  'order_id'
    , where:    { status: 'submitted' }
    });

    $query.joins.push({
      type:     'left'
    , target:   'submitted_dates'
    , on:       { order_id: '$orders.id$' }
    })

    $query.columns.push('submitted_dates.submitted');

    next();
  });
});

dirac.use( function( dirac ){
  var onOrder = function( order ){
    Object.defineProperty( order, 'points', {
      get: function(){
        // Handle reward promos
        var submitted = moment( order.submitted );

        var holiday = utils.find(config.rewardHolidays, function(holiday) {
          return submitted >= moment( holiday.start ) && submitted < moment( holiday.end );
        });

        if ( holiday ) {
          return Math.floor( order.total * holiday.rate / 100 );
        }

        // Check all mondays past 4/21
        var eligible = submitted.day() == 1 && submitted >= moment( config.rewardsPromo.start );

        if ( eligible ) {
          return Math.floor( order.total * config.rewardsPromo.rate / 100 );
        }

        return Math.floor( order.total / 100 );
      }
    });
  };

  var afterOrderFind = function( results, $query, schema, next ){
    results.forEach( onOrder );
    next();
  };

  dirac.dals.orders.after( 'find', afterOrderFind );
  dirac.dals.orders.after( 'findOne', afterOrderFind );
});

// Log queries to dirac
// dirac.use( function( dirac ){
//   var query_ = dirac.DAL.prototype.query;
//   dirac.DAL.prototype.query = function( query, callback ){
//     console.log( JSON.stringify(query, true, '  ') );
//     return query_.apply( this, arguments );
//   };

//   var raw = dirac.DAL.prototype.raw;
//   dirac.DAL.prototype.raw = function( query, values, callback ){
//     console.log( query );
//     return raw.apply( this, arguments );
//   };
// });