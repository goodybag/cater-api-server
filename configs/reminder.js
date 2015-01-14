/**
 * Config.Session
 */

var isDev = process.env['GB_ENV'] === 'dev';

module.exports = {
  // What time to schedule the tomorrow orders notification
  tomorrowOrdersTime: '12:00'

, actionNeeded: {
    interval: isDev ? 5 * 60 * 1000 : 60 * 60 * 1000
  , threshold: { value: 1, unit: 'hours' }
  }
};