define(function(require){
  'use strict';

  var utils = require('utils');
  var Hbs   = require('handlebars');

  var exports = utils.View.extend({
    events: {

    }

  , noteTmpl: function( note, indent ){
      indent = indent || 0;

      return [
        '<tr>'
      , '  <td>' + note.email.recipients.join(', ') + '</td>'
      , '  <td>' + note.name + '</td>'
      , '  <td>' + note.name + '</td>'
      , '</tr>'
      ].map( function( str ){
        return new Array( indent + 1 ).join(' ') + str;
      }).join('\n')
    }

  , template: function( data ){
      var tmpl = [
        '<table class="table">'
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

      data.notifications.forEach( function( note ){
        tmpl.push( this.noteTmpl( note, 4 ) );
      });

      tmpl.push('  </tbody>');
      tmpl.push('</table>');

      return tmpl.join('\n');
    }

  , initialize: function( options ){
      this.options = options;

      return this;
    }

  , render: function(){

    }
  });

  return exports;
});