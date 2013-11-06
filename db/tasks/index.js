module.exports = {
  createTables:     require('./create-tables')
, createTypes:      require('./create-types')
, destroyCreateDb:  require('./destroy-create-db')
, loadFixtures:     require('./load-fixtures')
, setLatestDelta:   require('./set-latest-delta')
, runDeltas:        require('./run-deltas')
};