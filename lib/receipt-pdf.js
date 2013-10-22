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

if ( config.credentials ){
  page.customHeaders = {
    'authorization': [
      'Basic'
    , config.credentials.email
    , config.credentials.password
    ].join(' ')
  };
}

if ( config.zoomFactor ) page.zoomFactor = config.zoomFactor;

page.open( url, function( status ){
  if ( status !== 'success' ){
    console.log( JSON.stringify({
      error: {
        message: 'Could not open url `' + url + '`'
      }
    }));

    throw phantom.exit();
  }

  var isReady = false;
  var onComplete = function(){
    page.render( output );
    console.log( JSON.stringify({
      data: {
        output: output
      , url: url
      }
    }));

    phantom.exit();
  };

  var timeout = function(){
    if ( isReady ) return onComplete();

    isReady = page.evaluate( function(){
      return window.__page.isReady();
    });

    if ( isReady ) return onComplete();

    setTimeout( timeout, 500 );
  };

  timeout();
  // setTimeout( onComplete, 2000 );

  // page.onCallback = function( data ){
  //   page.render( output );
  //   console.log( JSON.stringify({
  //     data: {
  //       output: output
  //     , url: url
  //     }
  //   }));

  //   phantom.exit();
  // };
});