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

      var email = {
        to:         def.to( order, options )
      , from:       def.from( order, options )
      , subject:    def.subject( order, options )
      };

      if ( options.render === false ){
        return callback( null, email );
      }

      app.render( def.template, viewOptions, function( error, html ){
        if ( error ) return callback( error );

        email.html = html;

        return callback( null, email );
      });
    }

  , send: function( build, order, options, logger, callback ){
      utils.sendMail2( build, callback );
    }
  }, def ) );
};