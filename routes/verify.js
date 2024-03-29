/**
 * Router /verify
 */

var express = require('express');
var router  = express.Router();
var m       = require('../middleware');
var multer  = require('multer');

router.get('/:uuid',
  m.getRestaurant({ param: 'uuid', getByUuid: true })
, m.view( 'verify/stripe', { layout: 'layout/default' })
);

router.post('/:uuid/verifications',
  m.getRestaurant({ param: 'uuid', getByUuid: true })
, m.stripe.verifyRestaurant()
, m.stripe.insertRestaurantVerification()
, m.view( 'verify/complete', { layout: 'layout/default' })
);

router.get('/:uuid/upload',
  m.getRestaurant({ param: 'uuid', getByUuid: true })
, m.view( 'verify/upload', { layout: 'layout/default' })
);

router.post('/:uuid/upload',
  m.getRestaurant({ param: 'uuid', getByUuid: true })
, multer() // use system tmp dir by default
, m.stripe.uploadDocument()
, m.view( 'verify/complete', { layout: 'layout/default'})
);

module.exports = router;
