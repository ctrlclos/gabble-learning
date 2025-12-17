import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    front: {
      type: String,
      required: [true, 'Front side is required'],
      trim: true,
    },
    back: {
      type: String,
      required: [true, 'Back side is required'],
      trim: true,
    },
    level: { //LEITNER LEVEL (which box the card is in)
      type: Number,
      default: 1, // new cards -> start in box 1
      min: 1, // cards cannot go bellow box 1
      max: 5 // cards cannot go above box 5
    },
    nextReviewDate: {
      type: Date,
      default: Date.now // new cards - due immediately
    },
    createdBy: { // who owns this card?
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Learner',
      required: true,
    },
  },
  {
    timestamps: true // this option automatically adds createdAt and updatedAt
  }
);

const Flashcard = mongoose.model('Flascard', flashcardSchema);

export default Flashcard;
