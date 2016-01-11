var logger = require('../../../../../lib/logger');
var db = require('../../../../../db');
var utils = require('../../../../../utils');
var scheduler = require('../../../../../lib/scheduler');
var Collaborator = require('./collaborator');
var LoggerMixin = require('../../../../../lib/stampit-logger');

module.exports = require('stampit')()
  .compose( require('./collaboration') )
  .compose( LoggerMixin('OrderCollaboration') )
  .state({
    processingLimit: 5
  , fromEmail: 'orders@goodybag.com'
  })
  .methods({
    save: function( callback ){
      var errors = this.validate();

      if ( errors.length ){
        return callback( errors );
      }

      if ( !this.order ){
        this.logger.debug('No order, fetching order #' + this.order_id);

        return this.fetchOrder( function( error ){
          if ( error ){
            return callback( error );
          }

          this.save( callback );
        }.bind( this ));
      }

      var onEmail = ( email, done )=>{
        Collaborator
          .create({ email: email, order: this.order, logger: this.logger })
          .save( ( error, collaborator )=>{
            if ( error ){
              return done( error );
            }

            utils.sendMail2({
              to: email
            , from: this.fromEmail
            , subject: this.subject || this.defaultSubject()
            , html: this.message || this.defaultMessage()
            }, done );
          });
      };

      utils.async.eachLimit( this.collaborators, this.processingLimit, onEmail, function( error ){
        if ( error ){
          return callback( error );
        }

        callback();
      });

      return this;
    }

  , fetchOrder: function( callback ){
      module.exports.fetchOrder( this.order_id, function( error, result ){
        if ( error ){
          return callback( error );
        }

        this.order = result;

        return callback( null, this );
      }.bind( this ));

      return this;
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
    , { table: 'organizations', alias: 'organization' }
    ]
  };

  db.orders.findOne( id, options, callback );
};

module.exports.createFromOrderId = function( id, callback ){
  module.exports.fetchOrder()
};