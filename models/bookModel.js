const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title : String,
  author : String,
  phone: String
})

const bookModel = mongoose.model('products', bookSchema);

module.exports = bookModel;