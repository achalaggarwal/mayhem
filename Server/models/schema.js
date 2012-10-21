var AppConfig = require('../config.js');
var mongoose = require('mongoose');
var moment = require('moment');

var db = mongoose.createConnection(AppConfig.mongo.path);
  
db.on('error', console.error.bind(console, 'connection error:'));

/*
 * User Schema
 */

var userSchema = new mongoose.Schema({
  username          : {type: String},
  passwordHash      : String,
  salt              : String,
  email             : {type: String},
  credits           : {type: Number, default: 50},
  jobs              : [{type: mongoose.Schema.Types.ObjectId, ref: 'Job'}],
  created_at        : { type: Date, required: true, default: Date.now }
});

User = db.model('User', userSchema);

/*
 * Job Schema
 */

var jobSchema = new mongoose.Schema({
  status            : {type: Number, default: 0},
  filename          : String,
  url               : String,
  output            : String,
  thumbnail         : String,
  owner             : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  created_at        : { type: Date, required: true, default: Date.now }
});

Job = db.model('Job', jobSchema);

var createdAt = function(format) {
  return moment(this.created_at).format(format);
};

Job.prototype.createdAt   = createdAt;
User.prototype.createdAt  = createdAt;
