var isDev = process.env['GB_ENV'] === 'dev';

module.exports = {
  email: isDev ? 'test@goodybag.com' : 'jacobparker@goodybag.com'
};
