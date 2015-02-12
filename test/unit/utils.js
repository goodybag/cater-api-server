var assert  = require('assert');
var utils   = require('../../utils');
var moment  = require('moment-timezone');

describe ('Utils', function(){
  it('.search', function(){
    var list = [
      { id: 1, name: 'foo' }
    , { id: 2, name: 'bar' }
    , { id: 3, name: 'baz' }
    , { id: 4, name: 'foo' }
    , { id: 5, name: 'bar' }
    , { id: 6, name: 'baz' }
    ];

    var searchInput = 'foo';

    var fields = ['id', 'name'];

    var result = utils.search( list, searchInput, fields );

    assert.deepEqual( result, [
      { id: 1, name: 'foo' }
    , { id: 4, name: 'foo' }
    ]);
  });

  it('.search', function(){
    var list = [
      { id: 1, name: 'foo' }
    , { id: 2, name: 'bar' }
    , { id: 3, name: 'baz' }
    , { id: 4, name: 'foo' }
    , { id: 5, name: 'bar' }
    , { id: 6, name: 'baz' }
    ];

    var searchInput = 3;

    var fields = ['id', 'name'];

    var result = utils.search( list, searchInput, fields );

    assert.deepEqual( result, [
      { id: 3, name: 'baz' }
    ]);
  });

  it('.search', function(){
    var list = [
      { id: 1, name: 'Foo' }
    , { id: 2, name: 'Bar' }
    , { id: 3, name: 'Baz' }
    , { id: 4, name: 'Foo' }
    , { id: 5, name: 'Bar' }
    , { id: 6, name: 'Baz' }
    ];

    var searchInput = 'baz';

    var fields = ['id', 'name'];

    var result = utils.search( list, searchInput, fields );

    assert.deepEqual( result, [
      { id: 3, name: 'Baz' }
    , { id: 6, name: 'Baz' }
    ]);
  });

  it('.timeToRange', function(){
    var time    = '12:15 PM';
    var format  = 'hh:mm A';

    var options = {
      padding: 15
    , distribution: {
        before: [ 0, 1 ]
      , after:  [ 1, 1 ]
      }
    };

    var result = utils.timeToRange( time, format, options );

    assert.deepEqual( result, [ '12:15 PM', '12:30 PM' ] );

    time = '1:00 PM';
    result = utils.timeToRange( time, format, options );
    assert.deepEqual( result, [ '01:00 PM', '01:15 PM' ] );
  });

  it('.timeToRange', function(){
    var time    = '12:15 PM';
    var format  = 'hh:mm A';

    var options = {
      padding:    15
    , distribution: {
        before:   [ 1, 3 ]
      , after:    [ 2, 3 ]
      }
    };

    var result = utils.timeToRange( time, format, options );

    assert.deepEqual( result, [ '12:10 PM', '12:25 PM' ] );
  });

  it('.timeToRange', function(){
    var time    = '12:30 PM';
    var format  = 'hh:mm A';

    var options = {
      padding:    15
    , distribution: {
        before:   [ 1, 3 ]
      , after:    [ 2, 3 ]
      }
    };

    var result = utils.timeToRange( time, format, options );

    assert.deepEqual( result, [ '12:25 PM', '12:40 PM' ] );
  });

  it('.timeToRange', function(){
    var time    = '12:30 PM';
    var format  = 'hh:mm A';

    var options = {
      padding:    20
    , distribution: {
        before:   [ 1, 2 ]
      , after:    [ 1, 2 ]
      }
    };

    var result = utils.timeToRange( time, format, options );

    assert.deepEqual( result, [ '12:20 PM', '12:40 PM' ] );
  });


  it('.isAfterHours should handle edge cases', function() {
    var datetime;

    // ensure that business hours are [start, end)

    datetime = '2013-02-08 7:59';
    assert( utils.isAfterHours( moment(datetime) ) );

    datetime = '2013-02-08 8:00';
    assert( !utils.isAfterHours( moment(datetime) ) );

    datetime = '2013-02-08 8:01';
    assert( !utils.isAfterHours( moment(datetime) ) );

    datetime = '2013-02-08 17:59';
    assert( !utils.isAfterHours( moment(datetime) ) );

    datetime = '2013-02-08 18:00';
    assert( utils.isAfterHours( moment(datetime) ) );

    datetime = '2013-02-08 18:01';
    assert( utils.isAfterHours( moment(datetime) ) );
  });

  it('.isAfterHours should return true for late night times', function() {
    var datetime = '2013-02-08 20:30'; // 8:30pm
    var result = utils.isAfterHours( moment(datetime) );
    assert(result);
  });

  it('.isAfterHours should return false for day times', function() {
    var datetime = '2013-02-08 12:00'; // 12:00pm
    var result = !utils.isAfterHours( moment(datetime) );
    assert(result);
  });

  it('.duringBusinessHours should return true for business hours', function(){
    var datetime = '2013-02-08 12:00'; // 12:00pm
    var result = utils.duringBusinessHours( moment(datetime) );
    assert(result);
  });

  it('.duringBusinessHours should return false for hours outside biz hours', function() {
    var datetime = '2013-02-08 20:30'; // 8:30pm
    var result = !utils.duringBusinessHours( moment(datetime) );
    assert(result);
  });

  it('.isWeekend should return true for weekend', function() {
    var datetime = '2015-01-17 12:00';
    var result = utils.isWeekend( moment(datetime) );
    assert(result);
  });

  it('.isWeekend should return false for a weekday', function() {
    var datetime = '2015-01-15 12:00';
    var result = !utils.isWeekend( moment(datetime) );
    assert(result);
  });

  it('.isWeekday should return false for weekday', function() {
    var datetime = '2015-01-17 12:00';
    var result = !utils.isWeekday( moment(datetime) );
    assert(result);
  });

  it('.isWeekday should return true for a weekday', function() {
    var datetime = '2015-01-15 12:00';
    var result = utils.isWeekday( moment(datetime) );
    assert(result);
  });
});
