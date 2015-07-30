var localConfig = require('./local-config');

var config = {
  baseUrl: 'http://localhost:3001'
};

for ( var key in localConfig ){
  config[ key ] = localConfig[ key ];
}

module.exports = config;
