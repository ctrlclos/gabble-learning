import { validationResult } from 'express-validator';
import Deck from '../models/Deck.js';
import Card from '../models/Card.js';

// GET /decks - List all decks for the current user
export async function index(req, res) {
  try {
    const query = { createdBy: req.session.userId };

    if (req.session.userRole === 'admin') {
      delete query.createdBy;
    }

    const decks = await Deck.find(query).sort({ isDefault: -1, name: 1 });

    const decksWithStats = await Promise.all(
      decks.map(async (deck) => {
        const cardCount = await Card.countDocuments({ deck: deck._id });
        const dueCount = await Card.countDocuments({
          deck: deck._id,
          nextReviewDate: { $lte: new Date() },
        });
        return {
          ...deck.toObject(),
          cardCount,
          dueCount,
        };
      })
    );

    res.render('decks/index', {
      title: 'My Decks',
      decks: decksWithStats,
    });
  } catch (error) {
    console.error('Error fetching decks:', error);
    req.flash('error', 'Failed to load decks');
    res.redirect('/');
  }
}

// GET /decks/new - Show form to create a new deck
export function newForm(req, res) {
  res.render('decks/new', {
    title: 'Create New Deck',
    deck: {},
    errors: [],
    oldInput: {},
  });
}

// POST /decks - Create a new deck
export async function create(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).render('decks/new', {
      title: 'Create New Deck',
      deck: {},
      errors: errors.array(),
      oldInput: req.body,
    });
  }

  try {
    const deck = new Deck({
      name: req.body.name,
      description: req.body.description || '',
      createdBy: req.session.userId,
    });

    await deck.save();

    req.flash('success', `Deck "${deck.name}" created successfully`);
    res.redirect('/decks');
  } catch (error) {
    console.error('Error creating deck:', error);
    req.flash('error', 'Failed to create deck');
    res.redirect('/decks/new');
  }
}

// GET /decks/:id - Show a specific deck with its cards
export async function show(req, res) {
  try {
    const deck = await Deck.findById(req.params.id);

    if (!deck) {
      req.flash('error', 'Deck not found');
      return res.redirect('/decks');
    }

    if (
      deck.createdBy.toString() !== req.session.userId &&
      req.session.userRole !== 'admin'
    ) {
      req.flash('error', 'You do not have permission to view this deck');
      return res.redirect('/decks');
    }

    const cards = await Card.find({ deck: deck._id }).sort({ createdAt: -1 });

    const dueCount = await Card.countDocuments({
      deck: deck._id,
      nextReviewDate: { $lte: new Date() },
    });

    res.render('decks/show', {
      title: deck.name,
      deck,
      cards,
      dueCount,
    });
  } catch (error) {
    console.error('Error fetching deck:', error);
    req.flash('error', 'Failed to load deck');
    res.redirect('/decks');
  }
}

// GET /decks/:id/edit - Show form to edit a deck
export async function editForm(req, res) {
  try {
    const deck = await Deck.findById(req.params.id);

    if (!deck) {
      req.flash('error', 'Deck not found');
      return res.redirect('/decks');
    }

    if (
      deck.createdBy.toString() !== req.session.userId &&
      req.session.userRole !== 'admin'
    ) {
      req.flash('error', 'You do not have permission to edit this deck');
      return res.redirect('/decks');
    }

    if (deck.isDefault) {
      req.flash('error', 'Cannot edit the default deck');
      return res.redirect('/decks');
    }

    res.render('decks/edit', {
      title: `Edit ${deck.name}`,
      deck,
      errors: [],
      oldInput: {},
    });
  } catch (error) {
    console.error('Error loading deck edit form:', error);
    req.flash('error', 'Failed to load deck');
    res.redirect('/decks');
  }
}

// PUT /decks/:id - Update a deck
export async function update(req, res) {
  const errors = validationResult(req);

  try {
    const deck = await Deck.findById(req.params.id);

    if (!deck) {
      req.flash('error', 'Deck not found');
      return res.redirect('/decks');
    }

    if (
      deck.createdBy.toString() !== req.session.userId &&
      req.session.userRole !== 'admin'
    ) {
      req.flash('error', 'You do not have permission to edit this deck');
      return res.redirect('/decks');
    }

    if (deck.isDefault) {
      req.flash('error', 'Cannot edit the default deck');
      return res.redirect('/decks');
    }

    if (!errors.isEmpty()) {
      return res.status(400).render('decks/edit', {
        title: `Edit ${deck.name}`,
        deck,
        errors: errors.array(),
        oldInput: req.body,
      });
    }

    deck.name = req.body.name;
    deck.description = req.body.description || '';

    await deck.save();

    req.flash('success', `Deck "${deck.name}" updated successfully`);
    res.redirect(`/decks/${deck._id}`);
  } catch (error) {
    console.error('Error updating deck:', error);
    req.flash('error', 'Failed to update deck');
    res.redirect('/decks');
  }
}

