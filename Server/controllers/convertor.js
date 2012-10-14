/*
 * GET convert page.
 */

exports.convert = function(req, res){
  console.log(req.user);
  res.render('convertor/convert', { title: 'Convert' , user: req.user});
};

/*
 * GET wait page.
 */

exports.wait = function(req, res){
  res.render('convertor/wait', { title: 'Wait' });
};

/*
 * GET status page
 */

exports.status = function(req, res){
  res.send("status");
  //res.render('convertor/status', { title: 'Status' });
};

/*
 * POST upload
 */

exports.upload = function(req, res){
  //if not logged in,
  //create new job and store it in cookie
  
  res.send('/wait');
  
  //if logged in
  //console.log(req.body);
  //create a new job for this current user
  //res.redirect("/wait");
  // res.render('convertor/wait', { title: 'Upload' });
  //res.render('index', { title: 'Upload File and begin conversion' });
};
