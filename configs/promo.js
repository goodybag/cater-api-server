var isDev = process.env['GB_ENV'] === 'dev';

module.exports = {
  email: isDev ? 'test@goodybag.com' : 'jacob@goodybag.com'
};
