var crypto = require('crypto');
  
/*
 * User authenticate
 */

User.prototype.authenticate = function(password) {
  _passwordHash = md5(password + this.salt);
  return (_passwordHash === this.passwordHash);
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
