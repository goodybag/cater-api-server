var
  // Third Party Dependencies
  lodash = require('lodash')
, bcrypt = require('bcrypt')
, ok = require('okay')
, request = require('request')
, async = require('async')
, MailComposer = require('mailcomposer').MailComposer
, Mailgun = require('mailgun').Mailgun
, uuid = require('node-uuid')

  // Module Dependencies
, config = require('./config')
, errors = require('./errors')

  // Make underscores/async functionality available on utils
, utils     = lodash.extend({}, lodash, {async: async})
;

utils.uuid = uuid;

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

utils.post = function(url, data, callback){
  var options = {
    url: url
  , method: "POST"
  , json: true
  , form: data
  };
  request(options, callback);
};

utils.put = function(url, data, callback){
  var options = {
    url: url
  , method: "PUT"
  , json: true
  , form: data
  };
  request(options, callback);
};

utils.patch = function(url, data, callback){
  var options = {
    url: url
  , method: "PATCH"
  , json: true
  , form: data
  };
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

utils.sendMail = function(to, from, subject, html, text, callback) {
  if (lodash.isFunction(text) && callback === undefined) {
    callback = text;
    text = undefined;
  }

  var options;

  if (lodash.isObject(to)) {
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
  options.html = options.html.replace(/>\s+</g, '><').trim();

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

utils.deepClone = function (obj) {
  return JSON.parse(JSON.stringify(obj)); // :TODO: non-hack deepclone
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
  if (typeof error === 'string') {
    error = errors[error];
  }
  error.details = details;
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

module.exports = utils;
