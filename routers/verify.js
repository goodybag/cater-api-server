/**
 * /verify
 */

var express = require('express');
var router = express.Router();
var m = require('../middleware');

router.get('/:id',
  m.getRestaurant({ param: 'id' })
, m.view( 'verify/stripe', { layout: 'layout/default' })
);

router.post('/:id/verifications',
  m.getRestaurant({ param: 'id' })
, m.stripe.verifyRestaurant()
, m.stripe.insertRestaurantVerification()
, m.view( 'verify/complete', { layout: 'layout/default' })
);

module.exports = router;
