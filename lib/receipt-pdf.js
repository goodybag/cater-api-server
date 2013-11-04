/**
 * Uses some really janky message-passing since phantom doesn't want to support stderr
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

  phantom.exit();
}

if ( !output ){
  console.log( JSON.stringify({
    error: {
      message: 'Must specify an output file as the second argument'
    }
  }));

  phantom.exit();
}

page.paperSize = config.paperSize;

if ( config.credentials ){
  page.customHeaders = {
    'authorization': [
      'Basic'
    , btoa( [ config.credentials.email, config.credentials.password ].join(':') )
    ].join(' ')
  };
}

if ( config.zoomFactor ) page.zoomFactor = config.zoomFactor;
if ( config.viewportSize ) page.viewportSize = config.viewportSize;

page.onResourceReceived = function( resource ){
  if ( resource.status >= 300 || resource.status < 200 ){
    console.log( JSON.stringify({
      error: {
        message: 'Could not open url `' + url + '`'
      , httpStatus: resource.status
      }
    }));

    return phantom.exit();
  }
};

page.open( url, function( status ){
  if ( status !== 'success' ){
    console.log( JSON.stringify({
      error: {
        message: 'Could not open url `' + url + '`'
      }
    }));

    return phantom.exit();
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

  var readyCheck = function(){
    isReady = page.evaluate( function(){
      return window.__page.isReady();
    });

    if ( isReady ) return onComplete();

    setTimeout( readyCheck, 500 );
  };

  readyCheck();
});