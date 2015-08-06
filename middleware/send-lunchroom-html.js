var fs      = require('fs');
var http    = require('superagent');
var utils   = require('../utils');
var config  = require('../config');

function createCacheControl( str ){
  if ( typeof str !== 'string' ){
    throw new Error('invalid cache-control header');
  }

  return Object.create({
    original: str
  , maxAge: function(){
      var result = this.original
        .replace( /\,\w+/g, ',' )
        .split(',')
        .filter( function( item ){
          return item.indexOf('max-age') > -1;
        })[0];

      if ( !result ) return null;

      result = +result.split('=')[1];

      return isNaN( result ) ? null : result;
    }
  });
}

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    defaultAge: 1000 * 60 * 5 
  , tmpFile: __dirname + '/../tmp/lunchroom-cache.html'
  , url: 'http://lunchroom.goodybag.com/.landing.html'
  });

  var end = 0;
  var cache;

  function onRequest( req, res ){
    options.url = req.params.host || options.url;

    if ( Date.now() < end ){
      return fs.exists( options.tmpFile, function( result ){
        if ( !result ){
          end = 0;
          return onRequest( req, res );
        }

        fs.createReadStream( options.tmpFile ).pipe( res );
      });
    }

    var _req = http.get( options.url );

    _req.pipe( res )
    _req.pipe( fs.createWriteStream( options.tmpFile ) );

    _req.on('end', function(){
      try {
        var cacheControl = createCacheControl( _req.res.headers['cache-control'] );
        end = Date.now() + cacheControl.maxAge();
      } catch( e ){
        // Invalid cache-control header for our purposes
      }
    });
  };

  return onRequest;
};