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
  , "var config    = require('../config');"
  , "var utils     = require('../../utils');"
  , "var tutils    = require('../../lib/test-utils');"
  , ""
  , "require('../../lib/selenium-utils');"
  , ""
  , "test.describe( 'Test Group', function(){"
  , "  it( 'Test case', function( done ){"
  , "    var options = {"
  , "      timeout:      100000"
  , "    , email:        config.testEmail"
  , "    , password:     'password'"
  , "    , win: {"
  , "        width:      1200"
  , "      , height:     1000"
  , "      }"
  , "    };"
  , ""
  , "    this.timeout( options.timeout );"
  , ""
  , "    var driver = new webdriver.Builder().withCapabilities("
  , "      webdriver.Capabilities.chrome()"
  , "    ).build();"
  , ""
  , "    driver.manage().window().setSize( options.win.width, options.win.height );"
  , ""
  , "    test.after( function(){"
  , "      driver.quit();"
  , "    });"
  , ""
  , "    // Test Body"
  , "    driver.get( config.baseUrl );"
  , ""
  , "    utils.async.series(["
  , "      tutils.login.bind( null, driver, options )"
  , "    ], done );"
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