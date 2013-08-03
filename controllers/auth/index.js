var
  async = require('async')
, db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
;

module.exports.index = function(req, res) {
  res.render('auth', function(error, html) {
    if (error) return res.error(errors.internal.UNKNOWN, error);
    res.render('index', {content: html}, function(errror, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      res.send(html);
    });
  });
}