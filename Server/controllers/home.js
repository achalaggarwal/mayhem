
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
  var email = req.body.email;
  var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  if (!filter.test(email)) {
    res.render('home/register', { title: 'Register', message: 'Please provide a valid email address'});
    return;
  }
  
  res.redirect("/login");
};
