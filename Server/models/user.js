var crypto = require('crypto');

module.exports = function(_User) {
  
  _User.prototype.authenticate = function(password) {
    _passwordHash = md5(password + this.salt);
    return (_passwordHash === this.passwordHash);
  };
  
  _User.findById = function(id, cb) {
    _User.findOne({ '_id': id }, function (err, _user) {
      if (err) {
        cb(err);
        return;
      }
      
      cb(null, _user);
    });
  };
  
  _User.findByUsername = function(username, cb) {
    _User.findOne({ 'username': username }, function (err, _user) {
      if (err) {
        cb(null, null);
        return;
      }
      
      cb(null, _user);
    });
  };
  
  _User.prototype.say = function(words) {
      console.log(words);
  };
  
  var md5 = function(input) {
    return crypto.createHash('md5').update(input).digest("hex");
  };
  
  var randomSalt = function() {
    return Math.random().toString(36).substr(2, 5);
  };
  
  //If no users are found on initial launch, add base users
  _User.find(function(err, users) {
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
    
  User = _User;
};
