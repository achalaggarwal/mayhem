
/**
 * Module dependencies.
 */

var AppConfig = require('./config.js');

var express = require('express')
  , homeController = require('./controllers/home')
  , convertorController = require('./controllers/convertor')
  , flash = require('connect-flash')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , sessionsController = require('./controllers/sessions')(passport)
  , LocalStrategy = require('passport-local').Strategy;

require('./models/models.js');

User.find(function(err, users) {
  console.log(users);
});

/*move this to uses model*/
var users = [
    { id: 1, username: 'bob', password: 'secret', email: 'bob@example.com' }
  , { id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com' }
];

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}

// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});

// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      });
    });
  }
));

var authenticatedRoutes = {
                              "/upload" : 1
                            , "/convert" : 1
                            , "/wait" : 1
                            , "/status" : 1
                            , "/sessions" : 1
                          };

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  
  //As Express 3 does not support layouts
  app.set('view engine', 'ejs');
  app.engine('ejs', require('ejs-locals'));
  
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  
  app.use(flash());
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  
  //To act as before filter for authenticated requests.
  app.use(function(req, res, next) {
    if (!req.isAuthenticated() && authenticatedRoutes[req.url] == 1) {
      res.redirect("/login");
    }
    else {
      next();
    }
    return;
  });
  
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', homeController.index);

app.get('/convert', convertorController.convert);
app.get('/wait', convertorController.wait);
app.get('/status', convertorController.status);
app.post('/upload', convertorController.upload);

app.get('/login', sessionsController.login);
app.post('/login', sessionsController.create);
app.get('/logout', sessionsController.destroy);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
