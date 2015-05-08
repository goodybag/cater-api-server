var app       = require('../../app');
var config    = require('../../config');
var utils     = require('../../utils');

module.exports = function( def ){
  [ 'to', 'from', 'subject'
  ].forEach( function( prop ){
    if ( typeof def[ prop ] !== 'function' ){
      throw new Error('Missing required function `' + prop + '`');
    }
  });

  if ( typeof def.template !== 'string' ){
    throw new Error('Invalid template');
  }

  return Object.create( utils.extend({
    build: function( order, options, logger, callback ){
      var viewOptions = {
        layout: 'email-layout'
      , config: config
      , order:  order
      };

      var preview = {
        to:         def.to( order, options )
      , from:       def.from( order, options )
      , subject:    def.subject( order, options )
      };

      if ( options.render === false ){
        return callback( null, preview );
      }

      app.render( def.template, viewOptions, function( error, html ){
        if ( error ) return callback( error );

        preview.html = html;

        return callback( null, preview );
      });
    }

  , send: function( order, options, logger, callback ){
      this.build( order, options, logger, function( error, result ){
        if ( error ) return callback( error );

        utils.sendMail2( result, callback );
      });
    }
  }, def ) );
};