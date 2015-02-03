/**
 * middleware.param
 */

module.exports = function( field, def, fn ){
  if (typeof def == 'function') fn = def, def = null;
  return function(req, res, next){
    var value = req.params[field] || req.query[field] || def;
    if (value == undefined || value == null) return next();

    if (typeof fn == 'function') fn(value, req.queryObj, req.queryOptions);
    else {
      if ( Array.isArray( value ) ){
        req.queryObj[field] = { $in: value };
      } else {
        req.queryObj[field] = value;
      }
    }
    next();
  };
};
