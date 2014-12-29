module.exports = {
  name: 'dirac_session'
, schema: {
    id:         { type: 'serial', primaryKey: true }
  , sid:        { type: 'varchar', notNull: true, collate: 'default' }
  , user_id:    { type: 'int', references: { table: 'users', column: 'id' } }
  , data:       { type: 'json', notNull: true, default: '\'{}\'' }
  , expires_at: { type: 'timestamp', notNull: true }
  }
};