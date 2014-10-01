/**
 * TableView
 *
 * This is an editable table view. It depends on TableRowView.
 * This is more like a data table. I wrote this guy real quick and
 * it should eventually be replaced by a DataView Backbone plugin.
 * I started doing that, but I realized that it was just a little bit
 * overkill for us, so I just stuck with this solution.
 *
 * Usage:
 *   var TableView = require('views/table-view');
 *   var myTable = new TableView({
 *     collection:  someCollection
 *   , template:    myTableTemplate
 *   , rowTemplate: myRowTemplate
 *   });
 *
 *   myTable.render();
 *
 * Extend TableView:
 *   var AwesomeTableView = TableView.extend({
 *     initialize: function( options ){
 *       // Best just to pass default options to super
 *       options = utils.defaults( options, {
 *         template: awesomeTemplate
 *       , rowTemplate: awesomeRowTemplate
 *       });
 *
 *       return TableView.prototype.initialize.call( this, options );
 *     }
 *   });
 *
 * Options:
 *   collection   - Underlying data
 *   template     - Template for the whole table
 *   rowTemplate  - Template for individual rows
 *
 * When your underlying collection resets/adds/removes, the table view
 * will re-render.
 */

define(function(require){
  var utils     = require('utils');
  var RowView   = require('./table-row-view');

  return utils.View.extend({
    tagName: 'table'

  , events: {

    }

  , initialize: function( options ){
      this.options = options;

      if ( !options.collection )
        throw new Error('TableView.initialize - first argument requires property `collection`');
      if ( !options.template )
        throw new Error('TableView.initialize - first argument requires property `template`');
      if ( !options.rowTemplate )
        throw new Error('TableView.initialize - first argument requires property `rowTemplate`');

      this.collection   = options.collection;
      this.template     = options.template;
      this.rowTemplate  = options.rowTemplate;
      this.RowView      = options.RowView || RowView;

      console.log(this.RowView.prototype.events);

      this.collection.on( 'reset',  this.onCollectionReset, this );
      this.collection.on( 'add',    this.onCollectionReset, this );
      this.collection.on( 'remove', this.onCollectionReset, this );

      return this;
    }

  , render: function(){
      var this_   = this;
      var $els    = $();
      var options = utils.clone( this.options );

      options.template = options.rowTemplate;

      this.children = [];

      this.$el.html(
        this.template({
          collection: this.collection.toJSON({ cid: true })
        , options:    this.options
        })
      );

      this.collection.each( function( model ){
        var child = new this_.RowView( utils.extend({
          model: model
        }, options ));

        $els = $els.add( child.render().$el );

        this_.children.push( child );
      });

      this.$el.find('tbody').append( $els );

      return this;
    }

  , getModelFromEvent: function( e ){
      var el = e.target;
      while ( el.tagName !== 'TR' ) el = el.parentElement;
      return this.collection.get({ cid: utils.dom( el ).data('cid') });
    }

  , updateModels: function(){
      this.children.forEach( function( child ){
        child.updateModelWithDom();
      });
    }

  , onCollectionReset: function(){
      this.render();
    }
  });
});