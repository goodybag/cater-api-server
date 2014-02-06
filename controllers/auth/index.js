var Models  = require('../../models');
var utils   = require('../../utils');
var errors  = require('../../errors');

module.exports.index = function(req, res) {
  if (req.session && req.session.user && req.session.user.id != null)
    return res.redirect(req.query.next || '/restaurants');

  var query = '?' + utils.invoke(utils.pairs(req.query), 'join', '=').join('&');

  res.render('landing/page', {
    query: query
  , layout: 'landing/layout'
  });
};

module.exports.signup = function( req, res ){
  var data = {
    name:         (( req.body.firstName || '' ) + ' ' + ( req.body.lastName || '' )).trim() || null
  , email:        req.body.email
  , password:     req.body.password
  , organization: req.body.organization
  , groups:       ['client']
  };

  new Models.User( data ).create( function( error, user ){
    if ( error ){
      if ( error.routine === '_bt_check_unique' ){
        error = errors.registration.EMAIL_TAKEN;
      }

      res.locals.registrationError = error;

      utils.extend( res.locals, req.body );

      req.url = '/auth';
      return res.render('auth');
    }

    req.setSession( user.toJSON() );

    res.redirect('/restaurants');
  });
};