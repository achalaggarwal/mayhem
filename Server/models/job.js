/*
 * Job Model
 */
 
 /*
  * Job Status
  */
  
var jobStatus = {
  "Uploaded" : 0,
  "Failed" : 1,
  "PSDProcessing" : 2,
  "JSONProcessing" : 3,
  "Complete" : 4
};

/*
 * Process Job
 */

Job.prototype.process = function() {
  //start processing the job
  //when job process complete
  //set job status as 4
  setTimeout(10000, function() {
    this.status = jobStatus["Complete"];
  });
};

/*
 * Job Completed? Poll
 */
 
Job.prototype.completed = function() {
  return this.status === jobStatus["Complete"]; //Job Status from the enum
};

