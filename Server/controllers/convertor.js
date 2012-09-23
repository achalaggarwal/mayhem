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
  res.render('convertor/status', { title: 'Status' });
};

/*
 * POST upload
 */

exports.upload = function(req, res){
  res.render('index', { title: 'Upload File and begin conversion' });
};
