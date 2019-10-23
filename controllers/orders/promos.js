var db      = require('../../db');
var errors  = require('../../errors');

module.exports.validate = function(req, res) {
  const promo_code = req.body.promo_code;
  const order_id = req.params.oid;

  var where = { promo_code, 'promos_applied.order_id': order_id };

  var options = {
    joins: [{
        type: 'left'
      , target: 'promos_applied'
      , on: { promo_id: '$promos.id$' }
    }]
  };

  db.promos.findOne( where, options, (err, result) => {

    if( !result ) {
      res.error( errors.promos.DOES_NOT_EXIST );
      return;
    }

    if( result.order_id ) {
      res.error( errors.promos.ALREADY_APPLIED );
      return;
    }

    res.sendStatus(204);

  });
};
