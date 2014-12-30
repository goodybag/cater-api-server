/**
 * Events:Jukebox
 */

var utils     = require('../../utils');
var config    = require('../../config');

module.exports = {
  'order:status:change':
  function( order ){
    if ( config.env !== 'production' ) return;
    if ( order.attributes.status !== 'accepted' ) return;
    if (
      order.attributes.user && typeof order.attributes.user.email === 'string' &&
      order.attributes.user.email.indexOf('@goodybag.com') > -1
    ) return;

    logger.info('Posting to deployments jukebox');
    utils.post('http://gb-prod-alert.j0.hn/deployments/accepted', order.toJSON());
  }
};