var db = require ('./db');

module.exports = function( $query, $options ) {
  $query = $query || {};
  $options = $options || { order: 'name asc' };
  return db.regions.find($query, $options);
}
