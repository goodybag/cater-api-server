var
  // Module Dependencies
  fs     = require('fs')
, path   = require('path')
, config = require('./config')
, errors = require('./errors')

  // Third Party Dependencies
, lodash = require('lodash')
, bcrypt = require('bcrypt')
, ok = require('okay')
, request = require('request')
, async = require('async')
, MailComposer = require('mailcomposer').MailComposer
, Mailgun = require('mailgun').Mailgun
, Balanced = require('balanced-official')
, uuid = require('node-uuid')
, ironMQ = require('iron_mq')
, rollbar = require("rollbar")
, Handlebars = require('hbs')
, moment = require('moment-timezone')
, mandrill = require('mandrill-api/mandrill')
, twilio = require('twilio')
, Bitly = require('bitly')

  // Make underscores/async functionality available on utils
, utils     = lodash.extend({}, lodash, {async: async}, require('./public/js/lib/utils'))
;

var local = {};
if (fs.existsSync('./local-config.json')){
  local = require('./local-config.json');
}

utils.Plan = require('plan.js');

utils.useragent = require('useragent');
utils.Promise = require('bluebird');
utils.http = utils.Promise.promisify( request );
utils.request = request;
utils.twilio = twilio(config.twilio.account, config.twilio.token);
utils.bitly = new Bitly(config.bitly.username, config.bitly.apiKey);

utils.words = require('pluralize');

utils.CronJob = require('cron').CronJob;
utils.overload = require('leFunc');

utils.deepExtend = require('deep-extend');

utils.template = Handlebars.compile.bind( Handlebars );

utils.s3 = require('knox');

utils.uuid = uuid;

// ironMQ stuff
utils.iron = new ironMQ.Client({token: config.ironMQ.token, project_id: config.ironMQ.projectId});
utils.queues = {
  debit: utils.iron.queue('debit')
};

// rollbar stuff
rollbar.init(config.rollbar.accessToken);
utils.rollbar = rollbar;

//balanced stuff
utils.balanced = new Balanced({
  marketplace_uri: config.balanced.marketplaceUri
, secret: config.balanced.secret
});

utils.stripe = require('stripe')(config.stripe.secret);

utils.normalize = function( x, MIN, MAX ){
  return ( x - MIN ) / ( MAX - MIN );
};

utils.getTestEmail = function( id ){
  var email = config.testEmail.split('@');
  email[0] += '+' + ( id ? id : parseInt(Math.random()*9999999).toString(36) );
  if ( local.emailSalt ) email[0] += local.emailSalt;
  return email.join('@');
};

utils.editAllKeys = function( obj, fn ){
  var val, newKey;

  for ( var key in obj ){
    val = obj[ key ];

    if ( typeof val === 'object' && val !== null && val !== undefined ){
      utils.editAllKeys( val, fn );
    }

    newKey = fn( key, val, obj );

    if ( key !== newKey ){
      obj[ newKey ] = val;
      delete obj[ key ];
    }
  }

  return obj;
};

utils.test = {};
function getRequestMethod( method, opts ){
  return function( url, data, callback ){
    var options = utils.extend({
      url:    [ config.baseUrl, url ].join( url[0] === '/' ? '' : '/' )
    , method: method
    , form:   data
    , jar:    true
    }, opts || {} );
    if ( [ 'get', 'del' ].indexOf( method ) > -1 ){
      delete options.form;
    }

    return request( options, [ 'get', 'del' ].indexOf( method ) > -1 ? data : callback );
  };
}

// Regular HTTP requests
[
  'get', 'post'
].forEach( function( method ){
  utils.test[ method ] = getRequestMethod( method );
});

// For consuming JSON
utils.test.json = {};
[
  'get', 'post', 'put', 'patch', 'del'
].forEach( function( method ){
  utils.test.json[ method ] = getRequestMethod( method, { json: true } );
});

utils.test.loginAsUserId = function( id, callback ){
  return utils.test.login( utils.getTestEmail(), 'password', callback );
};

utils.test.login = function( user, password, callback ){
  var data = { email: user, password: password };
  return utils.test.post( '/login', data, callback );
};

utils.test.logout = function( callback ){
  return utils.test.get( '/auth/logout', callback );
};

utils.async.log = function(){
  var args = arguments;
  return function(){
    console.log.apply( console, args );
    return arguments[ arguments.length - 1 ]();
  };
};

utils.async.noop = function(){
  var callback = arguments[ arguments.length - 1 ];
  if ( typeof callback === 'function' ) return callback();
};

/**
 * Async.parallel that does not bail on error.
 * Instead it will return an array or object
 * of errors, continuing until each function is
 * complete
 * @param  {Array|Object}   fns      The list of functions to run
 * @param  {Function} callback      ( errors, results )
 */
utils.async.parallelNoBail = function( fns, limit, callback ){
  if ( typeof limit === 'function' ){
    callback = limit;
    limit = null;
  }

  if ( limit ){
    return utils.async.noBail( 'parallelLimit', fns, limit, callback )
  }

  return utils.async.noBail( 'parallel', fns, callback );
};

