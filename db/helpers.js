var fs          = require('fs');
var path        = require('path');
var pg          = require('pg');
var dirac       = require('dirac');
var mosql       = require('mongo-sql');
var moment      = require('moment-timezone');
var mosqlUtils  = require('mongo-sql/lib/utils');
var utils       = require('../utils');
var logger      = require('../lib/logger').create('DBHelpers');
var config      = require('../config');
var odsChecker  = require('../public/js/lib/order-delivery-service-checker');
var Order       = require('stamps/orders/base');
var QueryStream = require('pg-query-stream');

var RewardsOrder = require('stamps/orders/rewards');
var PublicRestaurant = require('../public/js/app/models/restaurant');
var PublicOrder = require('../public/js/app/models/order');

RewardsOrder = RewardsOrder.compose( require('stamps/orders/base').Cached );

dirac.db.setMosql( mosql );

dirac.use( dirac.relationships() );
dirac.use( require('../lib/dirac-serialize-point')() );

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
//           var _query = utils.cloneDeep( $query );

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

// mosql.registerQueryType( 'insert-one-with-many', [
//   'do $$'
// , '  declare r record;'
// , 'begin'
// , '  {{mainInsert}} into r;'
// , '  {{mainInsert}} into r;'
// , 'end$$;'
// ].join(''));

mosql.registerQueryType( 'one', [
  'select row_to_json( {table} )'
, '  from {table}'
, '  {where}'
, '  limit 1'
].join(''));

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

// { $extract: { field: 'year', $equals: 2015 } }
mosql.registerConditionalHelper('$extract', { cascade: false }, function ( column, value, values, table ){
  var field = value.field;

  var helper = utils.find(Object.keys(value), function(helper) {
    return helper in mosql.conditionalHelpers.helpers;
  });

  if (value.timezone) column += ' at time zone ' + value.timezone;

  var expression = [
  'extract( ',
  , field
  , ' from '
  , column
  , ' )'
  ].join('');

  return helper ? mosql.conditionalHelpers.get(helper).fn(expression, value[helper]) : null;
});

mosql.registerConditionalHelper('$toChar', { cascade: false }, function ( column, value, values, collection ){
  var format = value.format;

  return ['to_char(', column, ',\'', format,'\')'].join('');
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
  , 'where not exists ( select * from "update_tbl" ) returning *'
  ].join('\n')
);

mosql.registerQueryHelper( 'upsert', function( upsert, values, query ){
  query.type = 'insert';
  process.nextTick( function(){ query.type = 'upsert'; });

  query.updates = upsert;
  query.columns = Object.keys( upsert );
  query.expression = utils.values( upsert ).map( function( v, i ){
    return "$" + (i + 1);
  });

  return '';
});

// Override groupBy
mosql.registerQueryHelper('groupBy', function(groupBy, values, query) {
  if ( !Array.isArray(groupBy) ) {
    groupBy = [ groupBy ];
  }

  return 'group by ' + groupBy.map( function( item ){
    if ( typeof item === 'object' ){
      return mosql.queryHelpers.get('expression').fn( item, values, query );
    } else if ( typeof item !== 'string' ) {
      throw new Error( 'Invalid groupBy type: ' + typeof item );
    }

    return mosql.quoteObject( item, query.__defaultTable );
  }).join(', ');
});

// override order by
// Support strings, objects, and mixed type lists
mosql.queryHelpers.register('order', function(order, values, query) {
  var output = 'order by ';

  if ( typeof order === 'string' ) {
    return output + order;
  }

  if ( Array.isArray(order) ) {
    output = output + order.map( function( item ){
      if ( typeof item === 'object' ){
        return mosql.queryHelpers.get('expression').fn( item, values, query );
      } else if ( typeof item === 'string' ) {
        return item;
      } else {
        throw new Error('Invalid order by type: ' + typeof item );
      }
    }).join(', ');

    return output;
  }

  if ( typeof order === 'object' ) {
    for ( var key in order ){
      output += mosql.quoteObject(key, query.__defaultTable) + ' ' + order[key] + ', ';
    }

    if ( output === 'order by ') return "";

    return output.substring(0, output.length - 2 );
  }
});

