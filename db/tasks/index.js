module.exports = {
  createExtensions: require('./create-extensions')
, createTables:     require('./create-tables')
, createTypes:      require('./create-types')
, destroyCreateDb:  require('./destroy-create-db')
, loadFixtures:     require('./load-fixtures')
, loadFunctions:    require('./load-functions')
, setLatestDelta:   require('./set-latest-delta')
, runDeltas:        require('./run-deltas')
};