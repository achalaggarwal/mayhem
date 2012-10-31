/*
 * Job Model
 */
 
 /*
  * Job Status
  */
  
var jobStatus = {
  "Initiated" : 0,
  "Uploading" : 1,
  "Failed" : 2,
  "PSDProcessing" : 3,
  "JSONProcessing" : 4,
  "Complete" : 5
};

/*
 * Status Message
 */
 
Job.prototype.statusMessage = function() {
  
  // if (this.status === 0)
  //   this.process();
  
  var keys = [];
  for(var i in jobStatus) if (jobStatus.hasOwnProperty(i))
  {
    keys.push(i);
  }

  for (var i = keys.length - 1; i >= 0; i--) {
    if (jobStatus[keys[i]] == this.status) {
      return keys[i];
    }
  }
};

Job.prototype.saveStatus = function(val) {
  this.status = val;
  this.save(function(err) {
    if(err) console.log(err);
  });
};

Job.prototype.saveOutput = function(filename) {
  this.output = filename;
  this.save(function(err) {
    if(err) console.log(err);
  });
};

/*
 * Process Job
 */

Job.prototype.process = function() {
  //start processing the job
  //when job process complete
  //set job status as 4
  var me = this;
  setTimeout(function() {
    me.saveStatus(1);
    setTimeout(function() {
      me.saveStatus(2);
      setTimeout(function() {
        me.saveStatus(3);
        setTimeout(function() {
          me.saveStatus(4);
          setTimeout(function() {
            me.saveStatus(5);
          }, 3000);
        }, 3000);
      }, 3000);
    }, 3000);
  }, 3000);
};

/*
 * Job Completed? Poll
 */
 
Job.prototype.completed = function() {
  return this.status === jobStatus["Complete"]; //Job Status from the enum
};

/*
 * Add new Job
 */

Job.create = function(params, cb) {
  var _job = new Job(params);
  _job.save(function(err) {
    if(err) {
      console.log(err);
      cb(err, null);
    }
    else {
      console.log(_job);
      cb(null, _job);
    }
  });
};
