var fs    = require('fs')
 , exec   = require('child_process').exec
 , path   = require('path')
 , async  = require('async')
 , wrench = require('wrench')
 , JSON2IOS = require('./json_to_ios').JSON2IOS;

class PSD2IOS {
  constructor(public filePath:string, public exportDir:string) {
    this.jsonPath    = path.join(this.exportDir, 'out.json');
    this.prefsFile   = path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], 'psd2json.json');
    this.preferences = { source: this.filePath, target: this.exportDir, jsonCache: this.jsonPath };
    this.scriptPath  = path.join(__dirname, '../../', 'dist/psd2json.jsx');
    this.setup();
  }

  setup() {
    if (fs.existsSync(this.exportDir))
      wrench.rmdirSyncRecursive(this.exportDir);
    if (!fs.existsSync(this.exportDir))
      fs.mkdirSync(this.exportDir);
    fs.writeFileSync(this.jsonPath, '');
    fs.writeFileSync(this.prefsFile, JSON.stringify(this.preferences));
  }

  tearDown() {
    fs.unlinkSync(this.jsonPath);
    fs.unlinkSync(this.prefsFile);
  }

  convert(done) {
    var execPS = (done)=> {
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
      this.tearDown();
      var a = new JSON2IOS(results[2]);
      done(a.convert());
    });
  }
}

exports.PSD2IOS = PSD2IOS;
