var
  local = {}
, _ = require('lodash')
, fs = require('fs')
;

if (fs.existsSync('./local-config.json')){
  local = require('../local-config.json');
}

module.exports = {
  enabled: true
, transports: {
    console: true
  , rollbar: true
  , mongo:   true
  , loggly:  true
  }
, console: {
    json: true
  }
, mongoConnStr: local.loggingMongoConnStr || process.env['MONGOHQ_URL'] || 'mongodb://localhost:1337/logs'
, mongoCollection: 'logs'
, httpPort: 3001
, url: 'http://localhost:3001'
};

var config = {
  dev: {
  }

, staging: {
  }

, production: {
  }
};

_.extend( module.exports, config[ process.env.GB_ENV || 'dev' ] );
