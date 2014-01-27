module.exports.get = function( req, res ){
  var options = {
    layout: 'email-layout'
  };

  res.render( 'gb-update-email', options );
};