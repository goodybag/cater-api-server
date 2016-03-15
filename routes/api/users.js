var express = require('express');

var moment = require('moment-timezone');
var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');
var venter = require('../../lib/venter');
var errors = require('../../errors');

var route = module.exports = express.Router();

route.get('/me/orders'
, function( req, res, next ){
    if ( req.user.isGuest() ){
      return next( errors.auth.NOT_ALLOWED );
    }

    req.queryObj.user_id = req.user.attributes.id;

    return next();
  }
, m.pagination()
, function( req, res, next ){
    var timezone = req.user.attributes.region.timezone;

    if ( req.query.start || req.query.end ){
      req.queryObj.datetime = {}
    }

    if ( req.query.start ){
      req.queryObj.datetime.$gte = moment.tz(
        req.query.start, timezone
      ).format('YYYY-MM-DD');
    }

    if ( req.query.end ){
      req.queryObj.datetime.$lt = moment.tz(
        req.query.end, timezone
      ).format('YYYY-MM-DD');
    }

    return next();
  }
, m.param('status')
, function(req, res, next) {
  res.locals.status = req.params.status;
  if (req.query.status == 'accepted') {
    req.queryOptions.statusDateSort = {
      status: req.query.status
    };
  }
  return next();
}
, m.sort('-id')
, m.queryOptions({
    useLatestRevision: true,
    applyPriceHike: { useCachedSubTotal: false }
  })
, m.find(db.orders)
);

route.post('/:uid/rewards'
, m.restrict(['admin', 'client'])
, m.owner()
, controllers.users.rewards.redeem
);

route.get(''
, m.restrict(['admin'])
, m.sort('-id')
, m.queryOptions({
    many: [{ table: 'addresses' }, { table: 'orders' }]
  })
, m.find( db.users )
);

route.get('/me'
, function( req, res ){
    delete req.user.attributes.password;
    res.json( req.user );
  }
);

route.get('/:id'
, m.restrict(['admin'])
, m.param('id')
, m.sort('-id')
, m.queryOptions({
    many: [
      { table: 'addresses' }
    , { table: 'users_groups', alias: 'groups' }
    ]
  })
, m.find( db.users )
);

route.put('/:id'
, m.restrict(['admin'])
, m.param('id')
, m.updateStripeCustomer({ required: 'user', pick: ['name'] })
, m.update( db.users )
);

route.delete('/:id'
, m.restrict(['admin'])
, m.param('id')
, m.remove( db.users )
);

// req body: { name: User Name, email: example@email.com }
route.post('/:user_id/invoice-recipients'
, m.restrict(['admin'])
, m.queryToBody('user_id')
, m.insert( db.user_invoice_recipients )
);

// req body: { email: example@email.com }
route.put('/:user_id/invoice-recipients/:id'
, m.restrict(['admin'])
, m.param('id')
, m.update( db.user_invoice_recipients )
);

route.delete('/:user_id/invoice-recipients/:id'
, m.restrict(['admin'])
, m.param('id')
, m.remove( db.user_invoice_recipients )
);