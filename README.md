# Gabble Learning

A vocabulary learning web app that uses AI and spaced repetition to help you master new languages efficiently.

## Features

- **Smart Review System** — Uses the SM-2 algorithm to schedule reviews at optimal intervals, so you study words right before you forget them
- **AI-Powered Cards** — Get instant translations, definitions, and example sentences via Google Gemini
- **Deck Organization** — Group cards into decks by topic, language, or however you prefer
- **Progress Tracking** — See which cards are due and track your learning journey
- **Multi-Language Support** — Set your native and target languages for personalized learning

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Express.js 5, Node.js |
| Database | MongoDB + Mongoose |
| Frontend | EJS templates, vanilla CSS/JS |
| AI | Google Gemini API |
| Auth | Session-based with bcrypt |

## Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ODM |
| ejs | Templating engine |
| @google/genai | Gemini AI integration |
| bcryptjs | Password hashing |
| express-session | Session management |
| connect-mongo | MongoDB session store |
| connect-flash | Flash messages |
| express-validator | Input validation |
| method-override | HTTP method support |
| dotenv | Environment variables |
| nodemon | Dev auto-reload |

## Quick Start

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- Google Gemini API key

### Setup

```bash
# Clone and install
git clone <repo-url>
cd gabble-learning
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

The app runs at `http://localhost:3000`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URI` | MongoDB connection string |
| `SESSION_SECRET` | Random string for session encryption |
| `GEMINI_API_KEY` | Google Gemini API key |
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | `development` or `production` |

## Project Structure

```
gabble-learning/
---- app.js              # Express server setup
---- models/             # MongoDB schemas (Learner, Card, Deck)
---- controllers/        # Request handlers
---- routes/             # API endpoints
---- services/           # SM-2 algorithm, Gemini integration
---- middleware/         # Auth guards
---- views/              # EJS templates
---- public/             # CSS, JS, images
```

## How It Works

1. **Create cards** — Add vocabulary with front (word) and back (meaning)
2. **Use AI assistance** — Optionally generate translations and examples
3. **Review daily** — The app shows you cards that are due
4. **Rate your recall** — Choose Again, Hard, Good, or Easy
5. **Learn efficiently** — SM-2 adjusts intervals based on your performance

## The SM-2 Algorithm

This app uses the [SM-2 (SuperMemo 2)](https://super-memory.com/english/ol/sm2.htm) spaced repetition algorithm, created by Piotr Wozniak in 1987. SM-2 calculates optimal review intervals based on how well you recall each card, adjusting the schedule to maximize long-term retention with minimal reviews.

## Data Schema

```
Learner
---- name, email, password
---- targetLanguage, nativeLanguage
---- interests, role
---- createdAt

Deck
---- name, description
---- isDefault
---- createdBy → Learner
---- timestamps

Card
---- front, back, tags[]
---- deck → Deck
---- SM-2: easeFactor, interval, repetitions, nextReviewDate
---- createdBy → Learner
---- timestamps
```

## API Routes

| Route | Description |
|-------|-------------|
| `/auth/*` | Login, register, logout |
| `/decks/*` | Create and manage decks |
| `/cards/*` | CRUD operations and reviews |
| `/api/ai/*` | AI word information |
| `/profile/*` | User settings |

## Scripts

```bash
npm run dev    # Development with auto-reload
npm start      # Production server
```

## Future Features

Inspired by [Fluent Forever](https://fluent-forever.com/) methodology:

- **AI Image Generation** — Generate memorable, personalized images for cards instead of searching
- **Pronunciation Coaching** — Real-time phonetic feedback comparing your audio to native speakers
- **Contextual Grammar** — Tap any sentence for instant grammar explanations from AI

## License

MIT
