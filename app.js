const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
mongoose.connect('mongodb://localhost/nodekb');
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

// parse application/json
app.use(bodyParser.json());

//set public folder
app.use(express.static(path.join(__dirname,'public')));

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

app.get('/articles/add',function(req,res){
  res.render('add_article',{
    title : 'Add Article'
  });
});

app.post('/articles/add',function(req,res){
  req.checkBody('title','Title is required').notEmpty();
  req.checkBody('author','author is required').notEmpty();
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
    article.author = req.body.author;
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
app.get('/article/:id',function(req,res){
  Article.findById(req.params.id,function(err,article){
    res.render('article',{
      article:article
    });
  });
});

//edit article
app.get('/article/edit/:id',function(req,res){
  Article.findById(req.params.id,function(err,article){
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
  let query = {_id:req.params.id}

  Article.remove(query,function(err){
    if(err){
      console.log(err);
    }
    res.send('success');
  });
})
app.listen(3000,function(){
  console.log('server started on port 3000');
 
});