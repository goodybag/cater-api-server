/**
 * Invoices
 */

var logger    = require('../../lib/logger').create('Controller-Invoices');
var invoices  = require('stamps/user-invoice');

module.exports.sendEmail = function( req, res ){
  invoices({ id: req.params.id })
    .sendEmailAsync()
    .catch( function( error ){
      logger.error('Error sending invoice', {
        invoice: { id: req.params.id }
      , error:   error
      });

      res.status(500).send({ error: error });
    })
    .then( function( invoice ){
      res.status(204).send( invoice );
    });
};