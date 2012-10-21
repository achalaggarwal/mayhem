var fs    = require('fs')
 , exec   = require('child_process').exec
 , path   = require('path')
 , async  = require('async')
 , wrench = require('wrench');

class PSD2IOS {
  constructor(public filePath:string) {
    this.exportDir   = path.dirname(this.filePath) + '/export';
    this.jsonDir     = this.exportDir + '/json';
    this.jsonPath    = this.jsonDir + '/out.json';
    this.prefsFile   = path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], 'psd2json.json');
    this.preferences = { path: this.filePath };
    this.scriptPath  = path.join(__dirname, '../../', 'dist/psd2json.jsx');
    this.setup();
  }

  setup() {
    wrench.rmdirSyncRecursive(this.exportDir);
    fs.mkdirSync(this.exportDir);
    fs.mkdirSync(this.jsonDir);
    fs.appendFileSync(this.jsonPath, '');
    fs.writeFileSync(this.prefsFile, JSON.stringify(this.preferences));
  }

  start(done) {
    var execPS = (done)=> {
      console.log();
      exec('open ' + this.scriptPath, (error, stdout, stderr)=> {
        done();
      });
    }

    var watchFile = (done)=> {
      var watcher = fs.watch(this.jsonPath, (event)=> {
        if (event === 'change') {
          watcher.close();
          done();
        }
      });
    }

    var getData = (done)=> {
      setTimeout(()=> {
        fs.readFile(this.jsonPath, 'utf8', (err, data)=> {
          done(null, JSON.parse(data));
        });
      }, 1000);
    }

    async.series([execPS, watchFile, getData], (err, results)=> {
      done(results[2]);
    });
  }
}

//var a = new PSD2IOS('/Users/gogo/Desktop/photoshop/source1.psd');
//a.start();
