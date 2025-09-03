// script.js (Not ESM in current HTML setup, relies on globals from gameLogic.js)

// These functions are made globally available by gameLogic.js
// import { loadGameData, validateData, calculateScore, validateTurn } from './gameLogic.js';

const STATUS_EL = document.getElementById('status');
const HAND_CONTAINER_EL = document.querySelector('#hand .card-container');
const CONFIRM_BTN_EL = document.getElementById('confirmBtn');
const UNDO_BTN_EL = document.getElementById('undoBtn');
const SCORE_EL = document.getElementById('score');
const CURRENT_TURN_EL = document.getElementById('current-turn');

// Ajuste o caminho caso esteja em outra pasta ou servido por backend.
const DATA_URL = './data/players.json'; // Corrected path

let gameData = null;
let playerDeck = []; // Full deck of cards
let playerHand = []; // Cards currently in hand (max 6)
let selectedCards = [];
let currentTurn = 1;
let totalScore = 0;

// --- Game State Management ---

async function initializeGame() {
    try {
        gameData = await loadGameData(DATA_URL);
        STATUS_EL.textContent = 'Dados carregados com sucesso.';

        // Initialize the player's deck by shuffling a copy of all cards
        playerDeck = [...gameData.cards];
        shuffleDeck(playerDeck);

        // Draw initial hand
        drawCards(6);

        renderHand();

        // Set up event listeners
        CONFIRM_BTN_EL.addEventListener('click', handleConfirmPlay);
        UNDO_BTN_EL.addEventListener('click', handleUndo);

        updateGameInfo();
        STATUS_EL.textContent = 'Jogo iniciado. Selecione cartas e confirme sua jogada.';
    } catch (err) {
        console.error('Erro ao inicializar o jogo:', err);
        STATUS_EL.textContent = `Erro ao inicializar o jogo: ${err.message}`;
    }
}

function shuffleDeck(deck) {
    // Fisher-Yates shuffle algorithm
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function drawCards(number) {
    for (let i = 0; i < number; i++) {
        if (playerDeck.length > 0 && playerHand.length < 6) {
            const drawnCard = playerDeck.pop();
            playerHand.push(drawnCard);
        } else {
            // No more cards in deck or hand is full
            break;
        }
    }
}

function updateGameInfo() {
    CURRENT_TURN_EL.textContent = currentTurn;
    SCORE_EL.textContent = `Pontuação: ${totalScore}`;
    // Update hand count display
    document.querySelector('#hand .cards-count').textContent = `(${playerHand.length})`;
}

// --- UI Rendering ---

function renderHand() {
    HAND_CONTAINER_EL.innerHTML = '';
    playerHand.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.rarity ? card.rarity.toLowerCase() : ''}`;
        cardEl.dataset.cardIndex = index; // Link back to playerHand index
        // Simplified card display for MVP
        cardEl.innerHTML = `
            <div class="card-header">
                <span class="player-name">${card.name}</span>
                <span class="player-info">${card.position || ''}</span>
            </div>
            <div class="stats">
                <span>País: ${card.country}</span>
                <span>Clube: ${card.club}</span>
                <span>Valor: ${card.base_value}</span>
            </div>
        `;
        cardEl.addEventListener('click', () => toggleCardSelection(index, cardEl));
        HAND_CONTAINER_EL.appendChild(cardEl);
    });
}

function toggleCardSelection(cardIndex, cardElement) {
    const isSelectedIndex = selectedCards.indexOf(cardIndex);
    if (isSelectedIndex === -1) {
        // Select card
        selectedCards.push(cardIndex);
        cardElement.style.border = '2px solid yellow'; // Simple highlight
        cardElement.style.boxShadow = '0 0 10px yellow';
    } else {
        // Deselect card
        selectedCards.splice(isSelectedIndex, 1);
        cardElement.style.border = ''; // Remove highlight
        cardElement.style.boxShadow = '';
    }
    console.log("Selected card indices:", selectedCards);
}

// --- Game Logic Integration ---

function handleConfirmPlay() {
    if (selectedCards.length === 0) {
        alert("Por favor, selecione pelo menos uma carta.");
        return;
    }

    const cardsToPlay = selectedCards.map(index => playerHand[index]);
    
    // Validate turn rules (MVP: check number of cards)
    // We'll need to mock or define `gameRules` based on XML for the browser
    const gameRules = {
        deck: {
             // These should ideally come from parsed XML or a JS config
            minCardsPerTurn: 2,
            maxCardsPerTurn: 5
        }
    };
    const validationResult = validateTurn(cardsToPlay, gameRules, currentTurn);
    
    if (!validationResult.isValid) {
        alert(validationResult.errors.join('\n'));
        return;
    }

    // Calculate score for the play
    const scoreResult = calculateScore(cardsToPlay, gameData.combinations);
    
    // Update game state
    totalScore += scoreResult.score;
    currentTurn++;
    
    // Remove played cards from hand
    playerHand = playerHand.filter((_, index) => !selectedCards.includes(index));
    
    // Draw new cards to refill hand up to 6
    drawCards(selectedCards.length);
    
    selectedCards = []; // Clear selection
    
    // Update UI
    renderHand();
    updateGameInfo();
    
    STATUS_EL.textContent = `Jogada confirmada! ${scoreResult.baseSum} x ${scoreResult.combination === 'country' ? 3 : scoreResult.combination === 'club' ? 2 : 1} = ${scoreResult.score} pontos.`;
    
    // Check for end of match (MVP: 4 turns)
    if (currentTurn > 4) {
        STATUS_EL.textContent += " Fim da partida!";
        CONFIRM_BTN_EL.disabled = true;
    }
}

function handleUndo() {
    // MVP: Simple undo - just clear selection
    // A more complex version would revert the last play
    selectedCards.forEach(index => {
        const cardEl = HAND_CONTAINER_EL.querySelector(`.card[data-card-index="${index}"]`);
        if (cardEl) {
            cardEl.style.border = '';
            cardEl.style.boxShadow = '';
        }
    });
    selectedCards = [];
    STATUS_EL.textContent = 'Jogada desfeita.';
}

// --- Initialize the game on load ---
initializeGame();