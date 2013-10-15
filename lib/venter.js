var events  = require('events');
var util = require('util');
var Venter = function(){};

util.inherits(Venter, events.EventEmitter);

module.exports = new Venter();