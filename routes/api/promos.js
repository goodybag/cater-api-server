var m = require('../../middleware');
var db = require('../../db');
var route = module.exports = require('express').Router();

route.get('/'
, m.restrict(['admin'])
, m.sort('-promo_code')
, m.find( db.promos )
);

route.post('/'
, m.restrict(['admin'])
, m.queryOptions({
    returning: ['*']
  })
, m.insert( db.promos )
);

route.get('/:promo_code'
, m.restrict(['admin'])
, m.param('promo_code')
, m.findOne( db.promos )
);

route.put('/:promo_code'
, m.restrict(['admin'])
, m.param('promo_code')
, m.queryOptions({
    returning: ['*']
  })
, m.update( db.promos )
);

route.patch('/:promo_code'
, m.restrict(['admin'])
, m.param('promo_code')
, m.queryOptions({
    returning: ['*']
  })
, m.update( db.promos )
);

route.delete('/:promo_code'
, m.restrict(['admin'])
, m.param('promo_code')
, m.queryOptions({
    returning: ['*']
  })
, m.remove( db.promos )
);
