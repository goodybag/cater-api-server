var Models  = require('../../models');
var utils   = require('../../utils');
var errors  = require('../../errors');
var config  = require('../../config');
var db      = require('../../db');
var queries = require('../../db/queries');
var auth    = require('../../lib/auth');

module.exports.index = function(req, res) {
  if (req.session && req.session.user && req.session.user.id != null)
    return res.redirect(req.query.next || '/restaurants');

  var query = '?' + utils.invoke(utils.pairs(req.query), 'join', '=').join('&');

  res.render('landing/home', {
    query: query
  , layout: 'landing/layout'
  });
};

module.exports.forgotPassword = function( req, res ){
  res.render( 'landing/forgot-password', options );
};

module.exports.forgotPasswordCreate = function( req, res ){
  var render = function( error ){
    var options = utils.extend( {}, req.body, {
      layout: 'landing/layout'
    });

    if ( error ) options.error = error;

    res.render(
      options.error ? 'landing/forgot-password' : 'landing/forgot-password-success'
    , options
    );
  };

  // Nothing in POST request or just a GET
  if ( !req.body.email ) return render( errors.auth.INVALID_EMAIL );

  var sql = db.builder.sql(
    queries.passwordReset.create( req.body.email )
  );

  db.query( sql.query, sql.values, function( error, rows, result ){
    if ( error ){
      error = error.code == '23502' ?
        errors.auth.INVALID_EMAIL : errors.internal.DB_FAILURE;

      return render( error );
    }

    if ( rows.length === 0 ) return render( errors.internal.DB_FAILURE );

    var options = {
      layout: false
    , token:  rows[0].token
    , config: config
    };

    res.render( 'password-reset-email', options, function(  error , html ){
      if ( error ) return render( errors.internal.UNKNOWN );

      var mail = {
        to:       req.body.email
      , from:     'support@goodybag.com'
      , subject:  'Goodybag password reset'
      , html:     html
      };

      utils.sendMail2( mail, function( error ){
        render( error ? errors.internal.UNKNOWN : null );
      });
    });
  });
};

module.exports.login = function ( req, res ){
  if ( !req.body.email && !req.body.password ){
    return res.render('landing/login', {
      layout: 'landing/layout'
    });
  }

  auth( req.body.email, req.body.password, function( error, user ){
    if ( error ){
      if ( error.type !== 'auth' ){
        return res.status(500).render('500');
      }

      return res.render('landing/login', {
        layout: 'landing/layout'
      , error: error
      });
    }

    req.setSession( user );

    return res.redirect( req.query.next || '/' );
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