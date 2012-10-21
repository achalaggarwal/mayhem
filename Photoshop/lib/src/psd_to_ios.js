var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');
var async = require('async');
var wrench = require('wrench');

var PSD2IOS = (function () {
    function PSD2IOS(filePath) {
        this.filePath = filePath;
        this.exportDir = path.dirname(this.filePath) + '/export';
        this.jsonDir = this.exportDir + '/json';
        this.jsonPath = this.jsonDir + '/out.json';
        this.prefsFile = path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], 'psd2json.json');
        this.preferences = {
            path: this.filePath
        };
        this.scriptPath = path.join(__dirname, '../../', 'dist/psd2json.jsx');
        this.setup();
    }
    PSD2IOS.prototype.setup = function () {
        wrench.rmdirSyncRecursive(this.exportDir);
        fs.mkdirSync(this.exportDir);
        fs.mkdirSync(this.jsonDir);
        fs.appendFileSync(this.jsonPath, '');
        fs.writeFileSync(this.prefsFile, JSON.stringify(this.preferences));
    };
    PSD2IOS.prototype.start = function (done) {
        var _this = this;
        var execPS = function (done) {
            console.log();
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
            done(results[2]);
        });
    };
    return PSD2IOS;
})();
