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
      this.logger.debug('Saving collaborator', this.email);

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

          tx.partial_registrations.create( this.email, next );
        }

        // Lookup the user's organizations
      , ( user, next )=>{
          this.logger.debug('Lookup the users organizations');

          var options = {
            mixin: [{ table: 'organizations' }]
          };

          tx.organizations_users.find({ user_id: user.id }, options, ( error, results )=>{
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

          if ( !this.order.organization ){
            return next( null, user );
          }

          if ( utils.getDomainNameFromEmail( this.email ) === this.order.organization.domain ){
            return next( null, user );
          }

          if ( this.order.user.organizations.length === 0 ){
            return next( null, user );
          }

          // TODO:
          // This assumes a single organization even though it is
          // a many relationship. 
          // What we could do is add `organization_id` to the order
          // and add `domain_name` to the organization. When a collab
          // is added, we check the email domain against the orders
          // org domain on whether or not to associate
          var org = this.order.user.organizations[0];

          // If the user is alraedy in the order user's org, continue
          if ( user.organizations.some( org => org.id === org.id ) ){
            return next( null, user );
          }

          var doc = {
            organization_id: org.id
          , user_id: user.id
          };

          tx.organizations_users.insert( doc, ( error, results )=>{
            if ( error ) return next( error );

            tx.users.update( user.id, { organization: org.name }, ( error )=>{
              next( null, user );
            });
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