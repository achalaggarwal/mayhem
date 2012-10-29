/*
 * Private Create Job Method
 */
 
var createJob = function(req, res, object) {
  var currentUser = req.user;
    Job.create({url: object.url, filename: object.data.filename, owner: currentUser}, function(err, job) {
      if(err){
        console.log(err);
      }
      else {
        currentUser.jobs.push(job);
        currentUser.save(function(err) {
          if(err) console.log(err);
        });
      }
    });
    res.render('ajaxRedirect', {url: '/wait'});
};

/*
 * GET convert page.
 */

exports.convert = function(req, res){
  if (req.session['object']) {
    createJob(req, res, req.session['object']);
    req.session['object'] = null;
    return;
  }
  
  Job.find({owner: req.user}, function(err, jobs) {
    if (err) console.log(err);
    res.render('convertor/convert', { title: 'Convert' , user: req.user, jobs: jobs});
  });
};

/*
 * GET wait page.
 */

exports.wait = function(req, res){
  var currentUser = req.user;
  Job.find({owner: currentUser, status: { $in: [1,3,4] }}, function(err, jobs) {
    if (err) console.log(err);
    res.render('convertor/wait', { title: 'Wait', jobs: jobs });
  });
};

/*
 * POST status page
 */

exports.status = function(req, res){
  var currentUser = req.user;
  var jobFound = false;
  
  for (var i = currentUser.jobs.length - 1; i >= 0; i--) {
    if (currentUser.jobs[i] == req.body.id) {
      jobFound = true;
    }
  }
  
  if (!jobFound) {
    res.render('ajaxRedirect', {url: '/login'});
    return;
  }

  Job.find({_id: req.body.id}, function(err, jobs) {
    if (err) {
      res.render('ajaxRedirect', {url: '/login'});
    }
    else {
      res.render('convertor/status', {job: jobs[0]});
    }
  });
};

/*
 * POST upload
 */

exports.upload = function(req, res){
  console.log(req.body);
  if (req.isAuthenticated()) {
    createJob(req, res, req.body);
  }
  else {
    //if not logged in
    req.session['object'] = req.body;
    res.render('ajaxRedirect', {url: '/login'});
  }
};
