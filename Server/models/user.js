module.exports = function(_User) {
  
  var md5 = function(input) {
    var crypto = require('crypto');
    return crypto.createHash('md5').update(input).digest("hex");
  };
  
  _User.find(function(err, users) {
    if (err) console.log(err);
    
    if(users.length == 0) {
      // add initial users
      var baseUsers = [
                        { username: 'bob', passwordHash: md5('secret'), email: 'bob@example.com' }
                      , { username: 'joe', passwordHash: md5('birthday'), email: 'joe@example.com' }
                      ];
      
      for (var i = baseUsers.length - 1; i >= 0; i--) {
        var _user = new User(baseUsers[i]);
        _user.save(function (err) {
          if (err) console.log(err);
          console.log(_user.username + "added!");
        });
      }
    }
  });
  
  _User.prototype.say = function(words) {
      console.log(words);
  };
    
  User = _User;
};
