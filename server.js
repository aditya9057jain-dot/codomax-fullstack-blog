require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const authRoutes = require('./server/routes/auth');
const blogRoutes = require('./server/routes/blogs');

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Codomax Blog API' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/blogs', blogRoutes);

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('*splat', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

async function start() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    console.warn('MONGODB_URI or JWT_SECRET is missing. Add them to .env before using authentication/database features.');
  } else {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  }

  app.listen(PORT, () => {
    console.log(`Codomax Blog running at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Startup error:', error.message);
  process.exit(1);
});
