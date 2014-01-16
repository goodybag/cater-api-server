var Models = require('../../models');
var utils = require('../../utils');

module.exports.index = function(req, res) {
  if (req.session && req.session.user && req.session.user.id != null)
    return res.redirect(req.query.next || '/restaurants');

  var query = '?' + utils.invoke(utils.pairs(req.query), 'join', '=').join('&');
  res.render('auth', {query: query}, function(error, html) {
    if (error) return res.status(500).render('500');
    return res.send(html);
  });
};

module.exports.signup = function( req, res ){
  var data = {
    name:         ( req.body.firstName || '' ) + ' ' + ( req.body.lastName || '' )
  , email:        req.body.email
  , password:     req.body.password
  , organization: req.body.organization
  };

  new Models.User( req.body ).create( function( error, user ){
    if ( error ){
      res.locals.registrationError = error;

      utils.extend( res.locals, req.body );

      return res.render('auth');
    }

    res.send('WOW GOOD JERB YOU SIGNED UP');
  });
};