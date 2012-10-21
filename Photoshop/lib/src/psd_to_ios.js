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
        this.setup();
    }
    PSD2IOS.prototype.setup = function () {
        wrench.rmdirSyncRecursive(this.exportDir);
        fs.mkdirSync(this.exportDir);
        fs.mkdirSync(this.jsonDir);
        fs.appendFileSync(this.jsonPath, '');
    };
    PSD2IOS.prototype.start = function () {
        var _this = this;
        var execPS = function (done) {
            exec('open /Users/gogo/code/node/ProjectMayhem/Photoshop/dist/psd2json.jsx', function (error, stdout, stderr) {
                done();
            });
        };
        var getData = function (done) {
            var watcher = fs.watch(_this.jsonPath, function (event) {
                if(event === 'change') {
                    watcher.close();
                    console.log(_this.jsonPath);
                    var data = fs.readFileSync(_this.jsonPath, 'utf8');
                    done(data);
                }
            });
        };
        async.series([
            execPS, 
            getData
        ], function (err, results) {
            console.log(results[1]);
        });
    };
    return PSD2IOS;
})();
var a = new PSD2IOS('/Users/gogo/Desktop/photoshop/source1.psd');
a.start();
