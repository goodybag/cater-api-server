/**
 * Events:Payment Summaries
 */

var pdfs = require('../pdfs');

module.exports = {
  'payment-summary:change':
  function( psid, psrid ){
    var logger = this.logger;

    pdfs.pms.build({ id: psid, restaurant_id: psrid }, function( error ){
      if ( error ){
        logger.error( 'Could not schedule pms build: ' + psid, error );
      }
    });
  }
};