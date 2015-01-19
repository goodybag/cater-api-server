var assert  = require('assert');
var ppfv    = require('../../lib/parse-palette-from-variables');

describe('Parse Palette From Variables', function(){
  it ('._parse', function(){
    var str = [
      '///////////////'
    , '// Variables //'
    , '///////////////'
    , ''
    , '// Colors'
    , '////////////////////////////////////////////////////'
    , '@white:                     #fff;'
    , '@gray:                      #B7B6AD;'
    , '@gray-dark:                 darken( @gray, 10% );'
    , '@salmon:                    #FC8176;'
    , ''
    , '@off-gray:                  desaturate( @brand-secondary, 50% );'
    , '@body-bg-color:             @white;'
    , ''
    , '// Palette'
    , '////////////////////////////////////////////////////'
    , ''
    , '@palette-black:         #000000;'
    , '@palette-white:         #ffffff;'
    , '@palette-red:           #ed4242;'
    , '@palette-green:         #00916d;'
    , ''
    , '// Brand Colors'
    , '////////////////////////////////////////////////////'
    , '@brand-primary:             @palette-red;'
    ].join('\n');

    var palette = ppfv._parse( str );

    assert.equal( palette[0].name, 'black' );
    assert.equal( palette[0].color, '#000000' );

    assert.equal( palette[1].name, 'white' );
    assert.equal( palette[1].color, '#ffffff' );

    assert.equal( palette[2].name, 'red' );
    assert.equal( palette[2].color, '#ed4242' );

    assert.equal( palette[3].name, 'green' );
    assert.equal( palette[3].color, '#00916d' );
  });
});