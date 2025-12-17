import mongoose from 'mongoose';

const vocabularySchema = new mongoose.Schema({
  word: {
    type: String,
    required: [true, 'Word is required'],
    trim: true
  },
  definition: {
    type: String,
    required: [true, 'Definition is required']
  },
  difficultyLevel: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: ['beginner', 'intermediate', 'advanced']
  },
  translation: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  createdBy: { // tracking who created this word
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Learner',
    required: true
  }
},
  {
    timestamps: true // automatically adds `createdAt` and `updatedAt` fields.
  }
);

// Index for faster queries by owner
// 1 (ascending): sorts from smallest to largest.
// -1 (descending): sorts from largest to smallest.
// creating a "lookup table" that allows the database to jump straight to the relevant documents.
vocabularySchema.index({ createdBy: 1 });

const Vocabulary = mongoose.model('Vocabulary', vocabularySchema);

export default Vocabulary;
