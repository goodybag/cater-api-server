var utils = require('../utils');

module.exports = function(options) {
  if (typeof options !== 'object')
    throw new Error('Update Stripe Customer requires options');

  utils.enforceRequired(options, [
    'required'
  , 'pick'
  ]);

  return function(req, res, next) {
    var logger = req.logger.create('Update stripe customer');
    var obj = req[options.required];
    var data = utils.pick(req.body, options.pick);

    if ( !obj ) return next();
    if ( !data ) return next();

    // place name under metadata
    if (data.name) {
      data.metadata = { name: data.name };
      delete data.name;
    }

    // Normalize to plain objects
    if ( obj.attributes ) obj =  obj.toJSON();

    utils.stripe.customers.update(obj.stripe_id, data, function(err) {
      if ( err ) {
        logger.error('Unable to update Customer', err);
      } else {
        logger.info('Updated Successfully');
      }
      return next();
    });
  };
};
