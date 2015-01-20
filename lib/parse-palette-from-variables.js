var fs = require('fs');

var regs = {
  palette: /\@palette.*\:\s*.*\;/g
, nameBefore: /\@palette\-/
, nameAfter: /\:\s*.*\;/
, colorBefore: /\@palette.*\:\s*/
, colorAfter: /\;/
}

module.exports.parse = function( callback ){
  fs.readFile( __dirname + '/../less/variables.less', function( error, contents ){
    if ( error ) return callback( error );

    callback( null, module.exports._parse( contents.toString() ) );
  });
};

module.exports._parse = function( str ){
  return str
    .match( regs.palette )
    .map( function( match ){
      return {
        name:   match.replace( regs.nameBefore, '' )
                     .replace( regs.nameAfter, '' )
      , color:  match.replace( regs.colorBefore, '' )
                     .replace( regs.colorAfter, '' )
      };
    });
};