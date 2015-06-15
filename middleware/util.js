/**
 * Utility Middleware
 */

var m = module.exports;

/**
 * Takes fields from the query parameters and puts them on the body
 *
 * Example:
 *
 *   app.post('/users/:user_id/stor'
 *   , m.queryToBody('user_id')
 *     ...
 *   );
 *
 *   POST /users/27/story {
 *     name: 'My Story'
 *   , description: 'Blah blah blah blah'
 *   }
 *
 *   => {
 *     name: 'My Story'
 *   , description: 'Blah blah blah blah'
 *   , user_id: 27
 *   }
 */
m.queryToBody = function(){
  var params = Array.prototype.slice.call( arguments );

  return function( req, res, next ){
    for ( var i = 0, l = params.length; i < l; ++i ){
      req.body[ params[i] ] = req.params[ params[i] ];
    }

    next();
  };
};
