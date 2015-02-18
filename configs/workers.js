/**
 * Config.Workers
 */
var isDev = process.env['GB_ENV'] === 'dev';

module.exports = {
    debit: {
      enqueue: {
        interval: isDev ? 1000 * 5 : 1000 * 50 * 30   // 30 minutes
      }
    , process: {
        interval: isDev ? 1000 * 5 : 1000 * 20      // 20 seconds (~900k request/month)
      }
    }
  , payment: {
      declined: {
        interval: isDev ? 1000 * 10 : 1000 * 86400   // 1 day
      }  
    }
};
