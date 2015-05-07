var assert          = require('assert');
var config          = require('../../../config');
var errors          = require('../../../errors');
var notifications   = require('../../../lib/order-notifications2')
var app             = require('../../../app');
var events          = require('events');

var venter = new events.EventEmitter;

var oldRender = app.render;

var overrideRender = function( returns ){
  app.render = function( template, context, callback ){
    return callback( null, returns );
  };
};

after( function(){
  app.render = oldRender;
});

describe('Order Notifications', function(){
  describe('Email', function(){
    it('Should create a notification-compatible object', function(){
      var emailNote = notifications.email({
        template: 'test'

      , to: function( order ){
          return order.to;
        }

      , from: function( order ){
          return order.from;
        }

      , subject: function( order ){
          return order.subject;
        }
      });

      assert.equal( typeof emailNote.build, 'function' );
      assert.equal( typeof emailNote.send, 'function' );

      var order = {
        to: 'bill@bob.com'
      , from: 'bob@bill.com'
      , subject: 'Bill Bob'
      };

      overrideRender('Test preview');
      emailNote.build( order, {}, function( error, result ){
        assert( !error );

        assert( result.html, 'Test preview' );
      });
    });
  });
});