var async = require('async');
var PSD2IOS = require('../Photoshop/lib/src/psd_to_ios').PSD2IOS;
var request = require('request');
var path = require('path');
var jsonui = require('jsonui');
var fs = require('fs');

(function() {
  var currentJob = null;
  
  var download = function(done) {
    currentJob.saveStatus(1);
    var _tempPath = path.join(__dirname, 'tmp', 'temp.psd');
    //Uncomment the following code to download file from filepicker.io instead of using local file
    var _fileStream = fs.createWriteStream(_tempPath);
    _fileStream.on('error', function (err) {
      done(err);
    });
    
    _fileStream.on('close', function(){
      done(null, _tempPath);
    });
    request(currentJob.url).pipe(_fileStream);
    // done(null, _tempPath);
  };
  
  var toJSON = function(psdpath, done) {
    currentJob.saveStatus(3);
    var _tempPath = path.join(__dirname, 'tmp', 'images');
    var a = new PSD2IOS(psdpath, _tempPath);
    a.convert(function(data){
      done(null, data, _tempPath);
    });
  };

  var toProject = function(data, assetsPath, done) {
    currentJob.saveStatus(4);
    
    var filePath = path.join(__dirname, 'tmp', 'output.json');
    var _assetsPath = path.join(__dirname, 'tmp', 'images');
  
    jsonui.convertToApp(data, assetsPath, function(err, outputPath) {
      if (err) { done(err); return; }
      console.log(outputPath);
      done(null, outputPath);
    });
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
            // Update output path in db record for currentJob
             currentJob.saveStatus(5);
             currentJob = null;
            
            //Remove the next line if you want to continue the processing
            //process.exit(0);
            
            callback(null);
          });
      }
      else {
        setTimeout(callback, 5000);
      }
    });
  };

  var processing = function() {
    async.whilst(
      function() { return true; },
      listenDB,
      function(err) {
        async.nextTick(processing);
      });
  };
  processing();
})();
