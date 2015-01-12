var fs      = require('fs');
var path    = require('path');
var logger  = require('./logger').create('Events');
var venter  = require('./venter');

/**
 * Registers an event defined in obj onto venter.on( key )
 * Waits until nextTick
 * @param  {Object} obj The events object to read from
 * @param  {String} key The event name
 */
var registerEvent = function( obj, key ){
  venter.on( key, function(){
    var args = arguments;
    var _logger = logger.create( key, {
      data: { args: args }
    });
    process.nextTick( function(){
      obj[ key ].apply({ venter: venter, logger: _logger }, args );
    });
  });
};

var registerEventGroup = function( group ){
  Object.keys( group ).forEach( registerEvent.bind( null, group ) );
};

// Register all of events
var eventsPath = path.join( __dirname, 'events' );
fs.readdirSync( eventsPath ).map( function( p ){
  return path.join( eventsPath, p );
}).filter( function( p ){
  return fs.statSync( p ).isFile() && p.slice(-3) === '.js';
}).forEach( function( p ){
  registerEventGroup( require( p ) );
});