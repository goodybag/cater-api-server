var db = require('../../../../../db');
var utils = require('../../../../../utils');
var scheduler = require('../../../../../lib/scheduler');

module.exports = require('stampit')()
  .compose( require('./collaboration') )
  .state({
    processingLimit: 5
  , fromEmail: 'orders@goodybag.com'
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
          console.log('If there wasnt, create one', user);
            if ( user ){
              return next( null, user );
            }

            tx.users.insert( { email: email, password: 'alskdjfalskdj' }, next );
          }

          // Lookup the user's organizations
        , function( user, next ){
          console.log('Lookup the users organizations');
            var options = {
              mixin: [{ table: 'organizations' }]
            };

            tx.organizations_users.find({ user_id: user.id }, function( error, results ){
              if ( error ){
                return next( error );
              }

              user.organizations = results || [];

              return next( null, user );
            });
          }

          // See if we should associate user to org
        , function( user, next ){
          console.log('See if we should associate user to org');
            if ( !utils.emailDomainsMatch( this_.order.user.email, email ) ){
              return next( null, user );
            }

            if ( this_.order.user.organizations.length === 0 ){
              return next( null, user );
            }

            var doc = {
              organization_id: this_.order.user.organizations[0].id
            , user_id: user.id
            };

            tx.organizations_users.insert( doc, function( error, results ){
              if ( error ) return next( error );

              return next( null, results[0] );
            });
          }

          // Create order collaborator record
        , function( user, next ){
          console.log('Create order collaborator record');
            tx.order_collaborators.insert({
              user_id: user.id
            , order_id: this_.order.id
            }, next );
          }

          // Send the email
        , function( collaborator, next ){
          console.log('Send the email');
          console.log({
              to: email
            , from: this_.fromEmail
            , subject: this_.subject || this_.defaultSubject()
            , html: this_.message || this_.defaultMessage()
            });
            utils.sendMail2({
              to: email
            , from: this_.fromEmail
            , subject: this_.subject || this_.defaultSubject()
            , html: this_.message || this_.defaultMessage()
            }, next );
          }

          // Commit everything
        , function( result, next ){
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
      }.bind( this );

      utils.async.eachLimit( this.collaborators, this.processingLimit, onEmail, function( error ){
        if ( error ){
          return callback( error );
        }

        callback();
      });
    }

  , fetchOrder: function( callback ){
      module.exports.fetchOrder( this.order_id, function( error, result ){
        if ( error ){
          return callback( error );
        }

        this.order = result;

        return callback( null, this );
      }.bind( this ));
    }

  , getLookupClause: function(){
      if ( this.id ) return { id: id };
      if ( this.email && this.order_id ){
        return { email: this.email, order_id: order_id };
      }

      throw new Error(
        'Cannot get lookup clause for OrderCollabor '
      + 'without a valid `id` or `email` and `order_id` combo'
      );
    }

  , setError: function( error, callback ){
      var where = this.getLookupClause();

      var doc = {
        error: JSON.stringify( error )
      };

      db.order_collaborators.update( where, doc, callback );
    }

  , setLastNotified: function( date, callback ){
      if ( typeof date === 'function' ){
        callback = date;
        date = new Date();
      }

      var where = this.getLookupClause();

      var doc = {
        last_notified_at: date
      };

      db.order_collaborators.update( where, doc, callback );
    }
  });

module.exports.fetchOrder = function( id, callback ){
  var options = {
    one: [
      { table: 'users', alias: 'user'
      , many: [
          { table: 'organizations_users', alias: 'organizations'
          , mixin: [{ table: 'organizations' }]
          }
        ]
      }
    , { table: 'restaurants', alias: 'restaurant' }
    ]
  };

  db.orders.findOne( id, options, callback );
};

module.exports.createFromOrderId = function( id, callback ){
  module.exports.fetchOrder()
};