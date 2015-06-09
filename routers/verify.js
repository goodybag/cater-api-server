/**
 * /verify
 */

var express = require('express');
var router = express.Router();
var m = require('../middleware');

router.get('/:stripe_id',
  m.view( 'verify/stripe', { layout: 'layout/default' })
);

module.exports = router;
