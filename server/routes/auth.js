const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function issueToken(user) {
  return jwt.sign({ id: user._id.toString(), email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash });
    res.status(201).json({ token: issueToken(user), user: { id: user._id, name: user.name, email: user.email, bio: user.bio } });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json({ token: issueToken(user), user: { id: user._id, name: user.name, email: user.email, bio: user.bio } });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { name, bio } = req.body;
    const updates = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim().slice(0, 80);
    if (typeof bio === 'string') updates.bio = bio.trim().slice(0, 300);

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-passwordHash');
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
