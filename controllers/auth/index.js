var Models  = require('../../models');
var utils   = require('../../utils');
var errors  = require('../../errors');
var config  = require('../../config');
var db      = require('../../db');
var queries = require('../../db/queries');
var auth    = require('../../lib/auth');
var putils  = require('../../public/js/lib/utils');
var venter  = require('../../lib/venter');
var Models  = require('../../models');

module.exports.index = function(req, res) {
  if (req.user && req.user.attributes.id != null){
    if ( req.user.attributes.groups.indexOf('restaurant') > -1 ){
      return res.redirect(req.query.next || '/restaurants/manage');
    }
    return res.redirect(req.query.next || '/restaurants');
  }

  res.render('landing/home', {
    layout: 'landing/layout'
  });
};

module.exports.forgotPassword = function( req, res ){
  res.render( 'landing/forgot-password', {
    layout: 'layout/default'
  });
};

module.exports.forgotPasswordConsume = function( req, res ){
  var tokenExists = function( callback ){
    // Ensure the token is good
    var sql = db.builder.sql({
      type: 'select'
    , table: 'password_resets'
    , where: { token: req.params.token, token_used: { $null: true } }
    });

    db.query(sql.query, sql.values, function(err, rows, result) {
      callback( err, !err ? rows.length > 0 : null );
    });
  };

  tokenExists( function( error, exists ){
    if ( error ) return res.send(500)
    if ( !exists ) return res.send(404);

    if ( !req.body.password ){
      return res.render( 'landing/forgot-password-consume', {
        layout: 'layout/default'
      , token: req.params.token
      });
    }

    var flow = [
      function(callback) {
        utils.encryptPassword(req.body.password, function(err, hash, salt) {
          return callback(err ? errors.internal.UNKNOWN : null, hash);
        });
      },

      function(hash, callback) {
        var query = queries.user.update({password: hash}, {
          id: '$password_resets.user_id$',
          'password_resets.token': req.params.token
        });

        query.from = ['password_resets'];

        var sql = db.builder.sql(query);

        // TODO: transaction
        db.query(sql.query, sql.values, function(err, rows, result) {
          callback( err ? errors.internal.DB_FAILURE : null );
        });
      },

      function(callback) {
        var sql = db.builder.sql(queries.passwordReset.redeem(req.params.token));
        db.query(sql.query, sql.values, function(err, rows, result) {
          callback( err ? errors.internal.DB_FAILURE : null );
        });
      }
    ];

    utils.async.waterfall( flow, function( error ){
      if ( error ){
        return res.render( 'landing/forgot-password-consume', {
          layout: 'layout/default'
        , token: req.params.token
        , error: error
        });
      }

      res.render( 'landing/forgot-password-consume-success', {
        layout: 'layout/default'
      });
    });
  });
};

module.exports.forgotPasswordCreate = function( req, res ){
  var render = function( error ){
    var options = utils.extend( {}, req.body, {
      layout: 'layout/default'
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
  var logger = req.logger.create('Controller-Auth.Login');

  if ( !req.body.email && !req.body.password ){
    return res.render('landing/login', {
      layout: 'layout/default'
    });
  }

  var onSuccess = function(){
    return res.redirect( req.query.next || '/' );
  };

  auth( req.body.email, req.body.password, function( error, user ){
    if ( error ){
      if ( error.type !== 'auth' ){
        return res.status(500).render('500');
      }

      return res.render('landing/login', {
        layout: 'layout/default'
      , error: error
      });
    }

    if ( !utils.contains(user.groups, 'admin') ) {
      req.analytics.track({
        userId: user.id+''
      , event: 'Login'
      });
    }

    req.session.user = { id: user.id };

    if ( user.groups.indexOf('restaurant') > -1 ){
      return res.redirect(req.query.next || '/restaurants/manage');
    }

    if ( Array.isArray( req.session.guestOrders ) ){
      venter.emit('auth-with-guest-orders', new Models.User( user ), req.session.guestOrders );
      delete req.session.guestOrders;
    }

    req.session.save(function(err) {
      if ( err ) logger.error('Unable to save session', err);
      res.redirect( req.query.next || '/' );
    });
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

  var onSuccess = function(){
    return res.redirect('/restaurants');
  };

  new Models.User( data ).create( function( error, user ){
    if ( error ){
      if ( error.routine === '_bt_check_unique' ){
        error = errors.registration.EMAIL_TAKEN;
      }

      res.locals.registrationError = error;

      utils.extend( res.locals, req.body );

      return res.render('auth');
    }

    req.setSession( user.toJSON() );

    if ( Array.isArray( req.session.guestOrders ) ){
      venter.emit('auth-with-guest-orders', user, req.session.guestOrders );
      delete req.session.guestOrders;
    }

    res.redirect('/restaurants');
  });
};

module.exports.registerView = function( req, res ){
  res.render( 'landing/register', {
    layout: 'layout/default'
  , fromGuestOrder: req.params.fromGuestOrder
  });
};

module.exports.register = function( req, res ){
  var data = {
    name:         (( req.body.firstName || '' ) + ' ' + ( req.body.lastName || '' )).trim() || null
  , email:        req.body.email
  , password:     req.body.password
  , organization: req.body.organization
  , region_id:    req.body.region_id || 1
  , groups:       ['client']
  };

  // Don't bother sending a validation error if they didn't fill anything out
  if ( !data.email && !data.password ){
    return res.render( 'landing/register', {
      layout: 'layout/default'
    });
  }

putils.validator.validate( data, {
    type: 'object'
  , properties: {
      email: {
        type: 'string'
      , format: 'email'
      , minLength: 1
      , required: true
      }
    , password: {
        type: 'string'
      , minLength: 1
      , required: true
      }
    }
  }, function( error ){

    if ( error && error.length > 0 ){
      var message;

      if ( error[0].property === 'email' ){
        message = 'Invalid Email';
      } else {
        message = 'Invalid Password';
      }

      return res.render( 'landing/register', {
        layout: 'layout/default'
      , error: { message: message }
      });
    }

    new Models.User( data ).create( function( error, user ){
      if ( error ){
        if ( error.routine === '_bt_check_unique' ){
          error = errors.registration.EMAIL_TAKEN;
        }

        return res.render( 'landing/register', {
          layout: 'landing/default'
        , error: error
        });
      }

      req.analytics.track({
        userId: user.attributes.id+''
      , event: 'Sign up'
      });

      req.setSession( user.toJSON() );
      req.session.isNewSignup = true;

      if ( Array.isArray( req.session.guestOrders ) ){
        venter.emit('auth-with-guest-orders', user, req.session.guestOrders );
        delete req.session.guestOrders;
      }

      req.session.save( function( error ){
        if ( error ){
          logger.error('Error saving session!', {
            error: error
          });

          return res.status(500).render('500');
        }

        res.redirect( req.query.next || '/restaurants' );

        venter.emit( 'user:registered', user );
      });
    });
  });
};