/**
 * Async.series that does not bail on error.
 * Instead it will return an array or object
 * of errors, continuing until each function is
 * complete
 * @param  {Array|Object}   fns      The list of functions to run
 * @param  {Function} callback      ( errors, results )
 */
utils.async.seriesNoBail = function( fns, callback ){
  return utils.async.noBail( 'series', fns, callback );
};

utils.async.noBail = function( op, fns, limit, callback ){
  if ( typeof fns !== 'object' ) throw new Error('`parallelNoBail` - Invalid first argument');

  if ( typeof limit === 'function' ){
    callback = limit;
    limit = null;
  }

  var hadError = false;
  var noBailFns = Array.isArray( fns ) ? [] : {};
  var errors    = Array.isArray( fns ) ? [] : {};

  Object.keys( fns ).forEach( function( key ){
    noBailFns[ key ] = function( done ){
      fns[ key ]( function( error ){
        if ( error ){
          hadError = true;
          if ( Array.isArray( errors ) ) errors.push( error );
          else errors[ key ] = error;
        }

        done.apply( null, [null].concat( Array.prototype.slice.call( arguments, 1 ) ) );
      });
    }
  });

  var args = [ noBailFns ];

  if ( limit ) args.push( limit );

  args.push(function( error, results ){
    callback( hadError ? errors : null, results );
  });

  async[ op ].apply( async, args );
};

utils.stage = function(fns){
  var current = function(){
    var args = Array.prototype.slice.call(arguments, 0);
    var callback = args.pop();

    // Redefine current after first call so that it doesn't default to 'start'
    current = function(name){
      if (!fns.hasOwnProperty(name)) throw new Error('Cannot find stage item: ', name);
      fns[name].apply(null, Array.prototype.slice.call(arguments, 1).concat(current, callback));
    };

    fns.start.apply(null, args.concat(current, callback));
  };

  return current;
};

utils.get = function(url, options, callback){
  if (typeof options === "function"){
    callback = options;
    options = {};
  }

  options = utils.extend({
    url: url
  , method: "GET"
  , json: true
  }, options);
  request(options, callback);
};

utils.post = function(url, data, options, callback){
  if (typeof options === "function"){
    callback = options;
    options = {};
  }

  options = utils.extend({
    url: url
  , method: "POST"
  , json: true
  , form: data
  }, options);

  request(options, callback);
};

utils.put = function(url, data, options, callback){
  if (typeof options === "function"){
    callback = options;
    options = {};
  }

  options = utils.extend({
    url: url
  , method: "PUT"
  , json: true
  , form: data
  }, options);

  request(options, callback);
};

utils.patch = function(url, data, options, callback){
  if (typeof options === "function"){
    callback = options;
    options = {};
  }

  options = utils.extend({
    url: url
  , method: "PATCH"
  , json: true
  , form: data
  }, options);

  request(options, callback);
};

utils.del = function(url, callback){
  var options = {
    url: url
  , method: "DELETE"
  , json: true
  };
  request(options, callback);
};

var mailgun = new Mailgun(config.mailgun.apiKey);
mandrill = new mandrill.Mandrill(config.mandrill.apiKey);

/**
 * Send mail. Why are there two versions? Because sendMail1
 * is already being used throughout the codebase and I need
 * to add attachments to my mail now. Adding it to sendMail1
 * seems like too daunting of a task because... I mean...
 * look at it! I would have to add yet ANOTHER argument to
 * that thing
 *
 * Options: {
 *   to:        'jane@doe.com'
 * , from:      'john@doe.com'
 * , subject:   'ohai!'
 * , html:      '<html></html>'
 * , body:      'Plain text'
 * , reply_to:  'john@doe.com'
 * , attachment: {
 *     // Whatever mailcomposer accepts
 *     // See https://github.com/andris9/mailcomposer#add-attachments
 *     filePath: '~/love-letter.pdf'
 *   }
 * , attachments: [ * array of objects described above * ]
 * , headers: {
 *     "x-mailer": "Noemailer 1.0"
 *   }
 * }
 *
 * @param  {Object}   options  The full email options sent to composer
 * @param  {Function} callback callback( error )
 */
utils.sendMail2 = function( options, callback ){
  callback = callback || options.callback || utils.noop;

  if ( !config.emailEnabled ) return callback();

  var composer = new MailComposer();

  // Remove whitespace from email to remove possible rendering bugs
  if ( options.html ) options.html = options.html.replace(/>\s+</g, '><').trim();

  composer.setMessageOption( options );

  if ( options.attachments ) options.attachments.forEach( composer.addAttachment );
  if ( options.attachment ) composer.addAttachment( options.attachment );

  if ( typeof options.headers === 'object' ){
    for ( var key in options.headers ){
      composer.addHeader( key, options.headers[ key ] );
    }
  }

  composer.buildMessage( function( error, message ){
    if ( error ) return callback( error );

    utils.sendRawEmail( options.from, options.to, message, callback );
  });
};

