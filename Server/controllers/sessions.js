module.exports = function (passport) {
  return {
    /*
     * GET login page.
     */
     
    "login" : function(req, res) {
      res.render('sessions/login', { title: 'Login' , user: req.user, message: req.flash('error')});
    },
    
    /*
     * POST create
     */
        
    "create" : function(req, res) {
      passport.authenticate('local', { failureRedirect: '/login', failureFlash: true, successRedirect: '/convert' })(req, res);
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
