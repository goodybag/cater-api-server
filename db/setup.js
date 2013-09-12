var createTypes = require('./create-types');
var createTables = require('./create-tables');
var createDb = require('./destroy-create-db');

var run = function() {
  createDb.run(function(error){
    if (error) return process.exit(1);
    createTypes.run(function(error, results) {
      if (error) return process.exit(1);
      createTables.run(function(error, results) {
        return process.exit( (error) ? 1 : 0);
      });
    });
  })
};

if (require.main === module) {
  run();
}
