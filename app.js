const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const config = require('./config/database');
const passport = require('passport');
var uniqueValidator = require('mongoose-unique-validator');


//mongoose.connect('mongodb://localhost/nodekb');
mongoose.connect(config.database);
let db = mongoose.connection;
//check connection
db.once('open',function(){
  console.log('connected to mongoDB');
});

//check for db errors
db.on('error',function(err){
  console.log(err);
});
const app = express();

//bring in models
let Article = require('./models/article');
let User = require('./models/user');

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// Express session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}));

// express messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// express  validator middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

//passport config
require('./config/passport')(passport);
//passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*',function(req,res,next){
  res.locals.user = req.user || null ;
  //console.log(res.locals.user);
  next();
});

// parse application/json
app.use(bodyParser.json());

//set public folder
app.use(express.static(path.join(__dirname,'public')));

//get index page and send the articles
app.get('/',function(req,res){
  Article.find({},function(err,articles){
  if(err){
    console.log(err);
  }else
  {
    res.render('index',{
    title : 'Articles',
    articles : articles
      });
    }
  });
});

//get add articles page
app.get('/articles/add',ensureAuthenticated,function(req,res){
  res.render('add_article',{
    title : 'Add Article'
  });
});

app.post('/articles/add',function(req,res){
  req.checkBody('title','Title is required').notEmpty();
  //req.checkBody('author','author is required').notEmpty();
  req.checkBody('body','body is required').notEmpty();
  
  // get errors
  var errors = req.validationErrors();
  console.log(errors);
  if(errors){
    // console.log(errors);
    res.render('add_article',{
      title : 'Add Article',
      myerrors:errors
      
    });
  }
  else{
    let article = new Article();
    article.title = req.body.title;
    article.author = req.user._id;
    article.body = req.body.body;
    article.save(function(err){
      if(err){
        console.log(err);
      }else{
        req.flash('success','Article Added');
        res.redirect('/');
      }
    });
  }
});

// get single article
app.get('/article/:id', function(req, res){
  Article.findById(req.params.id, function(err, article){
    User.findById(article.author, function(err, user){
      res.render('article', {
        article:article,
        author: user.name
      });
    });
  });
});

//edit article form
app.get('/article/edit/:id',ensureAuthenticated,function(req,res){
  Article.findById(req.params.id,function(err,article){
    if(article.author != req.user._id){
      req.flash('danger','Not authorized');
      res.redirect('/');
    }
    res.render('edit_article',{
      title : 'Edit Article',
      article:article
    });
  });
});

// update submit post route
app.post('/articles/edit/:id',function(req,res){
  let article = {};
  article.title = req.body.title;
  article.author = req.body.author;
  article.body = req.body.body;

  let query = {_id:req.params.id}

  Article.update(query,article,function(err){
    if(err){
      console.log(err);
    }else{
      req.flash('success','Article Updated');
      res.redirect('/');
    }
  });
});

// delete request route
app.delete('/article/delete/:id',function(req,res){
  if(!req.user._id){
    res.status(500).send();
  }

  let query = {_id:req.params.id}
  Article.findById(req.params.id,function(err,article){
    if(article.author != req.user._id){
      res.status(500).send();
    }else{
      Article.remove(query,function(err){
        if(err){
          console.log(err);
        }
        res.send('success');
      });
    }
  });
});

// register route 
app.get('/user/register',function(req,res){
  res.render('register',{
    title : 'Register'
  });
});

// register process
app.post('/user/register',function(req,res){
  const name = req.body.name;
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const password2 = req.body.password2;

  req.checkBody('name','Name is required').notEmpty();
  req.checkBody('email','email is required').notEmpty();
  req.checkBody('email','Enter Vaild Email').isEmail();
  req.checkBody('username','username is required').notEmpty();
  req.checkBody('password','password is required').notEmpty();
  req.checkBody('password2','confirm password is required').notEmpty();
  req.checkBody('password2','Passwords donot match').equals(req.body.password);

  let errors = req.validationErrors();
  if(errors){
    console.log(errors);
    res.render('register',{
      errors:errors,
      title : 'Register'
    });
  }
  else{
    let newUser = new User({
      name : name,
      username: username,
      email : email,
      password : password
    });
    bcrypt.genSalt(10,function(err,salt){
      bcrypt.hash(newUser.password,salt,function(err,hash){
        if(err){
          console.log(err)
        }
        newUser.password = hash;
        newUser.save(function(err){
          if(err){
            console.log(err);
            if(err.code === 11000){
              req.flash('danger','Email already exists');
              res.redirect('/user/login');
            }
            return;
          }
          else{
            req.flash('success','You are now registered and can log in');
            res.redirect('/user/login');
          }
        });
      });
    });
  }
});

app.get('/user/login',function(req,res){
  res.render('login',{
    title : 'Login'
  });
});

app.post('/user/login',function(req,res,next){
  passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect : '/user/login',
    failureFlash : true
  })(req,res,next);
});

//logout
app.get('/logout',function(req,res){
  req.logout();
  req.flash('success','You are logged out');
  res.redirect('/user/login');
});

//access control
function ensureAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }else{
    req.flash('danger','Please Login');
    res.redirect('/');
  }
}


app.get('/user/dashboard',function(req,res){
  res.render('user_dashboard',{
    title : 'Dashboard'
  });
});

app.get('/user/profile',ensureAuthenticated,function(req,res){
  res.render('user_profile',{
    title : 'Profile'
  });
});

app.post('/user/profile/edit/:id',function(req,res){
  let updatesUser = {};
  updatesUser.username = req.body.username;
  updatesUser.name = req.body.name;
  updatesUser.email = req.body.email;

  let query = {_id:req.params.id}

  User.update(query,updatesUser,function(err){
    if(err){
      console.log(err);
    }else{
      req.flash('success','User Updated');
      res.redirect('/');
    }
  });
});

app.listen(3000,function(){
  console.log('server started on port 3000');
 
});