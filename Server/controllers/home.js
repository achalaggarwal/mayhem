
/*
 * GET home page.
 */

exports.index = function(req, res){
  
  // User.findByUsername("joe", function(err, user){
  //   if (err) { console.log(err); return; }
    
  //   if (user) {
  //     console.log(user);
  //     console.log(user.authenticate('birthday'));
  //   }
  // });
  
  res.render('index', { title: 'Home' });
};
