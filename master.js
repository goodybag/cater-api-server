var config = require('./config');
var forky = require('forky');
forky(__dirname + '/server');

if ( config.isDev ){
  require('./workers/scheduler');
}