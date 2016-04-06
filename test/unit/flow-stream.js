'use strict';

var assert = require('assert');
var Stream = require('stream');
var FlowStream = require('../../lib/flow-stream');

class TestStream extends Stream.Readable {
  _read(){}
}

describe('FlowStream', function(){
  it('.map()', function( done ){
    var objs = [
      { foo: 'bar' }
    , { foo: 'foo' }
    , { foo: 'waff' }
    , { foo: 'stack' }
    ];

    var s = new TestStream({ objectMode: true });
    var numIterations = 0;

    new FlowStream( s, { concurrency: 1 })
      .map( ( obj, done )=>{
        setTimeout( ()=>{
          done( null, {
            foo: obj.foo + ' foo'
          })
        }, 10 );
      })
      .forEach( ( obj )=>{
        assert.equal( obj.foo, objs[ numIterations ].foo + ' foo' );
        numIterations++;
      })
      .errors( ( error )=>{
        assert( !error );
      })
      .end( ()=>{
        assert.equal( numIterations, objs.length );
        done();
      });

      objs.forEach( ( obj, i ) => setTimeout( s.push.bind( s, obj ), i * 5 ) );
      setTimeout( s.push.bind( s, null ), objs.length * 5 );
  });

  it('.filter()', function( done ){
    var objs = [
      { foo: 'bar' }
    , { foo: 'foo' }
    , { foo: 'waff' }
    , { foo: 'stack' }
    ];

    var s = new TestStream({ objectMode: true });
    var numIterations = 0;

    new FlowStream( s, { concurrency: 1 })
      .filter( ( obj, done )=>{
        setTimeout( ()=>{
          done( null, [ 'foo', 'waff' ].indexOf( obj.foo ) > -1 )
        }, 10 );
      })
      .forEach( ( obj )=>{
        numIterations++;
        assert( [ 'foo', 'waff' ].indexOf( obj.foo ) > -1 );
      })
      .errors( ( error )=>{
        assert( !error );
      })
      .end( ()=>{
        assert.equal( numIterations, 2 );
        done();
      });

      objs.forEach( ( obj, i ) => setTimeout( s.push.bind( s, obj ), i * 5 ) );
      setTimeout( s.push.bind( s, null ), objs.length * 5 );
  });

  it('should handle concurrency > 1', function( done ){
    var objs = [
      { foo: 'bar' }
    , { foo: 'foo' }
    , { foo: 'waff' }
    , { foo: 'stack' }
    ];

    var s = new TestStream({ objectMode: true });
    var numIterations = 0;

    var flow = new FlowStream( s, { concurrency: 2 } )
      // Give enough time to have 2 workers at once
      .map( ( obj, next )=> setTimeout( next.bind( null, null, obj), 20 ) )
      .forEach( ( obj )=>{
        numIterations++;
        if ( numIterations < 4 ){
          assert.equal( flow.numWorkers, 2, 'numWorkers not 2 at ' + numIterations + ' iterations.' );
        }
      })
      .errors( ( error )=>{
        assert( !error );
      })
      .end( ()=>{
        assert.equal( numIterations, 4 );
        done();
      });

      objs.forEach( ( obj, i ) => setTimeout( s.push.bind( s, obj ), i * 5 ) );
      setTimeout( s.push.bind( s, null ), objs.length * 5 );
  });
});
