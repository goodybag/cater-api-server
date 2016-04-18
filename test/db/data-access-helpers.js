var assert = require('assert');
var db = require('../../db');

describe('Data Access Helpers', function(){
  it('.getColumnListForTimezone()', function(){
    assert.deepEqual( db.order_internal_notes.getColumnListForTimezone('America/Chicago'), [
      'id', 'order_id', 'user_id', 'body'
    , { expression: "created_at at time zone 'America/Chicago' as created_at" }
    ]);
  });
});