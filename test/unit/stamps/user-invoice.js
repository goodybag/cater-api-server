var assert      = require('assert');
var config      = require('../../../config');
var db          = require('../../../db');
var invoices    = require('stamps/user-invoice');

describe('Stamps', function(){
  describe('User Invoice', function(){
    describe('Base', function(){
      it ('.total()', function(){
        var invoice = invoices.create({
          orders: [{ total: 1 }, { total: 2 }, { total: 3 }]
        });

        assert.equal( invoice.total(), 6 );
        assert.equal( invoice.total().pennies(), 6 );
        assert.equal( invoice.total().dollars(), '0.06' );
      });
    });

    describe('DB', function(){
      it ('.save() insert new record', function( done ){
        var invoice = invoices.db.create({
          user_id: 1
        , billing_period_start: '2015-01-01'
        , billing_period_end: '2015-01-15'
        });

        console.log('invoice.save');
        invoice.save( function( error ){
          if ( error ) return done( error );

          assert( invoice.id );

          done();
        });
      });

      it ('.save() update existing record', function( done ){
        var doc = {
          user_id: 1
        , billing_period_start: new Date('2015-01-01')
        , billing_period_end: new Date('2015-01-15')
        };

        db.user_invoices.insert( doc, function( error, result ){
          if ( error ) return done( error );

          var invoice = invoices.db.create( result[0] );

          invoice.billing_period_start = new Date('2015-01-15');
          invoice.billing_period_end = new Date('2015-02-01');

          invoice.save( function( error ){
            if ( error ) return done( error );

            db.user_invoices.findOne( invoice.id, function( error, record ){
              if ( error ) return done( error );

              assert.equal( record.billing_period_start.toString(), invoice.billing_period_start.toString() );
              assert.equal( record.billing_period_end.toString(), invoice.billing_period_end.toString() );

              done();
            });
          });
        });
      });

      it ('.fetch() by id', function( done ){
        var doc = {
          user_id: 1
        , billing_period_start: new Date('2015-01-01')
        , billing_period_end: new Date('2015-01-15')
        };

        db.user_invoices.insert( doc, function( error, result ){
          if ( error ) return done( error );

          var invoice = invoices.db.create({ id: result[0].id });

          invoice.fetch( function( error ){
            if ( error ) return done( error );

            assert.equal( invoice.id, result[0].id );
            assert.equal( invoice.billing_period_start.toString(), result[0].billing_period_start.toString() );
            assert.equal( invoice.billing_period_end.toString(), result[0].billing_period_end.toString() );

            done();
          });
        });
      });

      it ('.fetch() by user/billing_period', function( done ){
        var doc = {
          user_id: 1
        , billing_period_start: new Date('2015-01-01')
        , billing_period_end: new Date('2015-01-15')
        };

        db.user_invoices.insert( doc, function( error, result ){
          if ( error ) return done( error );

          var invoice = invoices.db.create( doc );

          invoice.fetch( function( error ){
            if ( error ) return done( error );

            assert.equal( invoice.id, result[0].id );
            assert.equal( invoice.billing_period_start.toString(), result[0].billing_period_start.toString() );
            assert.equal( invoice.billing_period_end.toString(), result[0].billing_period_end.toString() );

            done();
          });
        });
      });
    });
  });
});