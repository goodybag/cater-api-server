/**
 * FetchVal
 *
 * A FetchVal is a value that is fulfilled asynchronously and
 * updated periodically. I'm sure there's already an existing
 * name for this abstraction, but this is the one I made.
 *
 * There are two primary components to a FetchVal
 *
 * 1. initialValue (mixed)
 *   This is the empty state version of the value. It should be
 *   a value such that, if the value of is requested, no errors
 *   will occur. For instance, if the consumer of the FetchVal
 *   expects a collection of documents and always uses Array
 *   functions to access the values, then there will be no error
 *   in the following code:
 *
 *      var users = fetchVal({
 *        initialValue: []
 *      , fetch: function( done ){
 *          setTimeout( done.bind( null, [
 *            { name: 'Bob' }, { name: 'Susan' }, { name: 'Jill' }
 *          ]), 5000 );
 *        }
 *      });
 *
 *      users.value.forEach( function( user ){
 *        console.log( user );
 *      });
 *
 * 2. fetch( callback ) (Function)
 *   This is the async function that fetches the actual result of
 *   the variable. Its callback parameter follows normal node
 *   callback convention (error, result).
 *
 *   If an error is passed back, the fetchVal will have a property
 *   called `error` set to the error. Therefore, you can treat
 *   fetchVals like synchronous node style callbacks.
 *
 *      var users = fetchVal({
 *        initialValue: []
 *      , fetch: function( done ){
 *          setTimeout( done.bind( null, [
 *            { name: 'Bob' }, { name: 'Susan' }, { name: 'Jill' }
 *          ]), 5000 );
 *        }
 *      });
 *
 *      Later in the code...
 *
 *      if ( users.error ){
 *        res.error( users.error );
 *      }
 */

var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    period:       1000 * 60
  , initialValue: []
  });

  if ( typeof options.fetch !== 'function' ){
    throw new Error('Must provide `fetch` function');
  }

  var proto = {};

  utils.extend( proto, require('events').EventEmitter.prototype );

  utils.extend( proto, {
    options: options

  , value: options.initialValue
  , error: null

  , onTick: function(){
      this.options.fetch( function( error, result ){
        if ( error ){
          this.error = error;
          this.emit( 'error', this.error, this );
          return;
        }

        this.error = null;
        this.value = result;
        this.emit( 'value', this.value, this );
      }.bind( this ));
    }

  , start: function(){
      if ( this.fetchInteval ) return this;

      this.fetchInteval = setInterval(
        this.onTick.bind( this )
      , this.options.period
      );

      this.onTick();

      return this;
    }

  , stop: function(){
      if ( !this.fetchInteval ) return this;

      clearInterval( this.fetchInteval );
      delete this.fetchInteval;

      return this;
    }

  , valueOf: function(){
      return this.value;
    }
  })

  return Object.create( proto ).start();
};