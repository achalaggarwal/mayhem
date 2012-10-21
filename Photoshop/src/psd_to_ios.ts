var fs  = require('fs')
, exec  =  require('child_process').exec
, path  = require('path')
, async = require('async')
,wrench = require('wrench');

class PSD2IOS {
  constructor(public filePath:string) {
    this.exportDir = path.dirname(this.filePath) + '/export';
    this.jsonDir   = this.exportDir + '/json';
    this.jsonPath  = this.jsonDir + '/out.json';

    this.setup();
  }

  setup() {
    wrench.rmdirSyncRecursive(this.exportDir);
    fs.mkdirSync(this.exportDir);
    fs.mkdirSync(this.jsonDir);
    fs.appendFileSync(this.jsonPath, '');
  }

  start() {
    var execPS = (done)=>{
      exec('open /Users/gogo/code/node/ProjectMayhem/Photoshop/dist/psd2json.jsx', (error, stdout, stderr)=> {
        done();
      });
    }

    var getData = (done)=>{
      var watcher = fs.watch(this.jsonPath, (event)=> {
        if (event === 'change') {
          watcher.close();
          console.log(this.jsonPath);
          var data = fs.readFileSync(this.jsonPath, 'utf8');
          done(data);
        }
      });
    }

    async.series([execPS, getData], (err, results)=> {
      console.log(results[1]);
    });
  }
}

var a = new PSD2IOS('/Users/gogo/Desktop/photoshop/source1.psd');
a.start();
