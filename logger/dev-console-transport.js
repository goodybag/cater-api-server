//a winston log transport for development
//so you can watch your logs without losing your mind

var util = require('util');
var winston = require('winston');

var DevLogger = module.exports = function() {
  this.level = process.env['NODE_LOG_LEVEL'] || 'info';
};

util.inherits(DevLogger, winston.Transport);

var fix = function(len, string, left) {
  string = string || '';
  while(string.length < len) {
    string += ' ';
  }
  if(string.length > len) {
    string = left ? string.slice(0, len) : string.slice(-len);
  }
  return string;
}

DevLogger.prototype.log = function(lvl, msg, meta, cb) {
  console.log(fix(5, lvl),
              fix(8, meta.component),
              fix(4, meta.method),
              fix(24, meta.url, true),
              fix(8, meta.uuid, true),
              msg);

  cb(null, true);
};