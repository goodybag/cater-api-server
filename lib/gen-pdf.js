/**
 * Uses some really janky message-passing since phantom doesn't want to support stderr
 */

var webpage = require('webpage');
var system  = require('system');
var config  = require('../pdf-config');
var url     = arg(['url', 'u']);
var output  = arg(['output', 'o']);
var timeout = arg( ['timeout', 't'], 10000 )
var page    = webpage.create();
var creds   = {
  email:      arg( ['email', 'e'] )
, password:   arg( ['password', 'p'] )
};

config.paperSize.margin.top     = arg( 'margin-top', config.paperSize.margin.top );
config.paperSize.margin.right   = arg( 'margin-right', config.paperSize.margin.right );
config.paperSize.margin.bottom  = arg( 'margin-bottom', config.paperSize.margin.bottom );
config.paperSize.margin.left    = arg( 'margin-left', config.paperSize.margin.left );

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
if ( config.dpi ) page.settings.dpi = config.dpi;

page.onResourceReceived = function( resource ){
  if ( resource.status >= 300 || resource.status < 200 ){
    console.log( JSON.stringify({
      error: {
        message: 'Could not open url `' + url + '`'
      , httpStatus: resource.status
      , resource: resource
      }
    }));

    return phantom.exit();
  }
};

var onTimeout = function(){
  console.log( JSON.stringify({
    error: {
      message: 'Timeout'
    }
  }));

  return phantom.exit();
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

  var readyCheckTimeout;
  var isReady = false;
  var onComplete = function(){
    clearTimeout( readyCheckTimeout );
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
      return window.__page && window.__page.isReady();
    });

    if ( isReady ) return onComplete();

    setTimeout( readyCheck, 500 );
  };

  readyCheckTimeout = setTimeout( onTimeout, timeout );
  readyCheck();
});
