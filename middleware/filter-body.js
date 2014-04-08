/**
 * Filter Body
 *
 * Filter fields on the body on group
 */

module.exports = function( def ){
  return function( req, res, next ){
    var available = [];

    if ( req.user && req.user.attributes.groups ){
      req.user.attributes.groups.filter( function( group ){
        return group in def;
      }).forEach( function( group ){
        def[ group ].forEach( function( field ){
          if ( available.indexOf( field ) === -1 ){
            available.push( field );
          }
        });
      });
    }

    for ( var key in req.body ){
      if ( available.indexOf( key ) === -1 ) delete req.body[ key ];
    }

    next();
  };
};