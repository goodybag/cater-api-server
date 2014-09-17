module.exports = function(opts) {
  return function( req, res, next ){

    // Must be attached after req.body is parsed from express.json()
    req.logger.options.data.req.body = req.body;

    req.logger.info( '%s - %s', req.method, req.url );
    next();
  };
};