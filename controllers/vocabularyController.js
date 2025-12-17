import Vocabulary from '../models/Vocabulary.js';

// NEW - form to create new word (/vocabularies/new)(GET)
export const newForm = (req, res) => {
  res.render('vocabularies/new', {
    title: 'Add New Word'
  });
};

// INDEX - show all vocabulary words (/vocabularies)(GET)
export const index = async (req, res) => {
  try {
    // Build query based on user role.
    let query = {};

    if(req.session.userRole !== 'admin') {
      // Regular users can only see their own words.
      query.createdBy = req.session.userId;
    }
    // Admins get an empty
    // query which equals all words.

    const vocabularies = await Vocabulary.find(query)
    .populate('createdBy', 'name') // Include the creator's name.
    .sort({createdAt: -1}); // -1 sorts by newest first.

    res.render('vocabularies/index', {
      title: 'My Vocabulary',
      vocabularies
    });
  } catch(err) {
    console.log('Vocabulary index error:', err);
    req.flash('error', 'Could not load vocabulary');
    res.redirect('/');
  }
};

// CREATE (/vocabularies)(POST)
// Create a new vocabulary word.
export const create = async(req, res) => {
  try {
    const {word, definition, difficultyLevel, translation, tags} = req.body;

    await Vocabulary.create({
      word,
      definition,
      difficultyLevel,
      translation,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      createdBy: req.session.userId // Link to current user.
    });

    req.flash('success', 'Word added successfully');
    res.redirect('/vocabularies')
  } catch(err) {
    console.error('Vocabulary create error:', err);
    req.flash('error', 'Could not add word');
    res.redirect('/vocabularies');
  }
};

// SHOW - single word detail (/vocabularies/:id)(GET)
export const show = async (req, res) => {
  try {
    const vocabulary = await Vocabulary.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!vocabulary) {
      req.flash('error', 'Word not found');
      return res.redirect('/vocabularies');
    }

    // Authorization check - only owner or admin can view
    if (req.session.userRole !== 'admin' &&
      vocabulary.createdBy._id.toString() !== req.session.userId
    ) {
      req.flash('error', 'You can only view your own words');
      return res.redirect('/vocabularies');
    }

    res.render('vocabularies/show', {
      title: vocabulary.word,
      vocabulary
    });
  } catch (err) {
    console.error('Show error:', err);
    req.flash('error', 'Could not load word');
    res.redirect('/vocabularies');
  }
};

// EDIT (/vocabularies/:id/edit)(GET - edit form)
export const editForm = async (req, res) => {
  try{
    const vocabulary = await Vocabulary.findById(req.params.id);
    // Check if word exists.
    if(!vocabulary) {
      req.flash('error', 'Word not found');
      return res.redirect('/vocabularies');
    }

    // Authorization check,
    // can this user edit this word?
    if(req.session.userRole !== 'admin') {
      // check ownership
      if (vocabulary.createdBy.toString() !== req.session.userId) {
        req.flash('error', 'You can only edit your own words');
        return res.redirect('/vocabularies');
      }
    }
    // Admins can edit any word
    // no check needed
    res.render('vocabularies/edit', {
      title: 'Edit word',
      vocabulary
    });
  } catch (err){
    console.error('Edit form error:', err);
    req.flash('error', 'Could not load word');
    res.redirect('/vocabularies');
  }
};

// UPDATE (/vocabularies/:word_id)(PUT)
export const update = async (req, res) => {
  try{
    const vocabulary = await Vocabulary.findById(req.params.id);

    if(!vocabulary) {
      req.flash('error', 'Word not found');
      return res.redirect('/vocabularies');
    }
    // Authorization check.
    if(req.session.userRole !== 'admin' &&
      vocabulary.createdBy.toString() !== req.session.userId
    ) {
      req.flash('error', 'You can only edit your own words');
      return res.redirect('/vocabularies');
    }
    // Update the word.
    const {word, definition, difficultyLevel, translation, tags} = req.body;
    vocabulary.word = word;
    vocabulary.definition = definition;
    vocabulary.difficultyLevel = difficultyLevel;
    vocabulary.translation = translation;
    vocabulary.tags = tags ? tags.split(',').map(t => t.trim()) : [];

    await vocabulary.save();

    req.flash('success', 'Word updated successfully');
    res.redirect('/vocabularies');
  }catch(err){
    console.error('Update error:', err);
    req.flash('error', 'Could not update word');
    res.redirect('/vocabularies');
  }
};

// DELETE (/vocabularies/:word_id)(DELETE)
export const deleteWord = async(req, res) => {
  try{
    const vocabulary = await Vocabulary.findById(req.params.id);
    if(!vocabulary) {
      req.flash('error', 'Word not found');
      return res.redirect('/vocabularies');
    }

    // Authorization check - only owner or admin can delete
    if(req.session.userRole !== 'admin' &&
      vocabulary.createdBy.toString() !== req.session.userId
    ) {
      req.flash('error', 'You can only delete your own words');
      return res.redirect('/vocabularies');
    }

    await Vocabulary.findByIdAndDelete(req.params.id);
    req.flash('success', 'Word deleted successfully!');
    res.redirect('/vocabularies');
  }catch(err){
    console.error('Delete error:', err);
    req.flash('error', 'Could not delete word');
    res.redirect('/vocabularies');
  }
};
