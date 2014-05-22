var events      = require('events');
var path        = require('path');
var util        = require('util');
var config      = require('../config');
var utils       = require('../utils');
var scheduler   = require('./scheduler');

var PdfBuilder = function( options ){
  [
    'url', 'output', 'email', 'password', 'bucket'
  ].forEach( function( prop ){
    if ( !(prop in options ) ){
      throw new Error('Missing required property `' + prop + '`');
    }
  });

  this.options = options;

  this.options.buildOptions = options.buildOptions || [];

  events.EventEmitter.call( this );

  return this;
};

util.inherits( PdfBuilder, events.EventEmitter );

PdfBuilder.prototype.build = function( options, callback ){
  this.options.buildOptions.forEach( function( prop ){
    if ( !(prop in options ) ){
      throw new Error('Missing required property `' + prop + '`');
    }
  });

  var url     = this.options.url;
  var output  = this.options.output;

  this.options.buildOptions.forEach( function( prop ){
    url     = url.replace( ':' + prop, options[ prop ] );
    output  = output.replace( ':' + prop, options[ prop ] );
  });

  scheduler.series([
    {
      action: 'build-pdf'
    , data: utils.extend({
        url:      url
      , output:   output
      , email:    this.options.email
      , password: this.options.password
      }, this.options['build-pdf'] || {} )
    }
  , {
      action: 'upload-to-s3'
    , data: utils.extend({
        src:    output
      , dest:   '/' + path.basename( output )
      , bucket: this.options.bucket
      }, this.options['upload-to-s3'] || {} )
    }
  ], callback );
};

PdfBuilder.prototype.getS3Client = function(){
  return utils.s3.createClient({
    key:    config.amazon.awsId
  , secret: config.amazon.awsSecret
  , bucket: this.options.bucket
  });
};

PdfBuilder.prototype.get = function( options, callback ){
  this.options.buildOptions.forEach( function( prop ){
    if ( !(prop in options ) ){
      throw new Error('Missing required property `' + prop + '`');
    }
  });

  var s3Client  = this.getS3Client();
  var output    = this.options.output;

  this.options.buildOptions.forEach( function( prop ){
    output = output.replace( ':' + prop, options[ prop ] );
  });

  s3Client.getFile( '/' + output, callback );
};

module.exports.receipt = new PdfBuilder({
  url:          [ config.baseUrl, 'orders', ':orderId', 'receipt' ].join('/')
, output:       path.join( __dirname, '../', config.tmpDir, 'order-:orderId.pdf' )
, bucket:       config.receipt.bucket
, email:        config.receipt.credentials.email
, password:     config.receipt.credentials.password
, buildOptions: ['orderId']
});

module.exports.pms = new PdfBuilder({
  url:          [ config.baseUrl, config.paymentSummaries.route ].join('')
, output:       path.join( __dirname, '../', config.tmpDir, 'pms-:id.pdf' )
, bucket:       config.paymentSummaries.bucket
, email:        config.paymentSummaries.credentials.email
, password:     config.paymentSummaries.credentials.password
, buildOptions: [ 'restaurant_id', 'id' ]
});

module.exports.manifest = new PdfBuilder({
  url:          [ config.baseUrl, 'orders', ':orderId', 'manifest' ].join('/')
, output:       path.join( __dirname, '../', config.tmpDir, 'manifest-:orderId.pdf' )
  // Just use receipt stuff for manifest for now since they're the same content
, bucket:       config.receipt.bucket
, email:        config.receipt.credentials.email
, password:     config.receipt.credentials.password
, buildOptions: ['orderId']
, 'build-pdf':  {
    'margin-top':     0
  , 'margin-right':   0
  , 'margin-bottom':  0
  , 'margin-left':    0
  }
});