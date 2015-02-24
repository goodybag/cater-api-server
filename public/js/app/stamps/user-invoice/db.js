var db    = require('db');
var utils = require('utils');

module.exports = require('stampit')()
  .methods({
    save: function( callback ){
      if ( this.id ){
        db.user_invoices.update( this.id, this, { returning: ['*'] }, function( error, results ){
          if ( error ) return callback( error );

          this.parseResults( results );

          callback();
        }.bind( this ));
      } else {
        db.user_invoices.insert( this, function( error, results ){
          if ( error ) return callback( error );

          this.parseResults( results );

          callback();
        }.bind( this ));
      }

      return this;
    }

  , parseResults: function( results ){
      results = results[0] || results;
      utils.extend( this, results );
    }
  });