mosql.registerQueryHelper('distinct', function(distinct, values, query){
  if (typeof distinct != 'boolean' && typeof distinct != 'string' && !Array.isArray(distinct))
    throw new Error('Invalid distinct type: ' + typeof distinct);

  // distinct on
  if (Array.isArray(distinct)) {
     if(distinct.length === 0) return '';

    return 'distinct on (' + distinct.map(function(col){
      return mosqlUtils.quoteObject( col );
    }).join(', ') + ')';
  }

  if ( typeof distinct === 'string' ){
    return 'distinct on ( ' + distinct + ' )';
  }

  // distinct
  return (distinct) ? 'distinct ': '';
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
  var mLogger = logger.create('DBMiddleware-EnsureTargets');

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

    vals = vals.map( function( val ){
      val = utils.pick( val, columns );

      if ( Object.keys( val ).length === 0 ){
        mLogger.warn('Deleted all keys!');
      }

      return val;
    });

    if ( $query.type === 'update' ){
      $query.updates = vals[0];
    } else {
      $query.values = vals;
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
    , columns:  [{ type: 'expression'
                , expression: 'sum( payment_summary_items.net_payout ) + payment_summaries.adjustment'
                , alias: options.column
                }]
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

dirac.DAL = dirac.DAL.extend({
  initialize: function(){
    // Setup cached dependency graph for use by relationship helpers
    this.dependents   = {};
    this.dependencies = {};
    return this._super.apply( this, arguments );
  }

, insert: function( values, options, callback ){
    // Do not attempt to insert empty values
    if ( Array.isArray( values ) && values.length === 0 ){
      if ( typeof options === 'function' ){
        callback = options;
      }
      return callback();
    }

    return this._super( values, options, function( error, results ){
      callback = callback || utils.noop;
      if ( error ) return callback( error );

      // If there was only one result, values was length 1,
      // then it's likely they just inserted a single doc, want a single doc back
      if ( !Array.isArray( values ) || values.length === 0 )
      if ( results.length === 1 ){
         results = results[0];
      }

      return callback( null, results );
    });
  }

, upsert: function( where, doc, options, callback ){
    if ( typeof options === 'function' ){
      callback = options;
      options = {};
    }

    var $query = utils.extend({
      type: 'upsert'
    , table: this.table
    , where: where
    , upsert: doc
    }, options );

    $query = mosql.sql( $query );

  }

, findStream: function (where, options, callback) {
    if (typeof options == 'function'){
      callback = options;
      options = {};
    }

    var query = {
      type: 'select'
    , table: this.table
    , where: where
    };

    for (var key in options) query[key] = options[key];

    this.runBeforeFilters( 'find', query, function( error ){
      if ( error ){
        return callback( error) ;
      }

      pg.connect( this.connString, function (error, client, done) {
        if (error) {
          return handler(error);
        }

        var result = mosql.sql( query );
        var queryStream = new QueryStream( result.query, result.values );
        var stream = client.query(queryStream);
        stream.on('end', done);

        return callback(null, stream);
      });

    }.bind( this ));
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

dirac.use( function( dirac ){
  var userGroups = function( $query, schema, next ){
    if ( !$query.userGroups ) return next();

    $query.columns  = $query.columns  || ['*'];
    $query.columns.push({
      type: 'array'
    , expression: {
        type: 'select'
      , columns: ['group']
      , table: 'users_groups'
      , where: { 'user_id': '$users.id$' }
      }
    , alias: 'groups'
    });
    next();
  };
  dirac.dals.users.before('find', userGroups);
  dirac.dals.users.before('findOne', userGroups);
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

/** Optional query options for `orders.find`
   - submittedDate is a boolean to attach datetime submitted
   - acceptedDate is a boolean to attach datetime accepted
*/
dirac.use( function( dirac ){

  var statuses = [ 'submitted', 'accepted' ];

  // Create and register an order middleware for retrieving
  // latest status timestamp
  var registerMiddleware = function(status) {
    var mw = function( $query, schema, next ){
      var flag = status + 'Date';

      // Must opt-in to this middleware
      if ( !$query[flag] ) return next();

      $query.with     = $query.with     || [];
      $query.joins    = $query.joins    || [];
      $query.columns  = $query.columns  || ['*'];

      var cteName = status + '_dates';
      $query.with.push({
        name:     cteName
      , type:     'select'
      , table:    'order_statuses'
      , columns:  [ 'order_id', { type: 'max', expression: 'created_at', alias: status } ]
      , groupBy:  'order_id'
      , where:    { status: status }
      });

      $query.joins.push({
        type:     'left'
      , target:   cteName
      , on:       { order_id: '$orders.id$' }
      });

      if ( !$query[flag].ignoreColumn ) {
        $query.columns.push( cteName + '.' + status );
      }
      next();
    };

    dirac.dals.orders.before( 'find', mw );
    dirac.dals.orders.before( 'findOne', mw );
  };

  statuses.forEach(registerMiddleware);
});

dirac.use( function( dirac ){
  var onOrder = function( order ){
    Object.defineProperty( order, 'points', {
      get: function(){
        return RewardsOrder.create( this ).getPoints();
      }
    });

    Object.defineProperty( order, 'isAddressComplete', {
      get: function(){
        return utils.reduce(
          utils.map(
            utils.pick(this, ['street', 'city', 'state', 'zip', 'phone'])
          , function(val) { return val != null && val !== ''; }
          )
        , function(memo, item, list) { return memo && item; }
        , true
        );
      }
    });

    Object.defineProperty( order, 'adjustment', {
      get: function(){
        return {
          description:  this.adjustment_description
        , amount:       this.adjustment_amount
        };
      }

    , set: function( v ){
        this.adjustment_description = v.description;
        this.adjustment_amount      = v.amount;
      }
    });

    Object.defineProperty( order, 'courierReasons', {
      get: function(){
        if ( this.type !== 'courier' ) return [];

        return odsChecker.why( this );
      }
    });

    Object.defineProperty( order, 'deadline', {
      enumerable: true
    , get: function(){
        return Order.fixed.methods.getDeadline.call( this );
      }
    });
  };

  var transformLocation = function( order ){
    if ( !order.location ) return;
    if ( !order.location.lat_lng ) return;
    order.location.lat_lng = pg.types.getTypeParser(600)( order.location.lat_lng );
  };

  var afterOrderFind = function( results, $query, schema, next ){
    results.forEach( onOrder );

    var fetchedLocation = ( $query.one || [] )
      .some( function( relation ){
        return relation.table === 'restaurant_locations'
      });

    if ( fetchedLocation ){
      results.forEach( transformLocation );
    }

    if ( $query.applyPriceHike ){
      results.forEach( function( order ){
        Order.applyPriceHike( order, $query.applyPriceHike );
      });
    }

    next();
  };

  dirac.dals.orders.after( 'find', afterOrderFind );
  dirac.dals.orders.after( 'findOne', afterOrderFind );
  dirac.dals.orders.after( 'update', afterOrderFind );
  dirac.dals.orders.after( 'insert', afterOrderFind );
});

dirac.use( function(){
  var onUser = function( user ){
    Object.defineProperty( user, 'user_agent_display', {
      get: function(){
        if ( !user.user_agent ) return null;
        return utils.useragent.parse( user.user_agent ).toString();
      }
    });
  };

  var afterUserFind = function( results, $query, schema, next ){
    results.forEach( onUser );
    next();
  };

  dirac.dals.users.after( 'find', afterUserFind );
  dirac.dals.users.after( 'findOne', afterUserFind );
});

// Log queries to dirac
/*
dirac.use( function( dirac ){
  // var query_ = dirac.DAL.prototype.query;
  // dirac.DAL.prototype.query = function( query, callback ){
  //   console.log( JSON.stringify(query, true, '  ') );
  //   return query_.apply( this, arguments );
  // };

  var raw = dirac.DAL.prototype.raw;
  dirac.DAL.prototype.raw = function( query, values, callback ){
    console.log( query, values );
    return raw.apply( this, arguments );
  };
});
//*/
