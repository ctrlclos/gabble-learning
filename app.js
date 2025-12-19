import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'connect-flash';
import path from 'path'
import { fileURLToPath } from 'url';

import indexRoutes from './routes/index.js';
import cardRoutes from './routes/cardRoutes.js';
import learnerRoutes from './routes/learnerRoutes.js';
import deckRoutes from './routes/deckRoutes.js';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

import { loadUser } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const dbUri = process.env.DATABASE_URI;

mongoose.connect(dbUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Trust Heroku's reverse proxy for secure cookies
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DATABASE_URI,
    touchAfter: 24 * 60 * 60
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: 'lax'
  }
}));

app.use(flash());
app.use(loadUser);

// Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  next();
});

// Make current path available for navigation
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/cards', cardRoutes);
app.use('/learners', learnerRoutes);
app.use('/decks', deckRoutes);
app.use('/profile', profileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/', indexRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.log('Server Error:', err);
  res.status(500).render('errors/500', { title: 'Server Error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
