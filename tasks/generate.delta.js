var fs      = require('fs');
var path    = require('path');
var semver  = require('semver');

var options = {
  name: 'generate.delta'
, description: [
    'Generate a delta sql file\n'
  , '  Usage: grunt generate.delta[:version]'
  ].join('')
, dest: 'db/deltas'
, ext: 'sql'
};

var tmpl = function( data ){
  return [
    "-- Delta"
  , ""
  , "DO $$"
  , "  declare version       text := '" + data.version + "';"
  , "begin"
  , "  raise notice '## Running Delta v% ##', version;"
  , ""
  , "  -- Update version"
  , "  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();"
  , "end$$;"
  ].join('\n');
};

module.exports = function( grunt ){
  grunt.registerTask( options.name, options.description, function(){
    if ( !fs.existsSync( options.dest ) ){
      fs.mkdirSync( options.dest );
    }

    var args = Array.prototype.slice.call( arguments );

    // If they didn't specify a version, just generate a base file
    // with the latest file patched
    if ( args.length === 0 ){
      var latest = fs.readdirSync( options.dest ).filter( function( f ){
        return fs.statSync( path.join( options.dest, f ) ).isFile() && f.slice(-3) === 'sql';
      }).map( function( f ){
        return f.slice( 0, -4 );
      }).sort( function( a, b ){
        return semver.gt( a, b );
      }).pop();

      if ( !latest ){
        args.push('0.0.1');
      } else {
        args.push( semver.inc( latest, 'patch' ) );
      }
    }

    args.forEach( function( version ){
      var dest = path.join( options.dest, version ) + '.' + options.ext;
      grunt.log.writeln( 'Creating', dest );
      fs.writeFileSync( dest, tmpl({ version: version }) );
    });
  });
};