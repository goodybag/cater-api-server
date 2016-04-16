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
    this.asyncErrorHandlers = [];
    this.endHandlers = [];
    this.processingAsyncErrorHandlers = false;
    this.numRunningAsyncErrorHandlers = 0;
    this.onNumRunningAsyncErrorHandlersEqualsZero = ()=>{};

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

  mapAsync( callback ){
    this.actions.push( new FlowStreamActionMapAsync( callback ) );
    return this;
  }

  filter( callback ){
    this.actions.push( new FlowStreamActionFilter( callback ) );
    return this;
  }

  filterAsync( callback ){
    this.actions.push( new FlowStreamActionFilterAsync( callback ) );
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

  errorsAsync( callback ){
    this.asyncErrorHandlers.push( callback );
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
    if ( this.endHandlersCalled ) return;
    if ( this.streamHasEnded() && this.numWorkers === 0 ){
      if ( this.numRunningAsyncErrorHandlers > 0 ){
        return this.onNumRunningAsyncErrorHandlersEqualsZero = ()=>{
          this.callEndHandlersIfNecessary();
        };
      }

      this.endHandlers.forEach( handler => handler() );
      this.endHandlersCalled = true;
    }
  }

  callErrorHandlers( error ){
    this.errorHandlers.forEach( handler => handler( error ) );

    if ( this.asyncErrorHandlers.length > 0 ){
      let onErrorHandler = ()=>{
        if ( --this.numRunningAsyncErrorHandlers === 0 ){
          this.onNumRunningAsyncErrorHandlersEqualsZero();
        }
      };

      this.numRunningAsyncErrorHandlers += this.asyncErrorHandlers.length;
      this.asyncErrorHandlers.forEach( fn => fn( error, onErrorHandler ) );
    }
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
    next( null, this.userHandler( obj ) );
  }
}

class FlowStreamActionMapAsync {
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
    var shouldStayInStream = this.userHandler( obj );

    if ( shouldStayInStream ){
      return next( null, obj );
    }

    return next( null, new FlowStreamObjectFiltered() );
  }
}

class FlowStreamActionFilterAsync {
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
