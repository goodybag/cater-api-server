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

  it('.sendError should handle Error instances', function(done) {
    var res = {
      status: function(httpCode) { assert.equal(httpCode, 500); }
    , header: function() {}
    , json: function(resp) {
        assert(resp && resp.error);
        assert.equal(resp.error.code, '0701');
        assert.equal(resp.error.message, 'poop');
        done();
      }
    };

    utils.sendError(res, new Error('poop'));
  });

  describe('dateTimeFormatter2', function () {
    var time = { h: 0, m: 0, s: 0 };
    var today = moment(time);
    var tomorrow = moment(time).add(1, 'day');

    [
      ['2015-07-20 00:00:00', '', '2015-07-20']
    , ['2015-07-20 00:00:00', 'MM/DD/YYYY', '07/20/2015']
    , ['2015-07-20 00:00:00', 'R [at] h:mm a', '07/20/2015 at 12:00 am']
    , [today.format(), 'R [at] h:mm a', 'Today at 12:00 am']
    , [tomorrow.format(), 'R [at] h:mm a', 'Tomorrow at 12:00 am']
    ].forEach(function (testCase) {
      var caseName = '.dateTimeFormatter2( :1, :2 ) should be :3'
        .replace( ':1', testCase[0] )
        .replace( ':2', testCase[1] )
        .replace( ':3', testCase[2] )

      it(caseName, function () {
        assert.equal(utils.dateTimeFormatter2(testCase[0], testCase[1]), testCase[2]);
      });
    });


  });
});
