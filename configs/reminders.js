/**
 * Config.Reminders
 */

var isDev = process.env['GB_ENV'] === 'dev';

module.exports = {
  // What hour to schedule the tomorrow orders notification
  tomorrowOrdersTime: 12

, actionNeeded: {
    threshold: { value: 1, unit: 'hours' }

    // Only run within a given time frame
  , timeframe: {
      start: 6
    , end: 24
    }
  }
};