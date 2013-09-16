var
  async = require('async')
, db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
, session = require('../session')
;

module.exports.index = function(req, res) {
  if (req.session && req.session.user && req.session.user.id != null)
    return res.redirect(req.query.next || '/restaurants');

  var query = '?' + utils.invoke(utils.pairs(req.query), 'join', '=').join('&');
  res.render('auth', {query: query}, function(error, html) {
    if (error) return res.status(500).render('500');
    return res.send(html);
  });
}