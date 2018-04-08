const express = require('express');
const app = express();
const routes = require('./routes');
const path = require('path');
const config = require('./oauth.js');
const logger = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bodyParser = require('body-parser');
const session = require("cookie-session");
const auth = require('./routes/authorized');

const { Post } = require('./models/Post');
const User = require('./models/User');
const dbConnection = `mongodb://${process.env.dbuser}:${process.env.dbpassword}@ds237979.mlab.com:37979/swd104-j_final`;
mongoose.Promise = global.Promise;

mongoose.connect(dbConnection)
  .then(() => console.log('connection successful'))
  .catch((err) => console.error(error));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set("port", process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  maxAge: 86400000,
  keys: ['asdfioupbiloauwbyjklabdsjflajkwrtadsf']
}));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user || null
  next()
});
app.use(express.static(path.join(__dirname, 'public')));

// Passport authenticated persistence
passport.serializeUser(((user, done) => {
  done(null, user.id);
}));
passport.deserializeUser(((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  })
}));

passport.use(new GoogleStrategy({
  clientID: process.env.clientID,
  clientSecret: process.env.clientSecret,
  callbackURL: '/auth/google/callback',
  proxy: true
},
  (accessToken, refreshToken, account, done) => {
    console.log(account);
    User.findOne({ googleID: account.id }).then(user => {
      if (user) {
        done(null, user)
      } else {
        new User({
          googleID: account.value,
          name: account.displayName
        })
        .save()
        .then(user => {
          done(null, user);
        })
        .catch(err => {
          done(err, false);
        })
      }
    });
  }));


// Define the routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('home', { user: req.user });
});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/plus.profile.emails.read'
    ]
  }
  ));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/account');
  });

app.get('/account',
  require('connect-ensure-login').ensureLoggedIn(),
  (req, res) => {
    res.render('account', { user: req.user });
  });

app.get('/addPost', (req, res) => {
  res.render('addPost');
});

app.post('/addPost', (req, res) => {
  let post = new Post({
    subject: req.body.subject,
    description: req.body.description
  });
  post.save().then((document) => {
    res.redirect('/listPosts');
  }, (err) => {
    res.status(400).send(err);
  });
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(app.get("port"), () => {
  console.log(
    `Express started on http://localhost:${app.get("port")}; press Ctrl-C to terminate.`
  );
});