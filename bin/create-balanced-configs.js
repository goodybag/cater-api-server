#!/usr/bin/env node

var fs = require('fs');
var Balanced = require('balanced-official');

Balanced.MakeTestMarket(function (error, credentials) {
  if (error) return console.error('unable to create market place');
  var config = {
    secret: credentials.secret
  , marketplaceUri: credentials.marketplace_uri
  };
  fs.writeFileSync('balanced-config.json', JSON.stringify(config));
});
