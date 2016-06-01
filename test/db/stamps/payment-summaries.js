var async       = require('async');
var assert      = require('assert');
var config      = require('../../../config');
var db          = require('../../../db');
var PMS         = require('stamps/payment-summaries/db');

describe('Stamps', function(){
  describe('Payment Summaries', function(){
    describe('DB', function(){
      it('.fetch() by id', function( done ){
        const PERIOD_START = '2015-01-01';
        const PERIOD_END = '2015-01-15';
        const RESTAURANT_ID = 25;

        var doc = {
          restaurant_id: RESTAURANT_ID
        , period_begin: PERIOD_START
        , period_end: PERIOD_END
        };

        async.waterfall([
          // Insert the payment summaries object
          ( next )=>{
            db.payment_summaries.insert( doc, function( error, result ){
              if ( error ) return next( error );

              assert( result );

              next( null, result );
            });
          }

          // Delete orders in the test period
        , ( pms, next )=>{
            db.orders.update({
              datetime: {
                $gte: PERIOD_START
              , $lte: PERIOD_END + ' 23:59:59'
              }
            }, { status: 'canceled' }, error => next( error, pms ) );
          }

          // Insert some orders
        , ( pms, next )=>{
            var orders = [
              { restaurant_id: RESTAURANT_ID, status: 'accepted', datetime: '2015-01-01 12:00:00' }
            , { restaurant_id: RESTAURANT_ID, status: 'accepted', datetime: '2015-01-02 12:00:00' }
            , { restaurant_id: RESTAURANT_ID, status: 'accepted', datetime: '2015-01-03 12:00:00' }
            , { restaurant_id: RESTAURANT_ID, status: 'accepted', datetime: '2015-01-04 12:00:00' }
            , { restaurant_id: RESTAURANT_ID, status: 'accepted', datetime: '2015-01-05 12:00:00' }
            , { restaurant_id: RESTAURANT_ID, status: 'accepted', datetime: '2015-01-06 12:00:00' }
            ];

            db.orders.insert( orders, error => next( error, pms ) );
          }

        , ( pms, next )=>{
            PMS
              .create({ id: pms.id })
              .fetch( ( error, result )=>{
                if ( error ){
                  return next( error );
                }

                assert.equal( result.orders.length, 6 );

                next();
              });
          }
        ], ( error )=>{
          if ( error ){
            throw error;
          }

          done();
        });
      });

      it('.fetch() by restaurant/period', function( done ){
        const PERIOD_START = '2015-01-01';
        const PERIOD_END = '2015-01-15';
        const RESTAURANT_ID = 31;

        var pms = PMS.create({
          restaurant_id: RESTAURANT_ID
        , period_begin: PERIOD_START
        , period_end: PERIOD_END
        });

        async.waterfall([
          // Delete orders in the test period
          ( next )=>{
            db.orders.update({
              datetime: {
                $gte: PERIOD_START
              , $lte: PERIOD_END + ' 23:59:59'
              }
            }, { status: 'canceled' }, error => next( error, pms ) );
          }

          // Insert some orders
        , ( pms, next )=>{
            var orders = [
              { restaurant_id: RESTAURANT_ID, status: 'accepted', datetime: '2015-01-01 12:00:00' }
            , { restaurant_id: RESTAURANT_ID, status: 'accepted', datetime: '2015-01-02 12:00:00' }
            , { restaurant_id: RESTAURANT_ID, status: 'accepted', datetime: '2015-01-03 12:00:00' }
            , { restaurant_id: RESTAURANT_ID, status: 'accepted', datetime: '2015-01-04 12:00:00' }
            , { restaurant_id: RESTAURANT_ID, status: 'accepted', datetime: '2015-01-05 12:00:00' }
            , { restaurant_id: RESTAURANT_ID, status: 'accepted', datetime: '2015-01-06 12:00:00' }
            ];

            db.orders.insert( orders, error => next( error, pms ) );
          }

        , ( pms, next )=>{
            PMS
              .create( pms )
              .fetch( ( error, result )=>{
                if ( error && error.name !== 'NOT_FOUND' ){
                  return next( error );
                }

                assert.equal( result.orders.length, 6 );

                next();
              });
          }
        ], ( error )=>{
          if ( error ){
            throw error;
          }

          done();
        });
      });
    });
  });
});
