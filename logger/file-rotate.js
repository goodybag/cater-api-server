
/**
 * Module dependencies
 */

var
  util = require('util')
, path = require('path')
, winston = require('winston')
, moment = require('moment-timezone')
;

var FileRotate = module.exports = function(options) {
  winston.transports.File.call(this, options);

  this._filename = options.filename.substring(0, options.filename.lastIndexOf('.'));
  this._extension = options.filename.substring(options.filename.lastIndexOf('.')+1);

  this._dateFormat = options.dateFormat || "MM-DD-YYYY"; // default to daily
  this._dateString = "";
};

util.inherits(FileRotate, winston.transports.File);

FileRotate.prototype.open = function (callback) {
  if (this.opening && !this._stream) {
    //
    // If we are already attempting to open the next
    // available file then respond with a value indicating
    // that the message should be buffered.
    //
    return callback(true);
  }
  else if(this._dateString !== moment().format(this._dateFormat)){
    //
    // If the dateString has changed then we must write to a new file
    //
    this._dateString = moment().format(this._dateFormat);
    this._basename = this._filename+'-'+this._dateString+'.'+this._extension;
    callback(true);
    return this._createStream();
  }
  else if (!this._stream || (this.maxsize && this._size >= this.maxsize)) {
    //
    // If we dont have a stream or have exceeded our size, then create
    // the next stream and respond with a value indicating that
    // the message should be buffered.
    //
    callback(true);
    return this._createStream();
  }

  //
  // Otherwise we have a valid (and ready) stream.
  //
  callback();
};