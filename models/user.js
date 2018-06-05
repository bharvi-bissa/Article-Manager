const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
//user schema

const UserSchema = mongoose.Schema({
  name : {
    type : String,
    required : true
  },
  email : {
    type : String,
    required : true,
    unique : true
  },
  username : {
    type : String,
    required : true
  },
  password : {
    type : String,
    required : true
  },
  userimage : {
    type : String
  }
});

//UserSchema.plugin(uniqueValidator);

const User = module.exports = mongoose.model('User',UserSchema);