var assert  = require('assert');
var utils   = require('../../utils');

describe ('Utils', function(){
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
});