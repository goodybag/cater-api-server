var forky = require('forky');
var config = require('./config');
forky(__dirname + '/server');

if ( config.isDev ){
  require('./workers/scheduler');
}