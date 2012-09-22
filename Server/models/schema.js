var AppConfig = require('../config.js');
var mongoose = require('mongoose');

module.exports = function() {
  
  console.log(AppConfig.mongo.path);
  
  var db = mongoose.createConnection(AppConfig.mongo.path);
  
  db.on('error', console.error.bind(console, 'connection error:'));  
  
  var userSchema = new mongoose.Schema({
    username: String,
    passwordHash: String,
    salt: String,
    email: String,
    jobs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Job'}]
  });
  
  var User = db.model('User', userSchema);
  
  var jobSchema = new mongoose.Schema({
    status: Number,
    filePath: String,
    thumbnail: String,
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
  });
  
  var Job = db.model('Job', jobSchema);
  
  return {
    User: User,
    Job: Job
  };

};
