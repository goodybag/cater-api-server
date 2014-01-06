var fs = require('fs');

module.exports.register = function(hbs){
  hbs.registerPartials(__dirname + '/../public/partials');

  [
    'order-items'
  , 'order-details'
  , 'order-details-no-header'
  , 'accept-reject'
  ].forEach( function( name ){
    hbs.registerPartial(
      'email_' + name.replace( /\-/g, '_' )
    , fs.readFileSync( __dirname + '/../views/order-email/' + name + '.hbs' ).toString()
    );
  });
};