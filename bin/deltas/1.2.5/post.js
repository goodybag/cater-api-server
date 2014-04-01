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
  })
}, function( error, results ){
  if ( error ) throw error;

  results.reminder = results.reminder ? ( results.reminder.attributes || {} ) : {};

  reminder.ensureSchema( schema, results.reminder );

  results.users.forEach( function( user ){
    results.reminder.users[ user.attributes.id ] = true;
  });

  reminder.saveStorage( reminderName, result, callback );
});

// Ensure the schema exists for reminder
Models.Reminder.findOne({
  where: { name: reminderName }
}, function( error, result ){
  if ( error ){
    logger.error( 'Error fetching reminders in `markUserAsWelcomed` for userId: ' + userId, error );
    return callback ? callback( error ) : null;
  }

  result = result ? ( result.attributes || {} ) : {};

  reminder.ensureSchema( schema, result );

  reminder.saveStorage( reminderName, result, callback );
});

Models.User.find( usersQuery )