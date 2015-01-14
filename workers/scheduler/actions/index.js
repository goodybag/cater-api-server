var fs = require('fs');
var path = require('path');
var scheduler = require('../../../lib/scheduler');
var actions = [];

fs.readdirSync( __dirname ).filter( function( f ){
  return fs.statSync( path.join( __dirname, f ) ).isFile();
}).filter( function( f ){
  return f.slice(-3) === '.js' && f !== 'index.js';
}).forEach( function( f ){
  var action = require( path.join( __dirname, f ) );
  scheduler.registerAction(action.name, action.fn);
  actions.push(action);
});

module.exports = actions;
