var AppConfig = require('./config.js');

var cluster = require('cluster');
var numCPUs = AppConfig.env == 'development' ? 1 : require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('death', function(worker) {
    console.log('worker ' + worker.pid + ' died');
    setTimeout(function(){
      console.log('restarting worker ....');
      cluster.fork();
    }, 100);
  });
} else {
  // server setup
  require('./server.js');
}
