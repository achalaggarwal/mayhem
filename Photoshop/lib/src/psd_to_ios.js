var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');
var async = require('async');
var wrench = require('wrench');
var JSON2IOS = require('./json_to_ios').JSON2IOS;

var PSD2IOS = (function () {
    function PSD2IOS(filePath, exportDir) {
        this.filePath = filePath;
        this.exportDir = exportDir;
        this.imagesDir = path.join(this.exportDir, 'images');
        this.jsonPath = path.join(this.exportDir, 'out.json');
        this.prefsFile = path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], 'psd2json.json');
        this.preferences = {
            source: this.filePath,
            target: this.exportDir,
            jsonCache: this.jsonPath
        };
        this.scriptPath = path.join(__dirname, '../../', 'dist/psd2json.jsx');
        this.setup();
    }
    PSD2IOS.prototype.setup = function () {
        if(fs.existsSync(this.imagesDir)) {
            wrench.rmdirSyncRecursive(this.imagesDir);
        }
        if(!fs.existsSync(this.exportDir)) {
            fs.mkdirSync(this.exportDir);
        }
        if(!fs.existsSync(this.imagesDir)) {
            fs.mkdirSync(this.imagesDir);
        }
        fs.writeFileSync(this.jsonPath, '');
        fs.writeFileSync(this.prefsFile, JSON.stringify(this.preferences));
    };
    PSD2IOS.prototype.tearDown = function () {
        fs.unlinkSync(this.jsonPath);
        fs.unlinkSync(this.prefsFile);
    };
    PSD2IOS.prototype.convert = function (done) {
        var _this = this;
        var execPS = function (done) {
            exec('open ' + _this.scriptPath, function (error, stdout, stderr) {
                done();
            });
        };
        var watchFile = function (done) {
            var watcher = fs.watch(_this.jsonPath, function (event) {
                if(event === 'change') {
                    watcher.close();
                    done();
                }
            });
        };
        var getData = function (done) {
            setTimeout(function () {
                fs.readFile(_this.jsonPath, 'utf8', function (err, data) {
                    done(null, JSON.parse(data));
                });
            }, 1000);
        };
        async.series([
            execPS, 
            watchFile, 
            getData
        ], function (err, results) {
            _this.tearDown();
            var a = new JSON2IOS(results[2]);
            done(a.convert());
        });
    };
    return PSD2IOS;
})();
exports.PSD2IOS = PSD2IOS;
