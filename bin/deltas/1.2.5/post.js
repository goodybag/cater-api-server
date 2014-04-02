#!/usr/bin/env node

var utils     = require('../../../utils')
var Models    = require('../../../models')
var welcome   = require('../../../lib/welcome-emailer');
var reminder  = require('../../../workers/reminder/lib/reminder');
var schema    = require('../../../workers/reminder/reminders/welcome-email').schema;

utils.async.parallel({
  'reminder': Models.Reminder.findOne.bind( Models.Reminder, {
    where: { name: 'Welcome Email' }
  })

, 'users': Models.User.find.bind( Models.User, {
    limit: 'all'
  , where: {
      'id::text': {
        $nin: {
          type: 'select'
        , table: 'reminders'
        , columns: [{
            type: 'json_object_keys'
          , expression: 'data->\'users\''
          }]
        , where: {
            name: 'Welcome Email'
          }
        }
      }
    }
  })
}, function( error, results ){
  if ( error ) throw error;

  if ( results.reminder && results.reminder.attributes && results.reminder.attributes.data ){
    results.reminder = results.reminder.attributes.data;
  } else {
    results.reminder = {};
  }

  reminder.ensureSchema( schema, results.reminder );

  results.users.forEach( function( user ){
    results.reminder.users[ user.attributes.id ] = true;
  });

  reminder.saveStorage( 'Welcome Email', results.reminder, function( error ){
    if ( error ) throw error;

    process.exit(0);
  });
});