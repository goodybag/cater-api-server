var utils = require('utils');
var db = require('db');

module.exports = require('stampit')()
  .defaults({
    processingLimit: 5
  })
  .methods({
    save: function( callback ){
      var onEmail = function( email, done ){
        var this_ = this;
        var tx = db.dirac.tx.create();

        utils.async.waterfall([
          tx.begin.bind( tx )

          // See if there's an existing user
        , tx.users.findOne.bind( tx.users, { email: email } )

          // If there wasn't, create one
        , function( user, next ){
            if ( user ){
              return next( user );
            }

            tx.users.insert( { email: email }, next );
          }

          // See if we should associate user to org
        , function( user, next ){
            if ( !utils.emailDomainsMatch( this_.order.user.email, email ) ){
              return next( null, user );
            }

            var org_id = this_.order.user.organization_id;

            tx.users.update( user.id, { organization_id: org_id }, function( error, results ){
              if ( error ) return next( error );

              return next( null, results[0] );
            });
          }

          // Create order collaborator record
        , function( user, next ){
            tx.order_collaborators.insert({
              user_id: user.id
            , order_id: this_.order.id
            }, next );
          }

        , function( collaborator, next ){
            tx.commit( next );
          }
        ], function( error ){
          if ( error ){
            return tx.rollback( function(){
              done( error );
            });
          }

          done();
        });
      };

      utils.async.eachLimit( this.emails, this.processingLimit, onEmail, function( error ){
        if ( error ){
          return callback( error );
        }

        callback();
      });
    }
  });