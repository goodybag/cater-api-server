'use strict';

var path = require('path');
var async = require('async');
var Handlebars = require('handlebars');

class TemplateRenderer {
  static create( options ){
    return new TemplateRenderer( options );
  }

  constructor( options ){
    options = options || {};

    var defaults = {
      viewDirectory: 'views'
    , defaultLayout: 'layout'
    };

    for ( var k in defaults ){
      if ( !( k in options ) ) options[ k ] = defaults[ k ];
    }

    for ( k in options ){
      this[ k ] = options[ k ];
    }
  }

  render( templatePath, context, callback ){
    callback = callback || noop;

    if ( !this.templatingEngine ){
      throw new Error('Must specify an engine. Use the .engine() method');
    }

    if ( !context.layout ){
      context.layout = this.defaultLayout;
    }

    var layoutPath = path.join(
      this.viewDirectory, context.layout, this.templatingEngine.extension
    );

    var viewPath = path.join(
      this.viewDirectory, templatePath, this.templatingEngine.extension
    );

    async.parallel({
      layout: fs.readFile.bind( fs, layoutPath )
    , view:   fs.readFile.bind( fs, viewPath )
    }, ( error, result )=>{
      if ( error ){
        return callback( error );
      }

      var result = this.templatingEngine.render(
        result.layout.toString()
      , result.view.toString()
      , context
      );

      return callback( null, result );
    });
  }

  engine( engine ){
    if ( !(engine instanceof TemplatingEngine) ){
      throw new Error('engine must be instance of TemplatingEngine');
    }

    this.templatingEngine = engine;

    return this;
  }
}

class TemplatingEngine {
  static create( options ){
    var Constructor = this;
    return new Constructor( options );
  }

  constructor( options ){
    options = options || {};

    for ( var k in options ){
      this[ k ] = options[ k ];
    }

    if ( !this.extension ){
      throw new Error('Engine must specify extension');
    }
  }

  render( layout, view, context ){
    throw new Error('Engine must implement render( layout, view, context )');
  }
}

class TemplatingEngineHandlebars extends TemplatingEngine {
  constructor( options ){
    options = options || {};

    options.extension = 'hbs';

    super( options );

    this.hbs = Handlebars.create();
  }

  render( layout, view, context ){
    var layoutTmpl = this.hbs.compile( layout, this );
    var viewTmpl = this.hbs.compile( view, this );

    var viewResult = viewTmpl( context );

    return layoutTmpl( Object.assign({ body: viewResult }, context ) );
  }
}

function noop(){}

module.exports = TemplateRenderer;

module.exports.Engines = {};

module.exports.Engines.Base = TemplatingEngine;
module.exports.Engines.TemplatingEngineHandlebars = TemplatingEngineHandlebars;
