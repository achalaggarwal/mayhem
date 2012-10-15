var crypto = require('crypto');
  
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
 * Validate User
 */

User.validate = function(params, cb) {
  var err = [];
  
  if(!params.hasOwnProperty('username') || params.username.length === 0) {
    err.push("Username is missing");
  }
  
  if (!params.hasOwnProperty('password') || params.password.length === 0) {
    err.push("Password is missing");
  }
  
  if (!params.hasOwnProperty('email') || params.email.length === 0) {
    err.push("Email is missing");
  }
  else {
    //email validation
    var email = params.email;
    var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    
    if (!filter.test(email)) {
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
 * Generate Random Salt string
 */

var randomSalt = function() {
  return Math.random().toString(36).substr(2, 5);
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
