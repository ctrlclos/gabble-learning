import Flashcard from '../models/Flashcard.js';
// validationResult checks if data is valid
import { validationResult } from 'express-validator';

// SHOW "NEW FLASHCARD" FORM
export const newForm = (req, res) => {
  // flashcards/new
  res.render('flashcards/new', {
    // sending additional info to the view
    title: 'Create New Flashcard',
    errors: [],
    oldInput: {}
  });
};

// CREATE A NEW FLASHCARD
export const create = async(req, res) => {
  try {
    // check for validation errors
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).render('flashcards/new', {
        title: 'Create New Flascard',
        errors: errors.array(),
        oldInput: req.body, // preserve what the user typed
      });
    }

    const { front, back } = req.body;
    await Flashcard.create({
      front: front,
      back: back,
      createdBy: req.session.userId
    })

    req.flash('success', 'Flashcard created successfully!');
    res.redirect('/flashcards');
  }catch (error) {
    console.error('Error creating flashcard:', error);
    req.flash('error', 'Unable to create flashcard. Please, try again.')
    res.redirect('/flashcards/new');
  }
};

//SHOW ALL FLASHCARDS
export const index = async(req, res) => {
  try {
    let query = {}; // build query based on user role
    // check if user is admin
    if(req.session.userRole !== 'admin'){
      query.createdBy = req.session.userId; // can only access their own flashcards
    }
    // admin gets empty query which means all flashcards available regardless of who owns it.
    const flashcards = await Flashcard.find(query) // query {} -> retrieves all; otherwise retrieve by user id
    .populate('createdBy', 'name')
    .sort({createdAt: -1})// newly created cards are shown first (-1)
    res.render('flashcards/index', {
      title: 'My Flashcards',
      flashcards
    });

  } catch (error) {
    console.error('Flashcard index error:', error);
    req.flash('error', 'Unable to load flashcards');
    res.redirect('/');
  }
}
