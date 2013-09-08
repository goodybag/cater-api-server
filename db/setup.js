var createTypes = require('./create-types');
var createTables = require('./create-tables');

var run = function() {
  createTypes.run(function(error, results) {
    if (error) return process.exit(1);
    createTables.run(function(error, results) {
      return process.exit( (error) ? 1 : 0);
    });
  });
};

if (require.main === module) {
  run();
}
