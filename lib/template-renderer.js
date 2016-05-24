'use strict';

var fs = require('fs');
var path = require('path');
var wrench = require('wrench');
var async = require('async');
var Handlebars = require('handlebars');

/**
 * @class       TemplateRenderer
 * @description An express-like view renderer that can handle multiple
 *              templating engines and a layout->view structure
 */
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

    if ( !(this.engine instanceof TemplatingEngine) ){
      throw new Error('engine must be instance of TemplatingEngine');
    }
  }

  render( templatePath, context, callback ){
    callback = callback || noop;

    if ( !this.engine ){
      throw new Error('Must specify an engine. Use the .engine() method');
    }

    if ( !context.layout ){
      context.layout = this.defaultLayout;
    }

    var layoutPath = path.join(
      this.viewDirectory, `${context.layout}.${this.engine.extension}`
    );

    var viewPath = path.join(
      this.viewDirectory, `${templatePath}.${this.engine.extension}`
    );

    async.parallel({
      layout: fs.readFile.bind( fs, layoutPath )
    , view:   fs.readFile.bind( fs, viewPath )
    }, ( error, result )=>{
      if ( error ){
        return callback( error );
      }

      var result = this.engine.render(
        result.layout.toString()
      , result.view.toString()
      , context
      );

      return callback( null, result );
    });
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
    this.registerPartials();
  }

  render( layout, view, context ){
    var layoutTmpl = this.hbs.compile( layout, this );
    var viewTmpl = this.hbs.compile( view, this );

    var viewResult = viewTmpl( context );

    return layoutTmpl( Object.assign({ body: viewResult }, context ) );
  }

  registerPartials(){
    if ( this.partialsDirectory ){
      this.hbs.registerPartials( this.partialsDirectory );
    }

    if ( this.viewDirectory ){
      // Register all partials in /views/**.../partials
      // Prefixes partial name with folder structure
      // So views/admin/restaurants/partials/my-partial.hbs is registered as:
      //   admin_restaurants_my_partial
      wrench.readdirSyncRecursive( this.viewDirectory )
        .filter( dir => path.basename( dir ) === 'partials' )
        .map( dir => path.join( this.viewDirectory, dir ) )
        .forEach( ( dir )=>{
          var prefix = [];
          var base;
          var i = 1;
          const MAX_ITERATIONS = 10;

          do {
            if ( i > MAX_ITERATIONS ) break;
            if ( base ) prefix.unshift( path.basename( base ).split('-').join('_') );
            base = path.resolve( dir, new Array( ++i ).join('../') );
          } while ( base !== this.viewDirectory );

          fs.readdirSync( dir )
            .filter( file => path.extname( file ) === '.' + this.extension )
            .forEach( ( file )=>{
              var name = prefix.concat( file.slice( 0, this.extension.length ).split('-') ).join('_');
              this.hbs.registerPartial( name, fs.readFileSync( path.join( dir, file ) ).toString() );
            });
        });
    }
  }
}

function noop(){}

module.exports = TemplateRenderer;

module.exports.Engines = {};

module.exports.Engines.Base = TemplatingEngine;
module.exports.Engines.Handlebars = TemplatingEngineHandlebars;
