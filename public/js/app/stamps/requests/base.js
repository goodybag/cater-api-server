/**
 * Base
 *
 * Provides easy access to our internal requests utility
 * for other request stamps to utilize
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');

  return require('stampit')()
    .state({
      req: {
        method:   'GET'
      , headers:  {}
      , body:     {}
      , qs:       {}
      }
    })
    .methods({
      url: function( url ){
        if ( !url ) return this.req.url;
        this.req.url = url;
        return this;
      }

    , method: function( method ){
        this.req.method = method.toUpperCase();;
        return this;
      }

    , header: function( key, val ){
        if ( typeof key === 'object' ){
          utils.extend( this.headers, key );
          return this;
        }

        this.req.headers[ key ] = val;

        return this;
      }

    , query: function( key, val ){
        if ( typeof key === 'object' ){
          utils.extend( this.req.qs, key );
          return this;
        }

        this.req.qs[ key ] = val;

        return this;
      }

    , json: function( body ){
        if ( body ){
          this.body( body );
        }

        this.req.json = true;
        this.header('Content-Type', 'application/json');

        return this;
      }

    , body: function( body ){
        utils.extend( this.req.body, body );
        return this;
      }

    , send: function( callback ){
        if ( !this.req.url ){
          throw new Error('Cannot send without `url` set');
        }

        var options = this.req;

        if ( this.req.method === 'GET' ){
          options = utils.omit( options, ['body'] );
        }

        return utils.http( options )
          .asCallback( callback )
      }
    });
});