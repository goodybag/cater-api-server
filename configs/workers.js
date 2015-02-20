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
};
