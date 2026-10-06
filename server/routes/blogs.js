const express = require('express');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get('/', async (req, res, next) => {
  try {
    const { search = '', category = '' } = req.query;
    const filter = {};
    if (search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: regex }, { content: regex }];
    }
    if (category.trim()) filter.category = category.trim();
    const blogs = await Blog.find(filter).populate('author', 'name').sort({ createdAt: -1 });
    res.json({ blogs });
  } catch (error) {
    next(error);
  }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const blogs = await Blog.find({ author: req.user.id }).populate('author', 'name').sort({ createdAt: -1 });
    res.json({ blogs });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid blog ID.' });
    const blog = await Blog.findById(req.params.id).populate('author', 'name bio');
    if (!blog) return res.status(404).json({ message: 'Blog not found.' });
    res.json({ blog });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content are required.' });
    const blog = await Blog.create({
      title: title.trim(),
      content: content.trim(),
      category: category?.trim() || 'General',
      author: req.user.id
    });
    const populated = await blog.populate('author', 'name');
    res.status(201).json({ blog: populated });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid blog ID.' });
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found.' });
    if (blog.author.toString() !== req.user.id) return res.status(403).json({ message: 'You can only edit your own blogs.' });

    const { title, content, category } = req.body;
    if (typeof title === 'string') blog.title = title.trim();
    if (typeof content === 'string') blog.content = content.trim();
    if (typeof category === 'string') blog.category = category.trim() || 'General';
    await blog.save();
    res.json({ blog: await blog.populate('author', 'name') });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid blog ID.' });
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found.' });
    if (blog.author.toString() !== req.user.id) return res.status(403).json({ message: 'You can only delete your own blogs.' });
    await blog.deleteOne();
    res.json({ message: 'Blog deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
