/**
 * Events:Restaurant Requests
 */

var moment    = require('moment-timezone');
var utils     = require('../../utils');
var config    = require('../../config');
var scheduler = require('../scheduler');

module.exports = {
  'restaurant_request:created':
  function onRestaurantContactCreate( rRequest ){
    utils.sendMail2({
      to: config.restaurantRequestRecipients
    , from: config.emails.info
    , subject: '[Restaurant Request] Restaurant inquiring about Goodybag'
    , html: [
        '<p>A restaurant just requested to be a caterer. Here are the details</p>'
      ].concat(
        Object.keys( rRequest ).map( function( k ){
          return [
            '<div style="margin-top: 12px">'
          , '  <strong style="display: inline-block; width: 110px">' + k + ':</strong>'
          , rRequest[ k ]
          , '</div>'
          ].join('')
        })
      ).join('\n')
    })
  }
};