module.exports = {
  createExtensions:     require('./create-extensions')
, createTables:         require('./create-tables')
, createTypes:          require('./create-types')
, createViews:          require('./create-views')
, destroyCreateDb:      require('./destroy-create-db')
, loadFixtures:         require('./load-fixtures')
, loadFunctions:        require('./load-functions')
, loadUtilityFunctions: require('./load-utility-functions')
, loadTriggers:         require('./load-triggers')
, setLatestDelta:       require('./set-latest-delta')
, runDeltas:            require('./run-deltas')
};