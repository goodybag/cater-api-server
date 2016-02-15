var m = require('../../middleware');
var db = require('../../db');
var route = module.exports = require('express').Router();

route.get('/'
, m.restrict(['admin'])
, m.sort('-id')
, m.find( db.restaurant_plans )
);

route.post('/'
, m.restrict(['admin'])
, m.insert( db.restaurant_plans )
);

route.get('/:id'
, m.restrict(['admin'])
, m.param('id')
, m.findOne( db.restaurant_plans )
);

route.put('/:id'
, m.restrict(['admin'])
, m.param('id')
, m.update( db.restaurant_plans )
);

route.patch('/:id'
, m.restrict(['admin'])
, m.param('id')
, m.update( db.restaurant_plans )
);

route.delete('/:id'
, m.restrict(['admin'])
, m.param('id')
, m.remove( db.restaurant_plans )
);