const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  content: { type: String, required: true, trim: true, maxlength: 12000 },
  category: { type: String, default: 'General', trim: true, maxlength: 50 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
