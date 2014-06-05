var assert  = require('assert');
var moment  = require('moment-timezone');
var utils   = require('../../utils');
var db      = require('../../db');
var Models  = require('../../models');

describe ('models.Order', function(){
  it ('models.Order.find()', function( done ){
    this.expected = 1800;

    Models.Order.find( { limit: 100 }, function( error, orders ){
      assert( !error, error );
      done();
    });
  });

  it ('models.Order.findOne(:id)', function( done ){
    this.expected = 150;

    Models.Order.findOne( 1198, function( error, order ){
      assert( !error, error );
      assert( order instanceof Models.Order );
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