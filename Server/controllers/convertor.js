/*
 * GET convert page.
 */

exports.convert = function(req, res){
  
  var currentUser = req.user;
  
  Job.find({owner: currentUser}, function(err, jobs) {
    if (err) console.log(err);
    console.log(jobs);
  });
  
  // console.log(currentUser.jobs[0].filePath);
  res.render('convertor/convert', { title: 'Convert' , user: req.user});
};

/*
 * GET wait page.
 */

exports.wait = function(req, res){
  var currentUser = req.user;
  Job.find({owner: currentUser}, function(err, jobs) {
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
    res.redirect('/login');
    return;
  }

  Job.find({_id: req.body.id}, function(err, jobs) {
    if (err) {
      console.log(err);
      res.redirect('/login');
    }
    else {
      res.send(jobs[0].statusMessage());
    }
  });
};

/*
 * POST upload
 */

exports.upload = function(req, res){
  if (req.isAuthenticated()) {
    console.log(req.body);
    
    var currentUser = req.user;
    Job.create({url: req.body.url, filename: req.body.data.filename, owner: currentUser}, function(err, job) {
      if(err){
        console.log(err);
      }
      else {
        currentUser.jobs.push(job);
        currentUser.save(function(err) {
          if(err) console.log(err);
          console.log(currentUser);
        });
      }
    });
    res.send('/wait');
  }
  else {
    //if not logged in,
    //create new job and store it in cookie
    res.send('/login');
  }
};
