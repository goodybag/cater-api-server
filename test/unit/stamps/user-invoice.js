var assert      = require('assert');
var config      = require('../../../config');
var db          = require('../../../db');
var invoices    = require('stamps/user-invoice');

describe('Stamps', function(){
  describe('User Invoice', function(){
    describe('DB', function(){
      it ('.save() insert new record', function( done ){
        var invoice = invoices.db.create({
          user_id: 1
        , billing_period_start: '2015-01-01'
        , billing_period_end: '2015-01-15'
        });

        invoice.save( function( error ){
          if ( error ) return done( error );

          assert( invoice.id );

          done();
        });
      });

      it ('.save() update existing record', function( done ){
        var doc = {
          user_id: 1
        , billing_period_start: '2015-01-01'
        , billing_period_end: '2015-01-15'
        };

        db.user_invoices.insert( doc, function( error, result ){
          if ( error ) return done( error );

          var invoice = invoices.db.create( result[0] );

          invoice.billing_period_start = '2015-01-15';
          invoice.billing_period_end = '2015-02-01';

          invoice.save( function( error ){
            if ( error ) return done( error );

            db.user_invoices.findOne( invoice.id, function( error, record ){
              if ( error ) return done( error );

              assert.equal( record.billing_period_start, invoice.billing_period_start );
              assert.equal( record.billing_period_end, invoice.billing_period_end );

              done();
            });
          });
        });
      });
    });
  });
});