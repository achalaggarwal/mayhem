var AppConfig = require('../config.js');
var mongoose = require('mongoose');

var db = mongoose.createConnection(AppConfig.mongo.path);
  
db.on('error', console.error.bind(console, 'connection error:'));

/*
 * User Schema
 */

var userSchema = new mongoose.Schema({
  username: String,
  passwordHash: String,
  salt: String,
  email: String,
  jobs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Job'}]
});

User = db.model('User', userSchema);

/*
 * Job Schema
 */

var jobSchema = new mongoose.Schema({
  status: Number,
  filePath: String,
  thumbnail: String,
  owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

Job = db.model('Job', jobSchema);
