/**
 * Attach route params to res.locals
 */
module.exports = function(req, res, next) {
  res.locals.params = res.locals.params || {};


  // assigning res.local.params = req.params doesnt work
  for(var key in req.params)
    res.locals.params[key] = req.params[key];
  next();
};
