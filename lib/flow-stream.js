'use strict';

class FlowStream {
  static create( stream, options ){
    return new FlowStream( stream, options );
  }

  constructor( stream, options ){
    options = options || {};

    var defaults = {
      concurrency: 1
    };

    for ( var k in defaults ){
      if ( !( k in options ) ) options[ k ] = defaults[ k ];
    }

    for ( k in options ){
      this[ k ] = options[ k ];
    }

    this.stream = stream;
    this.numWorkers = 0;
    this.actions = []
    this.errorHandlers = [];
    this.endHandlers = [];

    this.registerListeners();
  }

  registerListeners(){
    this.stream.on( 'data', this.onObject.bind( this ) );
    this.stream.on( 'end', this.callEndHandlersIfNecessary.bind( this ) );
  }

  streamHasEnded(){
    return this.stream._readableState.ended;
  }

  map( callback ){
    this.actions.push( new FlowStreamActionMap( callback ) );
    return this;
  }

  filter( callback ){
    this.actions.push( new FlowStreamActionFilter( callback ) );
    return this;
  }

  forEach( callback ){
    this.actions.push( new FlowStreamActionIterate( callback ) );
    return this;
  }

  end( callback ){
    this.endHandlers.push( callback );
    return this;
  }

  errors( callback ){
    this.errorHandlers.push( callback );
    return this;
  }

  processActions( obj, callback, actionIdx ){
    if ( !actionIdx ) actionIdx = 0;

    var action = this.actions[ actionIdx ];

    if ( !action || obj instanceof FlowStreamObjectFiltered ){
      return callback( null, obj );
    }

    action.handler( obj, ( error, result )=>{
      if ( error ){
        return callback( error );
      }

      this.processActions( result, callback, ++actionIdx );
    });
  }

  callEndHandlersIfNecessary(){
    // console.trace('callEndHandlersIfNecessary()', this.streamHasEnded(), this.numWorkers);
    if ( this.endHandlersCalled ) return;
    if ( this.streamHasEnded() && this.numWorkers === 0 ){
      this.endHandlers.forEach( handler => handler() );
      this.endHandlersCalled = true;
    }
  }

  callErrorHandlers( error ){
    this.errorHandlers.forEach( handler => handler( error ) );
  }

  onObject( obj ){
    this.numWorkers++;

    if ( this.numWorkers >= this.concurrency ){
      this.stream.pause();
    }

    this.processActions( obj, ( error, result )=>{
      if ( error ){
        this.callErrorHandlers( error );
      }

      this.numWorkers--;

      if ( this.stream.isPaused() && this.numWorkers < this.concurrency ){
        this.stream.resume();
      }

      process.nextTick( ()=> this.callEndHandlersIfNecessary() );
    });
  }
}

class FlowStreamActionMap {
  constructor( userHandler ){
    this.userHandler = userHandler;
  }

  handler( obj, next ){
    this.userHandler( obj, next );
  }
}

class FlowStreamActionFilter {
  constructor( userHandler ){
    this.userHandler = userHandler;
  }

  handler( obj, next ){
    this.userHandler( obj, function( error, shouldStayInStream ){
      if ( error ){
        return next( error );
      }

      if ( shouldStayInStream ){
        return next( null, obj );
      }

      return next( null, new FlowStreamObjectFiltered() );
    });
  }
}

class FlowStreamActionIterate {
  constructor( userHandler ){
    this.userHandler = userHandler;
  }

  handler( obj, next ){
    this.userHandler( obj );
    next( null, obj );
  }
}

class FlowStreamObjectFiltered {}

module.exports = FlowStream;
