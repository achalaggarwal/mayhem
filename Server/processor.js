var async = require('async');
var PSD2IOS = require('../Photoshop/lib/src/psd_to_ios').PSD2IOS;
var request = require('request');
var path = require('path');
var jsonui = require('jsonui');
var fs = require('fs');

(function() {
  var currentJob = null;
  
  var download = function(done) {
    // currentJob.saveStatus(1);
    
    var _tempPath = path.join(__dirname, 'tmp', 'temp.psd');
    // var _fileStream = fs.createWriteStream(_tempPath);
    // _fileStream.on('error', function (err) {
    //   done(err);
    // });
    
    // _fileStream.on('close', function(){
    //   done(null, _tempPath);
    // });
    
    // request(currentJob.url).pipe(_fileStream);
    console.log("download to location");
    
    done(null, _tempPath);
  };
  
  var toJSON = function(psdpath, done) {
    // currentJob.saveStatus(3);
    var _tempPath = path.join(__dirname, 'tmp');
    console.log(_tempPath);
    var a = new PSD2IOS(psdpath, _tempPath);
    a.convert(function(data){
      console.log(data);
      done(null, data, _tempPath);
    });
    // done(null, 'convert to json');
  };

  var toProject = function(data, assetsPath, done) {
    // currentJob.saveStatus(4);
    console.log(data);
    done(null, 'done');
    
    // console.log("convert to project");
    
    // jsonui.convertToApp(__dirname + '/input.json', function(err, outputPath) {
    // if (err) { console.log(err); return; }
    //   console.log(outputPath);
    // });
    
    
    // // currentJob.saveStatus(5);
    // currentJob = null;

  };

  var listenDB = function(callback) {
    console.log("listening...");
    Job.findOne({status: 0}, function(err, job) {
      if (err) console.log(err);
      if (job) {
        currentJob = job;
        //async series
        async.waterfall([
            download,
            toJSON,
            toProject
          ],
          function(err, results) {
            console.log(err);
            console.log(results);
            callback(null);
          });
      }
      else {
        setTimeout(callback, 5000);
      }
    });
  };

  var processing;
  processing = function() {
    console.log("called processing");
    console.log(listenDB);
    async.whilst(
      function() { return true; },
      listenDB,
      function(err) {
        async.nextTick(processing);
      });
  };
  
  processing();
})();
