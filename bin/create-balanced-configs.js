#!/usr/bin/env node

var fs = require('fs');
var Balanced = require('balanced-official');

var tmpl = function( data ){
  return 'module.exports = :config;'
    .replace( ':config', JSON.stringify( data, true, '  ' ) );
};

Balanced.MakeTestMarket(function (error, credentials) {
  if (error) return console.error('unable to create market place');
  var config = {
    secret: credentials.secret
  , marketplaceUri: credentials.marketplace_uri
  };
  fs.writeFileSync( tmpl( config ) );
});
