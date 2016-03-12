'use strict'

var Stream = require('stream');
var db = require('../../db');
var utils = require('../../utils');
var logger = require('../../lib/logger');

class InitialOrderRevisionsCreator {
  static create( options ){
    return new InitialOrderRevisionsCreator( options );
  }

  constructor( options ){
    utils.extend( this, utils.defaults( options || {}, {
      concurrency: 5
      // This value ensures that we'll only ever track
      // concurrency * maxLengthMultiplier objects in memory
    , maxLengthMultiplier: 2
      // Just return dummy writable stream
    , progress: (function(){
        var s = new Stream.Writable();
        s._write = function(){};
        return s;
      })()
    , logger: logger
    }));

    this.logger = options.logger.create('InitialOrderRevisionsCreator');

    this.maxLengthBeforePausing = this.concurrency * this.maxLengthMultiplier;

    this.queue = utils.async.queue( ( order, done )=>{
      this.onOrder( order, ( error )=>{
        done( error );
        this.checkIfStreamShouldPauseOrResume();
      });
    }, this.concurrency );

    this.stats = {
      errors: []
    , completed: 0
    };
  }

  process( callback ){
    if ( this.stream ){
      throw new Error('Cannot process while already in progress');
    }

    this.getStream( ( error, stream )=>{
      if ( error ){
        callback( error );
      }

      this.stream = stream;

      stream.on( 'data', ( order )=>{
        this.checkIfStreamShouldPauseOrResume();
        this.queue.push( order );
      });

      stream.on( 'end', ()=>{
        delete this.stream;

        if ( this.queue.running() === 0 ){
          return callback( null, this.stats );
        }

        this.queue.drain = ()=>{
          callback( null, this.stats );
        };
      });
    });
  }

  getStream( callback ){
    var where = {
      'order_revisions.id': { $null: true }
    };

    var options = {
      limit: 'all'
    , joins:  [ { type: 'left', target: 'order_revisions'
                , on: { order_id: '$orders.id$' }
                }
              ]
    };

    db.orders.findStream( where, options, callback );
  }

  checkIfStreamShouldPauseOrResume(){
    if ( this.queue.length() >= this.maxLengthBeforePausing ){
      if ( !this.stream.isPaused() ){
        this.stream.pause();
      }
    } else if ( this.stream && this.stream.isPaused() ) {
      this.stream.resume();
    }
  }

  onOrder( order, callback ){
    db.order_revisions.track( order.id, null, 'create', ( error )=>{
      if ( error ){
        this.stats.errors.push({
          order_id: order.id
        , error: error
        });

        this.progress.write('x');
      } else {
        this.stats.completed++;
        this.progress.write('✓');
      }

      callback();
    });
  }
}

module.exports = InitialOrderRevisionsCreator;