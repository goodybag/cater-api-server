/**
 * Order Collaborator
 */

var db = require('db');
var utils = require('utils');
var LoggerMixin = require('../../../../../lib/stampit-logger');

module.exports = require('stampit')()
  .compose( LoggerMixin('Collaborator') )
  .state({

  })
  .methods({
    save: function( callback ){
      var tx = db.dirac.tx.create();

      utils.async.waterfall([
        tx.begin.bind( tx )

        // See if there's an existing user
      , tx.users.findOne.bind( tx.users, { email: this.email } )

        // If there wasn't, create one
      , ( user, next )=>{
          this.logger.debug('If there wasnt, create one', user);

          if ( user ){
            return next( null, user );
          }

          tx.users.insert( { email: this.email, password: 'alskdjfalskdj' }, next );
        }

        // Lookup the user's organizations
      , ( user, next )=>{
          this.logger.debug('Lookup the users organizations');

          var options = {
            mixin: [{ table: 'organizations' }]
          };

          tx.organizations_users.find({ user_id: user.id }, ( error, results )=>{
            if ( error ){
              return next( error );
            }

            user.organizations = results || [];

            return next( null, user );
          });
        }

        // See if we should associate user to org
      , ( user, next )=>{
          this.logger.debug('See if we should associate user to org');

          if ( !utils.emailDomainsMatch( this.order.user.email, this.email ) ){
            return next( null, user );
          }

          if ( this.order.user.organizations.length === 0 ){
            return next( null, user );
          }

          var doc = {
            organization_id: this.order.user.organizations[0].id
          , user_id: user.id
          };

          tx.organizations_users.insert( doc, ( error, results )=>{
            if ( error ) return next( error );

            return next( null, results[0] );
          });
        }

        // Create order collaborator record
      , ( user, next )=>{
          this.logger.debug('Create order collaborator record');

          tx.order_collaborators.insert({
            user_id: user.id
          , order_id: this.order.id
          }, next );
        }

        // Commit everything
      , ( result, next )=>{
          tx.commit( next );
        }
      ], ( error )=>{
        if ( error ){
          return tx.rollback( ()=> callback( error ) );
        }

        callback();
      });
    }
  });