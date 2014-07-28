module.exports = function(){
  return function( req, res, next ){
    if ( !('accept' in req.headers) ) return next();
    if ( req.headers.accept.split(',').indexOf('text/html') === -1 ) return next();

    var oldSend = res.send;

    res.send = function( content ){
      if ( typeof content !== 'number' ) return oldSend.apply( res, arguments );
      if ( [ 401, 404, 500, 503 ].indexOf( content ) === -1 ) return oldSend.apply( res, arguments );
      res.render( content );
    };

    next();
  };
};