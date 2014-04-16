define(function(require){
  'use strict';

  var utils = require('utils');
  var Hbs   = require('handlebars');

  var exports = utils.View.extend({
    events: {

    }

  , template: Hbs.partials.notification_history_table

  , noteTmpl: function( note, indent ){
      indent = indent || 0;

      return [
        '<tr>'
      , '  <td>' + (Array.isArray( note.email.to ) ? note.email.to.join(', ') : note.email.to) + '</td>'
      , '  <td>' + note.name + '</td>'
      , '  <td>' + note.send_date + '</td>'
      , '  <td class="actions">'
      , '    <button class="btn btn-small btn-default">Preview</button>'
      , '    <button class="btn btn-small btn-primary">Send</button>'
      , '  </td>'
      , '</tr>'
      ].map( function( str ){
        return new Array( indent + 1 ).join(' ') + str;
      }).join('\n')
    }

  , template2: function( data ){
      var tmpl = [
      , '  <thead>'
      , '    <tr>'
      , '      <th>Recipients</th>'
      , '      <th>Name</th>'
      , '      <th>Send Date</th>'
      , '      <th>Actions</th>'
      , '    </tr>'
      , '  </thead>'
      , '  <tbody>'
      ];

      var this_ = this;
      data.items.forEach( function( note ){
        tmpl.push( this_.noteTmpl( note, 4 ) );
      });

      tmpl.push('  </tbody>');

      return tmpl.join('\n');
    }

  , initialize: function( options ){
      this.options = options || {};
      this.items = this.options.items || [];

      return this;
    }

  , setItems: function( items ){
      this.items = items;
      this.render();
      return this;
    }

  , render: function(){
      this.$el.html( this.template({ items: this.items } ) );
      return this;
    }
  });

  return exports;
});