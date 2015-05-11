var db = require('../../db');
module.exports.create = function (req, res) {
  db.restaurant_signups.insert(req.body, req.queryOptions, function (error, results) {
    if (error) return console.log(error), res.status(400).send();
    results = results.length > 0 ? results[0] : results;
    req.session.restaurant_signup_id = results.id;
    res.json(results);
  });
};
