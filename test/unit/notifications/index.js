var assert          = require('assert');
var config          = require('../../../config');
var errors          = require('../../../errors');
var utils           = require('../../../utils');
var notifications   = require('../../../lib/order-notifications2');
var app             = require('../../../app');
var events          = require('events');

var venter = new events.EventEmitter;

var orders = require('stampit')()
  .state({
    restaurant: { contacts: [] }
  , user: {}
  , deliveryService: {}
  , orderItems: []
  , region: {}
  , location: {}
  })
  .methods({
    remove: function( field ){
      delete this[ field ];
      return this;
    }
  })

var oldRender = app.render;
var oldSendRawEmail = utils.sendRawEmail;

var overrideRender = function( returns ){
  app.render = function( template, context, callback ){
    return callback( null, returns );
  };
};

utils.sendRawEmail = function( from, to, text, callback ){
  return callback( null, from, to, text );
};

after( function(){
  app.render = oldRender;
  utils.sendRawEmail = oldSendRawEmail;
});

describe('Order Notifications', function(){
  describe('Base', function(){
    it('Should be a valid order object', function(){
      var notes = notifications.definition({
        id: 'a'
      , name: 'a'
      , build: function(){}
      , send: function(){}
      });

      var order = orders();

      var note = notes( order );

      assert( note.isValidOrder() );
    });

    it('Should NOT be a valid order object', function(){
      var notes = notifications.definition({
        id: 'a'
      , name: 'a'
      , build: function(){}
      , send: function(){}
      });

      var order = orders()
        .remove('deliveryService');

      var note = notes( order );

      assert( !note.isValidOrder() );
    });

    it('Should throw an error because the notification is missing required options', function(){
      var notes = notifications.definition({
        id: 'a'
      , name: 'a'
      , requiredOptions: ['optA']
      , build: function(){}
      , send: function(){}
      });

      var order = orders();

      assert.throws( function(){
        var note = notes( order, {} );
      });
    });
  });

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
      emailNote.build( order, {}, {}, function( error, result ){
        assert( !error );

        assert( result.html, 'Test preview' );
        assert( result.to, order.to );
        assert( result.from, order.from );
        assert( result.subject, order.subject );
      });
    });

    it('Should email', function( done ){
      var notes = notifications.definition(
        notifications.email({
          id: 'a'
        , name: 'a'

        , template: 'test'

        , to: function( order ){
            return order.to;
          }

        , from: function( order ){
            return order.from;
          }

        , subject: function( order ){
            return order.subject;
          }
        })
      );

      var order = orders({
        to: 'bill@bob.com'
      , from: 'bob@bill.com'
      , subject: 'Bill Bob'
      });

      var note = notes( order );

      overrideRender('Test preview');
      
      note.send( function( error, from, to, text ){
        assert( !error );

        assert.equal( to, order.to );
        assert.equal( from, order.from );
        assert( text.indexOf('Test preview') > -1 );
        done();
      });
    });
  });
});