// DELETE /decks/:id - Delete a deck (cards remain but deck reference is cleared)
export async function destroy(req, res) {
  try {
    const deck = await Deck.findById(req.params.id);

    if (!deck) {
      req.flash('error', 'Deck not found');
      return res.redirect('/decks');
    }

    if (
      deck.createdBy.toString() !== req.session.userId &&
      req.session.userRole !== 'admin'
    ) {
      req.flash('error', 'You do not have permission to delete this deck');
      return res.redirect('/decks');
    }

    if (deck.isDefault) {
      req.flash('error', 'Cannot delete the default deck');
      return res.redirect('/decks');
    }

    await Card.updateMany({ deck: deck._id }, { deck: null });
    await deck.deleteOne();

    req.flash('success', `Deck "${deck.name}" deleted. Cards are now unassigned.`);
    res.redirect('/decks');
  } catch (error) {
    console.error('Error deleting deck:', error);
    req.flash('error', 'Failed to delete deck');
    res.redirect('/decks');
  }
}

// GET /decks/:id/review - Start a review session for a specific deck
export async function review(req, res) {
  try {
    const deck = await Deck.findById(req.params.id);

    if (!deck) {
      req.flash('error', 'Deck not found');
      return res.redirect('/decks');
    }

    if (
      deck.createdBy.toString() !== req.session.userId &&
      req.session.userRole !== 'admin'
    ) {
      req.flash('error', 'You do not have permission to review this deck');
      return res.redirect('/decks');
    }

    const card = await Card.findOne({
      deck: deck._id,
      nextReviewDate: { $lte: new Date() },
    }).sort({ nextReviewDate: 1 });

    const totalDue = await Card.countDocuments({
      deck: deck._id,
      nextReviewDate: { $lte: new Date() },
    });

    res.render('decks/review', {
      title: `Review: ${deck.name}`,
      deck,
      card,
      totalDue,
      message:
        totalDue === 0 ? 'All done! No cards due for review in this deck.' : null,
    });
  } catch (error) {
    console.error('Error starting deck review:', error);
    req.flash('error', 'Failed to start review session');
    res.redirect('/decks');
  }
}

// POST /decks/:id/review/:cardId/answer - API for deck review answers
export async function answerAPI(req, res) {
  try {
    const { quality } = req.body;
    const qualityRating = parseInt(quality, 10);

    if (isNaN(qualityRating) || qualityRating < 0 || qualityRating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quality rating. Must be 0, 3, 4, or 5.',
      });
    }

    const deck = await Deck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found',
      });
    }

    const card = await Card.findOne({
      _id: req.params.cardId,
      deck: deck._id,
      createdBy: req.session.userId,
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found',
      });
    }

    card.processReview(qualityRating);
    await card.save();

    const now = new Date();
    const dueCards = await Card.find({
      deck: deck._id,
      createdBy: req.session.userId,
      nextReviewDate: { $lte: now },
    }).sort({ nextReviewDate: 1 });

    if (dueCards.length === 0) {
      return res.json({
        success: true,
        hasNextCard: false,
        nextCard: null,
        remainingCount: 0,
        message: 'All done! No cards due for review in this deck.',
        reviewedCard: {
          interval: card.interval,
          easeFactor: card.easeFactor,
          nextReviewDate: card.nextReviewDate,
        },
      });
    }

    const nextCard = dueCards[0];
    return res.json({
      success: true,
      hasNextCard: true,
      nextCard: {
        id: nextCard._id,
        front: nextCard.front,
        back: nextCard.back,
      },
      remainingCount: dueCards.length,
      message: null,
      reviewedCard: {
        interval: card.interval,
        easeFactor: card.easeFactor,
        nextReviewDate: card.nextReviewDate,
      },
    });
  } catch (error) {
    console.error('Deck Review API Answer Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to process your answer. Please try again.',
    });
  }
}

// Ensure user has a default deck (creates one if missing)
export async function ensureDefaultDeck(userId) {
  let defaultDeck = await Deck.findOne({
    createdBy: userId,
    isDefault: true,
  });

  if (!defaultDeck) {
    defaultDeck = await Deck.create({
      name: 'General',
      description: 'Default deck for your cards',
      isDefault: true,
      createdBy: userId,
    });
  }

  return defaultDeck;
}
