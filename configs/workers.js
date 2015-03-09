/**
 * Config.Workers
 */
var isProduction = process.env['GB_ENV'] === 'production';

module.exports = {
    debit: {
      enqueue: {
        // 30 minutes in production
        interval: isProduction ?  1000 * 50 * 30 : 1000 * 5
      }
    , process: {
        // 20 seconds (~900k request/month) in production
        interval: isProduction ? 1000 * 20 : 1000 * 5
      }
    }
};
