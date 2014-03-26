var fs    = require('fs');
var path  = require('path');

var options = {
  name: 'generate.functional-test'
, description: [
    'Generate a functional test scaffold file\n'
  , '  Usage: grunt generate.functional-test:filename'
  ].join('')
, dest: 'test/functional'
};

var tmpl = function( data ){
  return [
    "/**"
  , " * Functional Test: " + data.name
  , " * "
  , " * This is the description of this test"
  , " */"
  , ""
  , "process.env['GB_ENV'] = 'test';"
  , ""
  , "var assert    = require('assert');"
  , "var test      = require('selenium-webdriver/testing');"
  , "var webdriver = require('selenium-webdriver');"
  , "var config    = require('config');"
  , "var utils     = require('../../utils');"
  , ""
  , "require('../../lib/selenium-utils');"
  , ""
  , "var driver = new webdriver.Builder().withCapabilities("
  , "  webdriver.Capabilities.chrome()"
  , ").build();"
  , ""
  , "driver.manage().window().setSize( 1200, 1000 )"
  , ""
  , "test.after( function(){"
  , "  driver.quit();"
  , "});"
  , ""
  , "test.describe( 'Test Group', function(){"
  , "  it( 'should login and place an order', function( done ){"
  , "    // Test Body"
  , "    driver.get( config.baseUrl );"
  , "  });"
  , "});"
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