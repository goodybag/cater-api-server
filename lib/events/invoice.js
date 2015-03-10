/**
 * Events:Invoice
 */

var db        = require('../../db');
var utils     = require('../../utils');
var scheduler = require('../../lib/scheduler');
var invoices  = require('stamps/user-invoice');
var pdfs      = require('../../lib/pdfs');

module.exports = {
  'invoice:change':
  function( id ){
    console.log('invoice:change');
    pdfs.invoices.build({ id: id }, function( error ){
      if ( error ) console.log(error);
    });
  }
};