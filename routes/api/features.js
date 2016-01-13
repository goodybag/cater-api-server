var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');
var venter = require('../../lib/venter');

var route = module.exports = express.Router();

route.post('/'
, m.restrict(['admin'])
, controllers.api.features.create
);

route.get('/'
, m.restrict(['admin'])
, controllers.api.features.list
);

route.get('/:feature_id'
, m.restrict(['client'])
, controllers.api.features.show
);

route.put('/:feature_id'
, m.restrict(['admin'])
, controllers.api.features.update
);

route.patch('/:feature_id'
, m.restrict(['admin'])
, controllers.api.features.update
);

route.delete('/:feature_id'
, m.restrict(['admin'])
, controllers.api.features.remove
);
