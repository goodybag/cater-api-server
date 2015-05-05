var app   = require('../../../app');
var utils = require('../../../utils');

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
    build: function( order, options, callback ){
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

      if ( !options.render ){
        return callback( null, html );
      }

      app.render( def.template, viewOptions, function( error, html ){
        if ( error ) return callback( error );

        preview.html = html;

        return callback( null, html );
      });
    }

  , send: function( order, options ){

    }
  }, def ) );
};