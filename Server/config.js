var fs = require('fs');
var os = require("os");

require.extensions[".json"] = function (m) {
  m.exports = JSON.parse(fs.readFileSync(m.filename));
};

process.env.NODE_ENV = 'development';

var _env    = process.env.NODE_ENV == undefined ? 'production' : process.env.NODE_ENV;
var _config = require("./config.json")[_env]

if(_env == 'production')
  _config.server.port = process.env.PORT || _config.server.port;

if (_config == undefined){
  console.log('Environment: ' + _env + ' Not Defined');
  process.exit(1);
}

module.exports    = _config;
_config.env       = _env;
_config.hostname  = os.hostname();
