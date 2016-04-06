var db = require('../../db');
var utils = require('../../utils');
var logger = require('./logger');

/**
 * Run multiple jobs one after another
 *
 * @param  {Array} jobs An array of job objects
 */

module.exports = function series(jobs, callback){
  callback = callback || utils.noop;

  logger.info('Series', { jobs: jobs });

  // We need to run these inserts in a transaction, but in order for us
  // to get the id of each result, it's easiest to do this in an anonymous
  // plpgsql code block
  var queryTmpl = function( jobs ){
    return [
      'do $$'
    , '  declare job record;'
    , 'begin'
    , '  ' + insertTmpl( utils.extend( { withoutJob: true }, jobs[0] ) )
    , jobs.slice(1).map( function( job ){
        return '  ' + insertTmpl( job );
      }).join('\n')
    , 'end$$;'
    ].join('\n');
  };

  var insertTmpl = function( data ){
    var insertable = {};
    var values = [];

    var headers = [
      'action'
    , 'datetime'
    , 'data'
    ].filter( function( k ){
      return k in data;
    });

    if ( data.withoutJob !== true ){
      headers.push('predicate_id');
    }

    headers.forEach( function( h ){
      if ( h === 'predicate_id' ){
        values.push('job.id');
      } else if ( h === 'data' ){
        values.push( "'" + JSON.stringify( data[ h ] ) + "'::json" );
      } else {
        values.push( "'" + data[ h ] + "'" );
      }
    });

    return [
      'execute \''
    , 'insert into "scheduled_jobs" '
    , '( "' + headers.join('", "') + '" ) '
    , 'values ( $' + values.map( function( a, i ){ return i + 1; }).join(', $') + ' ) '
    , 'returning *'
    , '\' into job using '
    , values.join(', ')
    , ';'
    ].join('');
  };

  db.query( queryTmpl( jobs ), [], callback );
}
