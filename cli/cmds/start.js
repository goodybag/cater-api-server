var opn = require('opn');

module.exports = function(context) {

  var args = context.args;
  var options = context.options;

  console.log("args", args);
  console.log("opts", options);

  // check if psql is open
  // opn('/Applications/Postgres.app/', function(err) {
  //   console.log("Looks like Postgres can't be found. You can install it here: http://postgresapp.com/");
  // });

  // check if redis-server is open
  // check if mongod is open

  context.end();
};
