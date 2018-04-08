const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
  googleID: Number,
  name: String
});

mongoose.model('User', User);