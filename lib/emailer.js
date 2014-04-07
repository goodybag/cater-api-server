/**
 * Emailer
 *
 * Adds an email to the email queue
 */

var db = require('../db');

module.exports.send = function( email, callback ){
  db.emails.insert( email, callback );
};