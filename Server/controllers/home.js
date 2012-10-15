
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('home/index', { title: 'Home' });
};

/*
 * GET Register Page
 */

exports.register = function(req, res){  
  res.render('home/register', { title: 'Register', message: req.flash('error') });
};

exports.addUser = function(req, res) {
  
  User.create(req.body, function(err, user) {
    if (err && err.length > 0) {
      res.render('home/register', { title: 'Register', message: err.join()});
      return;
    }
    else {
      console.log(user);
      res.redirect('/login');
    }
  });

};
