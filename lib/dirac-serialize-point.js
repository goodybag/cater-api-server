/**
 * Dirac Serialize Point
 * Ensures all dals with schemas who have a type 'point'
 * gets their write values serialized to the proper format
 */

var _ = require('lodash');

module.exports = function( options ){
  options = _.defaults( options || {}, {
    operations: [ 'insert', 'update' ]
  , targetType: 'point'
  });

  return function( dirac ){
    // Holds an array of columns hashed by table
    // The columns are belong to table and are of targetType
    var tableColumnGraph = {};

    var columnIsTargetType = function( table, column ){
      return dirac.dals[ table ].schema[ column ].type === options.targetType;
    };

    // Serializes a pg point object
    var serialize = function( obj ){
      return '( ' + [ obj.x, obj.y ].join(', ') + ' )';
    };

    // Transforms a part of the query to be a serialized point
    var transform = function( obj, key ){
      obj[ key ] = serialize( obj[ key ] );
    };

    var serializePointMidleware = function( query, schema, next ){
      var vals;

      if ( query.type === 'insert' ){
        vals = Array.isArray( query.values ) ? query.values : [ query.values ];
      } else if ( query.type === 'update' ){
        vals = [ query.updates ];
      }

      vals.forEach( function( obj ){
        var targetColumns = tableColumnGraph[ query.table ]
          .filter( function( col ){
            return obj[ col ] && obj[ col ].x && obj[ col ].y;
          })
          .forEach( transform.bind( null, obj ) );
      });

      next();
    };

    // Register middleware
    Object
      .keys( dirac.dals )
      // Filter down to tables that have columns type: `point`
      .filter( function( table ){
        return Object
          .keys( dirac.dals[ table ].schema )
          .some( columnIsTargetType.bind( null, table ) );
      })
      .forEach( function( table ){
        // Cache the columns that have our targetType
        tableColumnGraph[ table ] = Object
          .keys( dirac.dals[ table ].schema )
          .filter( columnIsTargetType.bind( null, table ) );

        // Before each insert/update, check to see if we're writing to the
        // point column. If so, serialize the type
        options.operations.forEach( function( op ){
          dirac.dals[ table ].before( op, serializePointMidleware );
        });
    });
  };
};