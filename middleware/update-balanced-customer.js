var utils = require('utils');

module.exports = function(options) {
  return function(req, res, next) {
    var logger = req.logger.create('Update balanced customer');

    utils.enforceRequired(options, [
      'required'
    , 'pick'
    ]);

    var obj = req[options.required];
    var data = utils.pick(req.body, options.pick);

    if ( !obj ) return next();
    if ( !data ) return next();

    // Normalize to plain objects
    if ( obj.attributes ) obj =  obj.toJSON();

    utils.balanced.Customers.update(obj.balanced_customer_uri, data, function(err) {
      if ( err ) {
        logger.error('Unable to update Balanced Customer', err);
      } else {
        logger.info('Updated Successfully');
      }
      return next();
    });
  };
};
