const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Post = new Schema({
  googleID: Number,
  subject: String,
  description: String
});

mongoose.model('Post', Post);