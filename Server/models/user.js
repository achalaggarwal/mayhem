var crypto = require('crypto');
var SendGrid = require('sendgrid').SendGrid;

/*
 * User Reset Account
 */

User.resetAccount = function(email, cb) {
  if (validEmail(email)) {
    User.findByEmail(email, function(err, user) {
      if (err) { cb("Email address is not found."); return;}
      user.randomPassword();
      cb("The new password has been emailed to you");
    });
  }
  else {
    cb("Email address is invalid");
  }
};

/*
 * User set Random Password
 */
 
User.prototype.randomPassword = function() {
  this.updatePassword(randomString(8), function(err, success) {
    if (success) {
      //send new password in email
      var sendgrid = new SendGrid('bhaveshdhupar', '~bhavesh');
      sendgrid.send({
        to: me.email,
        from: 'support@kinesis.io',
        subject: 'Account Password Reset Request',
        text: 'You account password has been reset. The new password is ' + newPassword
      }, function(success, message) {
        if (!success) {
          console.log(message);
        }
      });
    }
  });
};

/*
 * User Update Password
 */

User.prototype.updatePassword = function(password, cb) {
  var me = this;
  var salt = me.salt;
  var newPassword = password;
  
  if (newPassword.length < 5) {
    cb("Password should be at least than 5 characters", false);
    return;
  }
  
  me.passwordHash = md5(newPassword + salt);
  me.save(function(err) {
    if (err) {
      cb(err, false);
      return;
    }
    cb(null, true);
  });
};

/*
 * User authenticate
 */

User.prototype.authenticate = function(password) {
  _passwordHash = md5(password + this.salt);
  return (_passwordHash === this.passwordHash);
};

/*
 * Add new User
 */

User.create = function(params, cb) {
  User.validate(params, function(err) {
    if(err.length > 0) {
      cb(err, null);
    }
    else {
      User.available(params, function(err) {
        if(err) {
          cb(err, null);
        }
        else {
          var salt = randomSalt();
          var userData =  {
                            username: params.username,
                            passwordHash: md5(params.password + salt),
                            salt: salt,
                            email: params.email
                          };
    
          var _user = new User(userData);
          _user.save(function (err) {
            if (err) {
              console.log(err);
              cb(err, null);
            }
            else {
              console.log(_user.username + " added!");
              cb(null, _user);
            }
          });
        }
      });
    }
  });
};

/*
 * Check availability
 */
 
User.available = function(params, cb) {
  User.findByUsername(params.username, function(err, user) {
    if(user) {
      cb(["Username is already used"]);
    }
    else {
      //validate everything else
      User.findByEmail(params.email, function(err, user) {
        if(user) {
          cb(["Email is already used"]);
        }
        else {
          cb(null);
        }
      });
    }
  });
};

/*
 * Validate Email
 */

var validEmail = function(email) {
  var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return filter.test(email);
};

/*
 * Validate User
 */

User.validate = function(params, cb) {
  var err = [];
  
  if(!params.hasOwnProperty('username') || params.username.length === 0) {
    err.push("Username is missing");
  }
  
  if (params.password.username < 5) {
    err.push("Username should be at least than 5 characters");
  }
  
  if (!params.hasOwnProperty('password') || params.password.length === 0) {
    err.push("Password is missing");
  }
  
  if (params.password.length < 5) {
    err.push("Password should be at least than 5 characters");
  }
  
  if (!params.hasOwnProperty('email') || params.email.length === 0) {
    err.push("Email is missing");
  }
  else {
    //email validation
    if (!validEmail(params.email)) {
      err.push('Email is invalid');
    }
  }

  cb(err);
};

/*
 * Find by Id
 */

User.findById = function(id, cb) {
  User.findOne({ '_id': id }, function (err, _user) {
    if (err) {
      cb(err);
      return;
    }
    
    cb(null, _user);
  });
};

/*
 * Find by Username
 */

User.findByUsername = function(username, cb) {
  User.findOne({ 'username': username }, function (err, _user) {
    if (err) {
      cb(null, null);
      return;
    }
    
    cb(null, _user);
  });
};

/*
 * Find by Email
 */

User.findByEmail = function(email, cb) {
  User.findOne({ 'email': email }, function (err, _user) {
    if (err) {
      cb(null, null);
      return;
    }
    cb(null, _user);
  });
};

/*
 * Get MD5 for input string
 */

var md5 = function(input) {
  return crypto.createHash('md5').update(input).digest("hex");
};

/*
 * Generate Random String of length
 */
 
var randomString = function(length) {
  return Math.random().toString(36).substr(2, Math.min(length, 16));
};

/*
 * Generate Random Salt string
 */

var randomSalt = function() {
  return randomString(5);
};

/*
 * If no users are found on initial launch, add base users
 */

User.find(function(err, users) {
  if (err) console.log(err);
  
  if(users.length === 0) {
    //Add base users
    var salt = randomSalt();
    var baseUsers = [
                      { username: 'bob', passwordHash: md5('secret' + salt), salt: salt, email: 'admin@domain.com' }
                    , { username: 'joe', passwordHash: md5('birthday' + salt), salt: salt, email: 'admin@domain.com' }
                    ];
    
    for (var i = baseUsers.length - 1; i >= 0; i--) {
      console.log(baseUsers[i]);
      var _user = new User(baseUsers[i]);
      _user.save(function (err) {
        if (err) console.log(err);
        console.log(_user.username + "added!");
      });
    }
  }
});
