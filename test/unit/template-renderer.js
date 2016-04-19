'use strict';

var assert = require('assert');
var TemplateRenderer = require('../../lib/template-renderer');

describe('TemplateRenderer', function(){
  describe('TemplatingEngine', function(){
    describe('Handlebars', function(){
      it('.render()', function( done ){
        var engine = TemplateRenderer.Engines.Handlebars.create();
        var layout = 'foo {{{body}}} baz';
        var view = 'is: {{someVar}}';
        var result = engine.render( layout, view, {
          someVar: 'bar'
        });

        assert.equal( result, 'foo bar baz' );
      });
    });
  });

});