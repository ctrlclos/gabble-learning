import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'connect-flash';
import path from 'path'
import { fileURLToPath } from 'url';

// importing routers
import indexRoutes from './routes/index.js';
import vocabularyRoutes from './routes/vocabularyRoutes.js';
import learnerRoutes from './routes/learnerRoutes.js';
import authRoutes from './routes/authRoutes.js';

// import middleware
import { loadUser } from './middleware/auth.js';

// Define __dirname for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const dbUri = process.env.DATABASE_URI;

//connecting to the database
mongoose.connect(dbUri)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log('MongoDB connection error:', err));

// setting ejs as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MIDDLEWARE
// unlocks specific files so the browser can see them.
// serve static files (CSS, JS, images...)
app.use(express.static(path.join(__dirname, 'public')));


// parse form data
app.use(express.urlencoded({extended: true}));

// parse JSON data
app.use(express.json());

// Allow PUT and DELETE methods via _method query parameter
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, // dont save session if nothig changed
  saveUninitialized: false, // dont create session until something is stored
  store: MongoStore.create({
    mongoUrl: process.env.DATABASE_URI,
    // only update session in db every 24 hrs
    touchAfter: 24 * 60 * 60 //24 hrs in seconds
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week in milliseconds
    sameSite: 'lax'
  }
}));

//Flash messages are stored
// in the session and automatically
//  deleted after being displayed
app.use(flash());

// Load current user for all requests
app.use(loadUser);

//Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  next();
});

// ROUTES
// defining base urls for routers - delegation
app.use('/auth', authRoutes);
app.use('/vocabularies', vocabularyRoutes); // handles requests to '/vocabularies'
app.use('/learners', learnerRoutes); // handles requests to '/learners'
app.use('/', indexRoutes) // handles requests to '/'
// error handling
// 404 - page not found
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Page Not Found' });
})

// 500 - server error
app.use((err, req, res, next) => {
  console.log('Server Error:', err);
  res.status(500).render('errors/500', { title: 'Server Error'});
})

// Start Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
