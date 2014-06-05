var assert  = require('assert');
var moment  = require('moment-timezone');
var utils   = require('../../utils');
var db      = require('../../db');
var Models  = require('../../models');

describe ('models.Restaurant', function(){
  it ('models.Restaurant.find()', function( done ){
    this.expected = 106;

    Models.Restaurant.find( { limit: 100 }, function( error, orders ){
      assert( !error, error );
      done();
    });
  });

  it ('models.Restaurant.findOne(:id)', function( done ){
    this.expected = 18;

    Models.Restaurant.findOne( 31, function( error, result ){
      assert( !error, error );
      assert( result instanceof Models.Restaurant );
      done();
    });
  });

  // There's a weird PG optimization going on causing the second findOne
  // to run basically instantly
  // it ('models.Order.findOne(:id).getOrderItems()', function( done ){
  //   this.expected = 300;

  //   Models.Order.findOne( 1199, function( error, order ){
  //     assert( !error, error );
  //     assert( order instanceof Models.Order );

  //     order.getOrderItems( function( error, items ){
  //       done();
  //     });
  //   });
  // });
});