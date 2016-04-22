var assert          = require('assert');
var config          = require('../../../config');
var errors          = require('../../../errors');
var utils           = require('../../../utils');
var notifications   = require('../../../lib/order-notifications2');
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

var oldSendRawEmail = utils.sendRawEmail;

before( function(){
  utils.sendRawEmail = function( from, to, text, callback ){
    return callback( null, from, to, text );
  };
});

after( function(){
  utils.sendRawEmail = oldSendRawEmail;
});

describe('Order Notifications', function(){
  describe('Base', function(){
    it('Should be a valid order object', function(){
      var notes = notifications.notification({
        id: 'a'
      , name: 'a'
      , build: function(){}
      , send: function(){}
      });

      var order = orders();

      var note = notes.create( order, 1 );

      assert( note.isValidOrder() );
    });

    it('Should NOT be a valid order object', function(){
      var notes = notifications.notification({
        id: 'a'
      , name: 'a'
      , build: function(){}
      , send: function(){}
      });

      var order = orders()
        .remove('deliveryService');

      var note = notes.create( order, 1 );

      assert( !note.isValidOrder() );
    });

    it('Should throw an error because the notification is missing required options', function(){
      var notes = notifications.notification({
        id: 'a'
      , name: 'a'
      , requiredOptions: ['optA']
      , build: function(){}
      , send: function(){}
      });

      var order = orders();

      assert.throws( function(){
        var note = notes.create( order, {} );
      });
    });
  });

  describe('Email', function(){
    var getRenderer = function( str ){
      return {
        render: function( tmpl, context, callback ){
          return callback( null, 'Test Preview');
        }
      }
    };

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

      , renderer: getRenderer('Test Preview')
      });

      assert.equal( typeof emailNote.build, 'function' );
      assert.equal( typeof emailNote.send, 'function' );

      var order = {
        to: 'bill@bob.com'
      , from: 'bob@bill.com'
      , subject: 'Bill Bob'
      };

      emailNote.build( order, {}, {}, function( error, result ){
        assert( !error );

        assert( result.html, 'Test preview' );
        assert( result.to, order.to );
        assert( result.from, order.from );
        assert( result.subject, order.subject );
      });
    });

    it('Should email', function( done ){
      var notes = notifications.notification(
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

        , renderer: getRenderer('Test Preview')
        })
      );

      var order = orders({
        to: 'bill@bob.com'
      , from: 'bob@bill.com'
      , subject: 'Bill Bob'
      });

      var note = notes.create( order, 1 );

      note.send( function( error, from, to, text ){
        assert( !error );
        assert.equal( to, order.to );
        assert.equal( from, order.from );
        assert( text.indexOf('Test Preview') > -1 );
        done();
      });
    });
  });

  describe('Dropoff Order Submitted', function(){
    var dropoffOrderSubmitted = require('../../../lib/order-notifications2/notifications/dropoff-order-submitted');

    it('.locationDropoff()', function(){
      var loc = {
        street:   '7901 Cameron Rd.'
      , street2:  'Building 2, #300'
      , city:     'Austin'
      , state:    'TX'
      , zip:      '78723'
      , lat_lng:  { x: '100', y: '50' }
      };

      assert.deepEqual( dropoffOrderSubmitted.locationDropoff( loc ), {
        address_line_1: '7901 Cameron Rd.'
      , address_line_2: 'Building 2, #300'
      , city:           'Austin'
      , state:          'TX'
      , zip:            '78723'
      , lat:            '100'
      , lng:            '50'
      , company_name:   'Goodybag'
      , first_name:     'Goodybag'
      , last_name:      'Goodybag'
      });
    });

    it('.orderDropoffDestination()', function(){
      var order = {
        street:   '7901 Cameron Rd.'
      , street2:  'Building 2, #300'
      , city:     'Austin'
      , state:    'TX'
      , zip:      '78723'
      , phone:    '1234567890'
      , lat_lng:  { x: 100, y: 50 }
      , guests:   10
      , user:     { email: 'test@test.com', organization: 'The Test Group', name: 'Turd Ferguson' }
      , notes:    'Food should be hot'
      , delivery_instructions: 'Knock once. NO! Knock twice.'
      };

      assert.deepEqual( dropoffOrderSubmitted.orderDropoffDestination( order ), {
        address_line_1: '7901 Cameron Rd.'
      , address_line_2: 'Building 2, #300'
      , city:           'Austin'
      , state:          'TX'
      , zip:            '78723'
      , lat:            '100'
      , lng:            '50'
      , phone:          '1234567890'
      , first_name:     'Turd'
      , last_name:      'Ferguson'
      , company_name:   'The Test Group'
      , remarks:        [ 'Notes:'
                        , 'Food should be hot\n'
                        , 'Delivery Instructions:'
                        , 'Knock once. NO! Knock twice.'
                        ].join('\n')
      });
    });

    it('.orderDropoffOrigin()', function(){
      var order = {
        id: 1234
      , restaurant_location_id: 2
      , notes: 'Food should be hot'
      , guests: 10
      , restaurant: {
          name: 'The Test Restaurant'
        }
      , location: {
          id:       2
        , street:   '7901 Cameron Rd.'
        , city:     'Austin'
        , state:    'TX'
        , zip:      '78723'
        , phone:    '1234567890'
        , lat_lng:  { x: 100, y: 50 }
        }
      };

      assert.deepEqual( dropoffOrderSubmitted.orderDropoffOrigin( order ), {
        address_line_1: '7901 Cameron Rd.'
      , city:           'Austin'
      , state:          'TX'
      , zip:            '78723'
      , lat:            '100'
      , lng:            '50'
      , phone:          config.phone.orders
      , first_name:     'Goodybag'
      , last_name:      '#' + order.id
      , email:          config.emails.couriers
      , company_name:   'The Test Restaurant'
      , remarks:        [ 'Head Count:'
                        , order.guests + '\n'
                        , 'Notes:'
                        , 'Food should be hot'
                        ].join('\n')
      });
    });

    it('.orderDropoffDetails()', function(){
      var order = {
        id: 1000
      , datetime: '2015-01-01 12:30:00'
      , timezone: 'America/Chicago'
      , region: { lead_time_modifier: '00:30:00' }
      };

      var est = {
        success : true
      , timestamp: '2015-03-05T14:51:14+00:00'
      , data : {
          ETA: '243.1'
        , Distance: '0.62'
        , From: '78701'
        , To: '78701'
        , asap: {
            Price: '19.00'
          , ETA: '243.1'
          , Distance: '0.62'
          }
        , two_hr: {
            Price: '17.00'
          , ETA: '243.1'
          , Distance: '0.62'
          }
        , four_hr: {
            Price: '15.00'
          , ETA: '243.1'
          , Distance: '0.62'
          }
        , after_hr: {
            Price: '21.00'
          , ETA: '243.1'
          , Distance: '0.62'
          }
        , holiday: {
            Price: '31.00'
          , ETA: '243.1'
          , Distance: '0.62'
          }
        }
      };

      assert.deepEqual( dropoffOrderSubmitted.orderDropoffDetails( order, est ), {
        quantity:       1
      , weight:         1
      , eta:            '243.1'
      , distance:       '0.62'
      , price:          '19.00'
      , type:           'asap'
      , reference_code: '1000'
      , ready_date:     1420135200
      });
    });
  });
});
