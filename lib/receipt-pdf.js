/**
 * Uses some really janky message-passing since phantom doesn't want to support stderr
 *
 * Note, phantom.exit is not stopping execution, so I put a throw in front.
 */

var webpage = require('webpage');
var system  = require('system');
var config  = require('../receipt-config');
var url     = system.args[1];
var output  = system.args[2];
var page    = webpage.create();

if ( !url ){
  console.log( JSON.stringify({
    error: {
      message: 'Must specify a url as the first argument'
    }
  }));

  throw phantom.exit();
}

if ( !output ){
  console.log( JSON.stringify({
    error: {
      message: 'Must specify an output file as the second argument'
    }
  }));

  throw phantom.exit();
}

page.paperSize = config.paperSize;

page.open( url, function( status ){
  if ( status !== 'success' ){
    console.log( JSON.stringify({
      error: {
        message: 'Could not open url `' + url + '`'
      }
    }));

    throw phantom.exit();
  }

  page.render( output );

  console.log( JSON.stringify({
    data: {
      output: output
    , url: url
    }
  }));

  phantom.exit();
});