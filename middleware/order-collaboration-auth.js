var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    tokenPath: 'headers.Order-Collaboration-Token'
  });

  return function( req, res, next ){
    var logger = req.logger.create('OrderCollaborationAuth');
    var collaborators = req.order.collaborators;

    if ( !Array.isArray( collaborators ) ){
      logger.warn('Attempted to call auth, but order.collaborators was not an array. Calling next()');
      return next();
    }

    var token = utils.result( req, options.tokenPath );

    if ( collaborators.some( collab => collab.id === token ) ){
      req.user.attributes.groups.push('order-editor');
    }

    return next();
  };
};