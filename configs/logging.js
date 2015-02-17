var
  local = {}
, _ = require('lodash')
, fs = require('fs')
;

if (fs.existsSync('../local-config.json')){
  local = require('../local-config.json');
}

module.exports = {
  enabled: true
, transports: {
    console: true
  , rollbar: true
  }
, console: {
    json: true
  }
, mongoConnStr: local.loggingMongoConnStr || 'mongodb://localhost:1337/logs'
, mongoCollection: 'logs'
, httpPort: 3001
, url: 'http://localhost:3001'
};

var config = {
  dev: {
    enabled: true
  , transports: {
      console: true
    , rollbar: true
    }
  , console: {
      json: true
    }
  , mongoConnStr: local.loggingMongoConnStr || 'mongodb://localhost:1337/logs'
  , mongoCollection: 'logs'
  , httpPort: 3001
  }

, staging: {
    enabled: true
  , transports: {
      console: true
    , rollbar: true
    }
  , console: {
      json: true
    , raw: true
    }
  , mongoConnStr: process.env['MONGOHQ_URL']
  , mongoCollection: 'logs'
  , httpPort: 3001
  }

, production: {
    enabled: true
  , transports: {
      console: true
    , rollbar: true
    }
  , console: {
      json: true
    , raw: true
    }
  , mongoConnStr: process.env['MONGOHQ_URL']
  , mongoCollection: 'logs'
  , httpPort: 3001
  }
};

_.extend( module.exports, config[ process.env.GB_ENV || 'dev' ] );
