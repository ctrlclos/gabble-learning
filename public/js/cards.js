// Card review - AJAX with SM-2 algorithm

let currentCardId = null;
let currentDeckId = null;

// Initialization
document.addEventListener('DOMContentLoaded', function () {
  const flashcardElement = document.getElementById('flashcard');
  if (flashcardElement) {
    currentCardId = flashcardElement.dataset.cardId;
    currentDeckId = flashcardElement.dataset.deckId || null;
  }

  setupAnswerButtons();
});

// Event setup
function setupAnswerButtons() {
  const qualityButtons = document.querySelectorAll('.btn-quality');

  qualityButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const quality = parseInt(button.dataset.quality, 10);
      submitAnswer(quality);
    });
  });
}

// Show and hide answer
function showAnswer() {
  const cardBack = document.getElementById('card-back');
  const showAnswerBtn = document.getElementById('show-answer-btn');
  const answerButtons = document.getElementById('answer-buttons');

  if (cardBack) cardBack.classList.add('visible');
  if (showAnswerBtn) showAnswerBtn.style.display = 'none';
  if (answerButtons) answerButtons.classList.add('visible');
}

function hideAnswer() {
  const cardBack = document.getElementById('card-back');
  const showAnswerBtn = document.getElementById('show-answer-btn');
  const answerButtons = document.getElementById('answer-buttons');

  if (cardBack) cardBack.classList.remove('visible');
  if (showAnswerBtn) showAnswerBtn.style.display = 'block';
  if (answerButtons) answerButtons.classList.remove('visible');
}

// Answer submission using SM-2 quality rating
async function submitAnswer(quality) {
  if (!currentCardId) {
    showError('Cannot submit answer: Card information is missing.');
    return;
  }

  setLoadingState(true);

  try {
    // Build the correct API URL based on whether this is a deck review or general review
    let apiUrl;
    if (currentDeckId) {
      apiUrl = `/decks/${currentDeckId}/review/${currentCardId}/answer`;
    } else {
      apiUrl = `/cards/${currentCardId}/answer`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quality: quality }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to save your answer');
    }

    if (data.hasNextCard) {
      updateCard(data.nextCard, data.remainingCount);
    } else {
      showCompletionMessage(data.message);
    }
  } catch (error) {
    showError(error.message);
    console.error('Submit error:', error);
  } finally {
    setLoadingState(false);
  }
}

// UI update functions
function updateCard(nextCard, remainingCount) {
  const flashcardElement = document.getElementById('flashcard');
  const cardFront = document.querySelector('.card-front p');
  const answerText = document.querySelector('.card-back .answer-text');
  const progressInfo = document.querySelector('.progress-info');

  currentCardId = nextCard.id;
  if (flashcardElement) flashcardElement.dataset.cardId = nextCard.id;

  // Sentence cards (fill-in-blank): show front, answer is back
  // Word cards: show back (definition), answer is front (word)
  const isSentenceCard = nextCard.front.includes('_____');
  if (flashcardElement) flashcardElement.dataset.isSentence = isSentenceCard;

  if (isSentenceCard) {
    if (cardFront) cardFront.textContent = nextCard.front;
    if (answerText) answerText.textContent = nextCard.back;
  } else {
    if (cardFront) cardFront.textContent = nextCard.back;
    if (answerText) answerText.textContent = nextCard.front;
  }

  if (progressInfo) {
    progressInfo.textContent = `Card 1 of ${remainingCount} due for review`;
  }

  hideAnswer();

  if (flashcardElement) {
    flashcardElement.classList.add('card-updated');
    setTimeout(() => flashcardElement.classList.remove('card-updated'), 300);
  }
}

function showCompletionMessage(message) {
  const reviewContainer = document.querySelector('.review-container');
  if (!reviewContainer) return;

  const backUrl = currentDeckId ? `/decks/${currentDeckId}` : '/cards';
  const backText = currentDeckId ? 'Back to Deck' : 'Back to Cards';

  reviewContainer.innerHTML = `
    <h1>Review Session</h1>
    <div class="empty-state">
      <h2>All Done!</h2>
      <p>${escapeHtml(message)}</p>
      <a href="${backUrl}" class="btn btn-primary">${backText}</a>
    </div>
  `;
}

// Error handling
function showError(message) {
  let errorContainer = document.querySelector('.ajax-error');

  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.className = 'ajax-error alert alert-error';
    const reviewContainer = document.querySelector('.review-container');
    if (reviewContainer) {
      reviewContainer.insertBefore(errorContainer, reviewContainer.firstChild);
    }
  }

  errorContainer.innerHTML = `
    <p>${escapeHtml(message)}</p>
    <button type="button" class="error-dismiss" onclick="dismissError()">
      Dismiss
    </button>
  `;

  setTimeout(dismissError, 5000);
}

function dismissError() {
  const errorContainer = document.querySelector('.ajax-error');
  if (errorContainer) errorContainer.remove();
}

// Loading state
function setLoadingState(isLoading) {
  const qualityButtons = document.querySelectorAll('.btn-quality');
  const flashcard = document.getElementById('flashcard');

  if (isLoading) {
    qualityButtons.forEach((btn) => {
      btn.disabled = true;
      btn.classList.add('loading');
    });
    if (flashcard) flashcard.classList.add('loading');
  } else {
    qualityButtons.forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove('loading');
    });
    if (flashcard) flashcard.classList.remove('loading');
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
