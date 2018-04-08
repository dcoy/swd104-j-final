const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  googleID: String,
  name: String,
  email: String,
  username: String,
  provider: String,
});

mongoose.model("users", UserSchema);