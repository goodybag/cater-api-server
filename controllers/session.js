var
  db = require('../db')
, queries = require('../db/queries')
, errors = require('../errors')
, utils = require('../utils')
, auth = require('../lib/auth')
;

module.exports.get = function(req, res) {
  res.json(200, req.session);
}

module.exports.create = function(req, res) {
  auth( req.body.email, req.body.password, function( error, user ){
    if ( error ){
      if ( error.type !== 'auth' ){
        return res.status(500).render('500');
      }

      return res.render( 'auth', { error: error } );
    }

    req.session = utils.extend(
      {}, req.session,
      { user: utils.pick( user, [ 'id', 'groups', 'email', 'created_at' ] ) }
    );

    return res.redirect(req.query.next || '/restaurants');
  });
}

module.exports.del = function(req, res) {
  req.session = null;
  return res.redirect(req.query.next || '/restaurants');
}

module.exports.patch = function(req, res) {
  return res.redirect(req.query.next || '/restaurants');
}

module.exports.getOrderParams = function(req, res) {
  res.send(req.session.orderParams);
};

module.exports.updateOrderParams = function(req, res) {
  req.session.orderParams = {
    zip: req.body.zip
  , date: req.body.date
  , time: req.body.time
  , guests: parseInt(req.body.guests, 10)
  }
  res.send(req.session.orderParams);
};
