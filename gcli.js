var gcli = require('./cli/app');
var isMac = /^darwin/.test(process.platform);
var yosay = require('yosay');

if(isMac) {
  gcli();
} else {
  console.log(yosay("Huh. Your platform isn't currently supported. Maybe later?"));
}
