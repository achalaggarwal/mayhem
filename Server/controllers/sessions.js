module.exports = function (passport) {
  return {
    /*
     * GET login page.
     */
     
    "login" : function(req, res) {
      res.render('sessions/login', { title: 'Login' , user: req.user, message: req.flash('error'), object: req.session['object']});
    },
    
    /*
     * POST create
     */
        
    "create" : function(req, res) {
      passport.authenticate('local', { failureRedirect: '/login', failureFlash: true, successRedirect: '/convert' })(req, res);
    },
    
    /*
     * GET Reset Password Form
     */
    "resetPassword" : function(req, res) {
      res.render('sessions/reset_password', {title: 'Reset Password', message: null});
    },
    
    /*
     * POST Reset Account Password
     */
    "generatePassword" : function(req, res) {
      User.resetAccount(req.body.email, function(message) {
        res.render('sessions/reset_password', {title: 'Reset Password', message: message});
      });
    },
    
    /*
     * GET Account Page
     */
    
    "account" : function(req, res) {
      res.render('sessions/account', { title: 'Account Management', message: null , user: req.user});
    },
    
    /*
     * POST Account Page
     */
    
    "updateAccount" : function(req, res) {
      //update the password for current user
      console.log(req.body);
      if (req.body.password) {
        var currentUser = req.user;
        currentUser.updatePassword(req.body.password, function(err, success) {
          if (success)
            res.render('sessions/account', { title: 'Account Management', message: "Account has been updated.", user: req.user});
          else
            res.render('sessions/account', { title: 'Account Management', message: err, user: req.user});
        });
      }
      else {
        res.render('sessions/account', { title: 'Account Management', message: "Password can not be empty" , user: req.user});
      }
    },
    
    /*
     * GET logout
     */
    
    "destroy" : function(req, res) {
      req.logout();
      res.redirect('/');
    }
  };
};
