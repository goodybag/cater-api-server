var Renderer    = require('./template-renderer');

var viewsDir = __dirname + '/../views';

var templates = Renderer.create({
  engine:         Renderer.Engines.Handlebars.create({
                    viewDirectory:  viewsDir
                  , partialsDir:    __dirname + '/../../public/partials'
                  })
, viewDirectory:  viewsDir
});

module.exports = templates;