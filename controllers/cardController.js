import { validationResult } from 'express-validator';
import Card from '../models/Card.js';
import Deck from '../models/Deck.js';

// GET /cards - List all cards for the current user
export async function index(req, res) {
  try {
    const cards = await Card.find({ createdBy: req.session.userId })
      .populate('deck', 'name')
      .sort({ createdAt: -1 });

    const now = new Date();
    const dueCount = await Card.countDocuments({
      createdBy: req.session.userId,
      nextReviewDate: { $lte: now },
    });

    res.render('cards/index', {
      title: 'My Cards',
      cards,
      dueCount,
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    req.flash('error', 'Failed to load cards');
    res.redirect('/');
  }
}

// GET /cards/new - Show form to create a new card
export async function newForm(req, res) {
  try {
    const decks = await Deck.find({ createdBy: req.session.userId }).sort({
      isDefault: -1,
      name: 1,
    });

    const selectedDeckId = req.query.deck || '';

    res.render('cards/new', {
      title: 'New Card',
      decks,
      errors: [],
      oldInput: { deck: selectedDeckId },
    });
  } catch (error) {
    console.error('Error loading new card form:', error);
    req.flash('error', 'Failed to load form');
    res.redirect('/cards');
  }
}

// POST /cards - Create card(s) from word + optional sentence examples
export async function create(req, res) {
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const decks = await Deck.find({ createdBy: req.session.userId }).sort({
        isDefault: -1,
        name: 1,
      });

      return res.status(400).render('cards/new', {
        title: 'New Card',
        decks,
        errors: errors.array(),
        oldInput: req.body,
      });
    }

    const { front, back, deck, tags, exampleSentences } = req.body;
    const parsedTags = parseTags(tags);
    const deckId = deck || null;

    // Create main word card
    const mainCard = new Card({
      front: front.trim(),
      back: back.trim(),
      deck: deckId,
      tags: parsedTags,
      createdBy: req.session.userId,
    });
    await mainCard.save();

    // Create sentence cards (fill-in-the-blank)
    let sentenceCardsCreated = 0;
    if (exampleSentences) {
      const sentences = Array.isArray(exampleSentences)
        ? exampleSentences
        : [exampleSentences];

      for (const sentence of sentences) {
        if (sentence && sentence.trim()) {
          const sentenceCard = createSentenceCard({
            sentence: sentence.trim(),
            word: front.trim(),
            deckId,
            tags: parsedTags,
            userId: req.session.userId,
          });
          await sentenceCard.save();
          sentenceCardsCreated++;
        }
      }
    }

    const totalCards = 1 + sentenceCardsCreated;
    req.flash('success', `${totalCards} card${totalCards > 1 ? 's' : ''} created`);

    if (deck) {
      res.redirect(`/decks/${deck}`);
    } else {
      res.redirect('/cards');
    }
  } catch (error) {
    console.error('Error creating card:', error);
    req.flash('error', 'Failed to create card');
    res.redirect('/cards/new');
  }
}

// Creates fill-in-the-blank card from sentence
// Input: "The woodpecker pecked" + word "woodpecker"
// Output: front="The _____ pecked", back="woodpecker"
function createSentenceCard({ sentence, word, deckId, tags, userId }) {
  const regex = new RegExp(word, 'gi');
  const sentenceWithBlank = sentence.replace(regex, '_____');

  return new Card({
    front: sentenceWithBlank,
    back: word,
    deck: deckId,
    tags: [...tags, 'sentence'],
    createdBy: userId,
  });
}

// GET /cards/:id - Show card details
export async function show(req, res) {
  try {
    const card = await Card.findById(req.params.id).populate('deck', 'name');

    if (!card) {
      req.flash('error', 'Card not found');
      return res.redirect('/cards');
    }

    if (
      card.createdBy.toString() !== req.session.userId &&
      req.session.userRole !== 'admin'
    ) {
      req.flash('error', 'You do not have permission to view this card');
      return res.redirect('/cards');
    }

    res.render('cards/show', {
      title: 'Card Details',
      card,
    });
  } catch (error) {
    console.error('Error fetching card:', error);
    req.flash('error', 'Failed to load card');
    res.redirect('/cards');
  }
}

