var db      = require('../../db');
var errors  = require('../../errors');

module.exports.validate = function(req, res) {
  const promo_code = req.body.promo_code;
  const order_id = req.params.oid;

  var where = { promo_code };

  db.promos.findOne( where, (err, result) => {

    if( !result ) {
      res.error( errors.promos.DOES_NOT_EXIST );
      return;
    }

    var where = { promo_id: promo_code, order_id };

    db.promos_applied.findOne( where, (err, result) => {

      if( result ) {
        res.error( errors.promos.ALREADY_APPLIED );
        return;
      }

      res.sendStatus(200);
    });

  });
};
