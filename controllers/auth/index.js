var
  async = require('async')
, db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
;

module.exports.index = function(req, res) {
  if (req.session && req.session.user && req.session.user.id != null)
    return res.redirect(req.query.next || '/restaurants');

  res.render('auth', function(error, html) {
    if (error) return res.error(errors.internal.UNKNOWN, error);
    return res.send(html);
  });
}
