var isDev = process.env['GB_ENV'] === 'dev';

try {
  local = require('../local-config.json');
} catch (error) {
	if (error) local = {};
}

module.exports = {
  email: isDev ? local.testEmail || 'test@goodybag.com' : 'jacobparker@goodybag.com'
};
