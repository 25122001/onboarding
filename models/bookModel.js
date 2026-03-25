const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: String,   // Name
  author: String,  // Room
  phone: String
});

// ✅ Add compound unique index
bookSchema.index({ title: 1, author: 1, phone: 1 }, { unique: true });

const bookModel = mongoose.model('products', bookSchema);

module.exports = bookModel;