var config = require('../config');
var Hipchat = require('node-hipchat');

var hc = new Hipchat(config.hipchat.api_key);
module.exports = hc;
