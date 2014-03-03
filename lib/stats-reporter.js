/**
 * Stats Reporter
 */

module.exports = Object.create({
  printrow: function( character ){
    character = character || '#';
    console.log(
      Math.pow( 2, process.stdout.columns - 1 ).toString(2).replace( /./g, character )
    );
  }

, logStat: function( group, result ){
    this.printrow('#');
    console.log( '# ' + group );
    this.printrow('#');

    var longest = Math.max.apply( Math, Object.keys( result ).map( function( k ){
      return result[ k ].text.length;
    }));

    for ( var key in result ){
      // Log errors by worker/reminder module
      // if ( key === 'errors' && result.errors.value > 0 ){
      //   result.errors.objects.forEach( function( error ){
      //     logger.reminder.error( [ key ], error );
      //   });
      // }

      console.log(
        "  *"
      , result[ key ].text
      , Math.pow( 2, longest - result[ key ].text.length ).toString(2).replace( /./g, ' ' )
      , ":"
      , result[ key ].value
      );
    }

    console.log("\n\n");
  }

, logError: function( error ){
    console.log( error );
  }

, logResults: function( errors, results ){
    console.log("\n\n")

    if ( errors ) errors.forEach( this.logError.bind( this ) );

    for ( var key in results ){
      this.logStat( key, results[ key ] );
    }
  }

, createStatsGroup: function( obj ){
    var stats = {};

    for ( var key in obj ) stats[ key ] = { value: 0, text: obj[ key ] };

    return stats;
  }
});