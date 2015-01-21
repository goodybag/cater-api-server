var assert  = require('assert');
var utils   = require('../../utils');
var moment  = require('moment-timezone');

describe.only ('Utils', function(){
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
