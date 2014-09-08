var db = require ('./db');

module.exports = db.regions.find({ is_hidden: false }, { order: 'name asc' });