utils.sendRawEmail = function( from, to, text, callback ){
  if ( config.emailProvider === 'mailgun' ){
    mailgun.sendRaw( options.from, options.to, message, callback );
  } else if ( config.emailProvider === 'mandrill' ){
    mandrill.messages.sendRaw({
      from_email: from
    , to: Array.isArray( to ) ? to : [ to ]
    , raw_message: text
    }, function( result ){ callback( null, result ); }, callback );
  }
};

utils.sendMail = function(to, from, subject, html, text, callback) {
  if (lodash.isFunction(text) && callback === undefined) {
    callback = text;
    text = undefined;
  }

  var options;

  if (lodash.isObject(to) && !lodash.isArray(to)) {
    callback = from;
    from = undefined;
    options = to;
    from = options.from;
    to = options.to;
    subject = options.subject;
    html = options.html;
    text = options.body
  } else {
    options = {
      to: to
    , from: from
    , reply_to: from
    , subject: subject
    , html: html
    , body: text
    }
  }

  // Remove whitespace from email to remove possible rendering bugs
  if (options.html) options.html = options.html.replace(/>\s+</g, '><').trim();

  if (!callback) callback = function(){};
  if (!config.emailEnabled) return callback(); // :TODO: log or output an event so that we can test against the event

  var send = function(mimeBody) {
    mailgun.sendRaw(mimeBody, callback)
  };

  var composer = new MailComposer();

  composer.setMessageOption(options);

  composer.buildMessage(function(err, msg) {
    if (err && lodash.isFunction(callback)) return callback(err);
    mailgun.sendRaw(from, to, msg, callback);
  });
}

utils.isNotBlank = function (value) {
  if(value != null && value !="") return true;
  return false;
}

utils.parseBool = function(value){
  if (value == 'true' || value == '1') return true;
  if (value == 'false' || value == '0') return false;
  return true;
};

/**
 * Encrypts consumer passwords
 * @param  {String}   password  The password to encrypt
 * @param  {String}   salt      The salt to use with the password
 * @param  {Function} callback  Takes (err, hash, salt)
 * @return {null}
 */
utils.encryptPassword = function(password, salt, callback){
  if (!callback && typeof salt == 'function') {
    callback = salt;
    salt = null;
  }
  if (!password) return (callback || function(){})(null);

  var genSalt = (!salt) ? bcrypt.genSalt : function(v, cb) { cb(null, salt); };
  genSalt.call(bcrypt, 10, ok(function(salt) {
    bcrypt.hash(password + config.passwordSalt, salt, ok(function(hash) {
      callback(null, hash, salt);
    }));
  }));
};

/**
 * Copmares a non-encrypted password with an encrypted one
 * @param  {String}   password  The non-encrypted string
 * @param  {String}   encrypted The encrypted string
 * @param  {Function} callback  Contains the results (error, success)
 * @return {Null}
 */
utils.comparePasswords = function(password, encrypted, callback){
  //do not compare null values
  if(!encrypted) return callback(null, false);
  bcrypt.compare(password + config.passwordSalt, encrypted, ok(function(success) {
    if (!success){
      bcrypt.compare(password, encrypted, ok(function(success) {
        callback(null, success);
      }));
    }
    else {
      callback(null, success);
    }
  }));
};

utils.sendJSON = function(res, json){
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  // res.header('Access-Control-Allow-Origin', 'http://local.goodybag.com');
  // res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  // res.header('Access-Control-Allow-Credentials', true);
  // res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization');
  // res.cookie('remember', 1, { domain : "test-project" });
  res.json(json);
};

utils.sendError = function(res, error, details){
  if (error instanceof Error) {
    error = utils.extend({}, errors.runtime.ERROR, { message: error.message, stack: error.stack });
  }
  if (typeof error === 'string') {
    error = errors[error];
  }
  if ( !error.details ) error.details = utils.pick(details, ['message', 'stack']);
  res.status(error.httpCode);
  utils.sendJSON(res, { error: error });
};

utils.noop = function(){};

/**
 * Contains the default structure for errors
 * @param  {String} message Nice message to be displayed
 * @param  {String} type    The type of error
 * @return {Object}         The error object
 */
utils.error = function(message, type){
  return {
    message: message
  , type: type
  };
};

utils.queryParams = function(data, urlEncode){
  if (typeof data !== "object") return "";
  var params = "?";
  for (var key in data){
    if ([null, undefined, ""].indexOf(data[key]) > -1) continue;
    if (utils.isArray(data[key])){
      for (var i = 0, l = data[key].length; i < l; ++i){
        params += key + (urlEncode ? "%5B%5D=" : "[]=" ) + data[key][i] + "&";
      }
    } else {
      params += key + "=" + data[key] + "&";
    }
  }
  return params.substring(0, params.length - 1);
};

utils.getProperty = function( obj, prop ) {
  if (prop.indexOf('.') < 0) return obj[prop];
  var parts = prop.split('.')
    , last = parts.pop()
    , len = parts.length
    , idx = 1
    , current = parts[0];

  while( (obj = obj[current]) && idx < len ) {
    current = parts[idx++];
  }
  if ( obj )
    return obj[last];
  return obj;
};

module.exports = utils;
