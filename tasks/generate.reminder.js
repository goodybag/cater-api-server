var fs    = require('fs');
var path  = require('path');

var options = {
  name: 'generate.reminder'
, description: [
    'Generate a reminder worker file\n'
  , '  Usage: grunt generate.reminder:filename'
  ].join('')
, dest: 'workers/reminder/reminders'
};

var tmpl = function( data ){
  return [
    "/**"
  , " * My Reminder"
  , " *"
  , " * Description:"
  , " *   Checks for pending something or another and"
  , " *   sends a reminder to the concerning party"
  , " */"
  , ""
  , "module.exports.name = 'My Reminder';"
  , ""
  , "// Ensures typeof storage.lastNotified === 'object'"
  , "module.exports.schema = {"
  , "  lastNotified: true"
  , "};"
  , ""
  , "module.exports.check = function( storage, callback ){"
  , "  callback( null, false );"
  , "};"
  , ""
  , "module.exports.work = function( storage, callback ){"
  , "  var stats = {"
  , "    myStat: { text: 'My Statistic', value: 0 }"
  , "  };"
  , ""
  , "  stats.myStat.value++;"
  , ""
  , "  callback( null, stats );"
  , "};"
  ].join('\n');
};

module.exports = function( grunt ){
  grunt.registerTask( options.name, options.description, function(){
    if ( !fs.existsSync( options.dest ) ){
      fs.mkdirSync( options.dest );
    }

    Array.prototype.slice.call( arguments ).forEach( function( filename ){
      var dest = path.join( options.dest, filename ) + '.js';
      grunt.log.writeln( 'Creating', dest );
      fs.writeFileSync( dest, tmpl({ name: filename[0].toUpperCase() + filename.slice(1) }) );
    });
  });
};