/**
 * YelpBusiness.Fetch (Node Only)
 * Provides methods to fetch data from Yelp API
 */

var yelp    = require('yelp');
var config  = require('config');
var utils   = require('utils');
var errors  = require('errors');

module.exports = require('stampit')()
  .methods({
    client: yelp.createClient(
      utils.pick( config.yelp, [
        'consumerKey'
      , 'consumerSecret'
      , 'token'
      , 'tokenSecret'
      ])
    )

  , fetch: function( callback ){
      if ( !this.id ){
        throw new Error('Missing required property `id`');
      }

      this.client.business( this.id, function( error, business ){
        if ( error ) return callback( error );

        utils.extend( this, business );

        return callback( null, this );
      }.bind( this ));
    }
  });