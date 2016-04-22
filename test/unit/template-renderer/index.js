'use strict';

var assert = require('assert');
var TemplateRenderer = require('../../../lib/template-renderer');

class TestEngine extends TemplateRenderer.Engines.Base {
  constructor(){
    super({ extension: 'tmpl' });
  }

  render( layout, view, context ){
    var renderContext = Object.assign( {}, context );
    var onKey = ( result, k )=> result.replace( new RegExp( ':' + k, 'g' ), renderContext[ k ] );

    renderContext.body = Object.keys( context ).reduce( onKey, view );

    return Object.keys( renderContext ).reduce( onKey, layout )
  };
}

describe('TemplateRenderer', function(){
  it('TemplateRenderer.render()', function( done ){
    var templates = TemplateRenderer
      .create({
        viewDirectory: __dirname
      , engine: new TestEngine()
      })

    var context = {
      layout: 'test-layout'
    , someVar: 'bar'
    };

    templates.render('test-view', context, ( error, result )=>{
      if ( error ) throw error;

      assert.equal( result, [
        '<body>'
      , '  foo bar'
      , ''
      , '</body>'
      , ''
      ].join('\n'));

      done();
    });
  });

  describe('TemplatingEngine', function(){
    describe('Handlebars', function(){
      it('Handlebars.render()', function(){
        var engine = TemplateRenderer.Engines.Handlebars.create();
        var layout = 'foo {{{body}}} baz';
        var view = 'is: {{someVar}}';
        var result = engine.render( layout, view, {
          someVar: 'bar'
        });

        assert.equal( result, 'foo is: bar baz' );
      });

      it('.registerPartials() should work', function(){
        var engine = TemplateRenderer.Engines.Handlebars.create({
          viewDirectory: __dirname
        });

        var layout = 'foo {{{body}}} baz';
        var view = 'is: {{someVar}} {{> foo}} {{> sub_views_bar}}';
        var result = engine.render( layout, view, {
          someVar: 'bar'
        });

        assert.equal( result, 'foo is: bar foo bar baz' );
      });
    });
  });
});