// GET /cards/:id/edit - Show edit form
export async function editForm(req, res) {
  try {
    const card = await Card.findById(req.params.id).populate('deck', 'name');

    if (!card) {
      req.flash('error', 'Card not found');
      return res.redirect('/cards');
    }

    if (
      card.createdBy.toString() !== req.session.userId &&
      req.session.userRole !== 'admin'
    ) {
      req.flash('error', 'You do not have permission to edit this card');
      return res.redirect('/cards');
    }

    const decks = await Deck.find({ createdBy: req.session.userId }).sort({
      isDefault: -1,
      name: 1,
    });

    res.render('cards/edit', {
      title: 'Edit Card',
      card,
      decks,
      errors: [],
      oldInput: {
        front: card.front,
        back: card.back,
        deck: card.deck?._id?.toString() || '',
        tags: card.tags.join(', '),
      },
    });
  } catch (error) {
    console.error('Error loading card edit form:', error);
    req.flash('error', 'Failed to load card');
    res.redirect('/cards');
  }
}

// PUT /cards/:id - Update card
export async function update(req, res) {
  const errors = validationResult(req);

  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      req.flash('error', 'Card not found');
      return res.redirect('/cards');
    }

    if (
      card.createdBy.toString() !== req.session.userId &&
      req.session.userRole !== 'admin'
    ) {
      req.flash('error', 'You do not have permission to edit this card');
      return res.redirect('/cards');
    }

    if (!errors.isEmpty()) {
      const decks = await Deck.find({ createdBy: req.session.userId }).sort({
        isDefault: -1,
        name: 1,
      });

      return res.status(400).render('cards/edit', {
        title: 'Edit Card',
        card,
        decks,
        errors: errors.array(),
        oldInput: req.body,
      });
    }

    const { front, back, deck, tags } = req.body;

    card.front = front.trim();
    card.back = back.trim();
    card.deck = deck || null;
    card.tags = parseTags(tags);

    await card.save();

    req.flash('success', 'Card updated successfully');
    res.redirect(`/cards/${card._id}`);
  } catch (error) {
    console.error('Error updating card:', error);
    req.flash('error', 'Failed to update card');
    res.redirect('/cards');
  }
}

// DELETE /cards/:id - Delete card
export async function destroy(req, res) {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      req.flash('error', 'Card not found');
      return res.redirect('/cards');
    }

    if (
      card.createdBy.toString() !== req.session.userId &&
      req.session.userRole !== 'admin'
    ) {
      req.flash('error', 'You do not have permission to delete this card');
      return res.redirect('/cards');
    }

    await card.deleteOne();

    req.flash('success', 'Card deleted');
    res.redirect('/cards');
  } catch (error) {
    console.error('Error deleting card:', error);
    req.flash('error', 'Failed to delete card');
    res.redirect('/cards');
  }
}

// GET /cards/review - Show review session for due cards
export async function review(req, res) {
  try {
    const now = new Date();
    const dueCards = await Card.find({
      createdBy: req.session.userId,
      nextReviewDate: { $lte: now },
    }).sort({ nextReviewDate: 1 });

    if (dueCards.length === 0) {
      return res.render('cards/review', {
        title: 'Review Session',
        card: null,
        totalDue: 0,
        message: 'All done! No cards due for review.',
      });
    }

    const card = dueCards[0];

    res.render('cards/review', {
      title: 'Review Session',
      card,
      totalDue: dueCards.length,
      message: null,
    });
  } catch (error) {
    console.error('Error starting review:', error);
    req.flash('error', 'Unable to start review session.');
    res.redirect('/cards');
  }
}

// POST /cards/:id/answer - API for SM-2 review answers
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

    const card = await Card.findOne({
      _id: req.params.id,
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
      createdBy: req.session.userId,
      nextReviewDate: { $lte: now },
    }).sort({ nextReviewDate: 1 });

    if (dueCards.length === 0) {
      return res.json({
        success: true,
        hasNextCard: false,
        nextCard: null,
        remainingCount: 0,
        message: 'All done! No cards due for review.',
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
    console.error('API Answer Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to process your answer. Please try again.',
    });
  }
}

// Parse comma-separated tags string into array
function parseTags(tagsString) {
  if (!tagsString) return [];
  return tagsString
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);
}
