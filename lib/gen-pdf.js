/**
 * Uses some really janky message-passing since phantom doesn't want to support stderr
 */

var webpage = require('webpage');
var system  = require('system');
var config  = require('../pdf-config');
var url     = arg(['url', 'u']);
var output  = arg(['output', 'o']);
var page    = webpage.create();
var creds   = {
  email:      arg( ['email', 'e'] )
, password:   arg( ['password', 'p'] )
};

function arg( options, fallback ){
  if ( !Array.isArray( options ) ) options = [ options ];

  var option, pos;

  do {
    option = options.pop();

    if ( option.length === 1 ) option = '-' + option;
    else option = '--' + option;

    pos = system.args.indexOf( option );
  } while ( options.length && pos === -1 );

  if ( pos === -1 ) return fallback;

  return system.args[ pos + 1 ];
}


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

page.customHeaders = {
  'authorization': [
    'Basic'
  , btoa( [ creds.email, creds.password ].join(':') )
  ].join(' ')
};

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