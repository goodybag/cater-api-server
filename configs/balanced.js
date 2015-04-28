var fs = require('fs');
var _  = require('lodash');

var local = {};

if ( fs.existsSync('./balanced.local.js') ){
  local = require('./balanced.local');
}

module.exports = ({
  'staging': {
    secret: "ak-test-PuuQnMAqL7pNQ0t9xuMDV3upU2Pz5sLn"
  , marketplaceUri: "/v1/marketplaces/TEST-MP3gr1uHmPi0i42cNhdL4rEs"
  }

, 'production': {
    secret: "ak-prod-OmLnG7ftnzB145uM4Ycu4YIE0mgPx4eE"
  , marketplaceUri: "/v1/marketplaces/MPwgAAAdaGmk4BhrmL0qkRM"
  }

, 'dev': {
    secret: "ak-test-2G892W7NuiD6qupYcICGSckp457NQDPoO"
  , marketplaceUri: "/v1/marketplaces/TEST-MP5E2WUxpmSwL432vw6CoWNv"
  }
})[ process.env.GB_ENV ] || module.exports.dev;

_.extend( module.exports, local );