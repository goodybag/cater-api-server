var events      = require('events');
var path        = require('path');
var phantom     = require('./phantom');
var config      = require('../config');
var utils       = require('../utils');
var venter      = require('./venter');

scheduler.enqueue( 'build-pdf', {

});

scheduler.pipeline([{
  task: 'build-pdf'
, data: { url, output, credentials }
}, {
  task: 'upload-to-s3'
, data: { path, bucket }
}]);

scheduler.pipeline()

module.exports = function Builder( options ){
  options = utils.defaults( options || {}, {

  });
};

util.inherits( Builder, events.EventEmitter );

module.exports.create = function( options ){
  return new Builder( options );
};