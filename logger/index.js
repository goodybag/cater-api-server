var setup = require('./setup');

module.exports.routes = setup({app: 'cater', component: 'routes'});
module.exports.models = setup({app: 'cater', component: 'models'});
module.exports.db = setup({app: 'cater', component: 'db'});