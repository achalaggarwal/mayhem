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
     * GET logout
     */
    
    "destroy" : function(req, res) {
      req.logout();
      res.redirect('/');
    }
  };
};
