var fs      = require('fs');
var path    = require('path')
var wrench  = require('wrench');

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

  // Register all partials in /views/**.../partials
  // Prefixes partial name with folder structure
  // So views/admin/restaurants/partials/my-partial.hbs is registered as:
  //   admin_restaurants_my_partial
  var viewsDir = path.join( __dirname, '../views' );
  wrench.readdirSyncRecursive( viewsDir ).filter( function( dir ){
    return path.basename( dir ) === 'partials'
  }).forEach( function( dir ){
    dir = path.join( viewsDir, dir );
    var prefix = [];
    var base;
    var i = 1;

    do {
      if ( base ) prefix.unshift( base.split('-').join('_') );
      base = path.basename( path.resolve( dir, new Array( ++i ).join('../') ) );
    } while ( base !== 'views' );

    fs.readdirSync( dir ).filter( function( file ){
      return path.extname( file ) === '.hbs';
    }).forEach( function( file ){
      var name = prefix.concat( file.slice( 0, -4 ).split('-') ).join('_');
      console.log('registering', name )
      hbs.registerPartial( name, fs.readFileSync( path.join( dir, file ) ).toString() );
    });
  });
};