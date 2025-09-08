// script.js (Not ESM in current HTML setup, relies on globals from gameLogic.js)

// These functions are made globally available by gameLogic.js
// import { loadGameData, validateData, calculateScore, validateTurn } from './gameLogic.js';

const STATUS_EL = document.getElementById('status');
const HAND_CONTAINER_EL = document.querySelector('#hand .card-container');
const CONFIRM_BTN_EL = document.getElementById('confirmBtn');
const UNDO_BTN_EL = document.getElementById('undoBtn');
const SCORE_EL = document.getElementById('score');
const CURRENT_TURN_EL = document.getElementById('current-turn');
const TURN_PROGRESS_EL = document.getElementById('turn-progress');

// Ajuste o caminho caso esteja em outra pasta ou servido por backend.
const DATA_URL = './data/players.json'; // Corrected path

let gameData = null;
let playerDeck = []; // Full deck of cards
let playerHand = []; // Cards currently in hand (max 6)
let selectedCards = [];
let currentTurn = 1;
let totalScore = 0;
let gameEnded = false; // Flag to track if game has ended
let turnHistory = []; // Keep track of plays for summary

// --- Game State Management ---
async function initializeGame() {
    try {
        gameData = await loadGameData(DATA_URL);

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
    // Draw cards to refill the hand up to 6 cards
    const cardsToDraw = Math.min(number, 6 - playerHand.length, playerDeck.length);
    
    for (let i = 0; i < cardsToDraw; i++) {
        if (playerDeck.length > 0) {
            const drawnCard = playerDeck.pop();
            playerHand.push(drawnCard);
        } else {
            // No more cards in deck
            break;
        }
    }
}

function updateGameInfo() {
    CURRENT_TURN_EL.textContent = currentTurn;
    SCORE_EL.textContent = `Pontuação: ${totalScore}`;
    // Update hand count display
    document.querySelector('#hand .cards-count').textContent = `(${playerHand.length})`;
    // Update turn progress bar
    const progressPercentage = ((currentTurn - 1) / 4) * 100;
    TURN_PROGRESS_EL.style.width = `${progressPercentage}%`;
}

// --- UI Rendering ---

function renderHand() {
    HAND_CONTAINER_EL.innerHTML = '';
    playerHand.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.rarity ? card.rarity.toLowerCase() : ''}`;
        cardEl.dataset.cardIndex = index; // Link back to playerHand index
        
        // Create the country pill with rarity-based color
        const rarityClass = card.rarity ? card.rarity.toLowerCase() : 'common';
        const countryPill = `<span class="country-pill ${rarityClass}">${card.country}</span>`;
        
        // Create the value circle with rarity-based color
        const valueCircle = `<span class="value-circle ${rarityClass}">${card.base_value}</span>`;
        
        // Card display with proper layout
        cardEl.innerHTML = `
            <div class="card-header">
                <span class="player-name">${card.name}</span>
                <span class="country-container">${countryPill}</span>
            </div>
            <div class="card-body">
                <div class="club-info">
                    <div class="club-name">${card.club}</div>
                </div>
            </div>
            <div class="card-footer">${valueCircle}</div>
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
        cardElement.classList.add('selected');
    } else {
        // Deselect card
        selectedCards.splice(isSelectedIndex, 1);
        cardElement.classList.remove('selected');
    }
    // Update selected card counter
    SELECTED_COUNT_EL.textContent = selectedCards.length;
    console.log("Selected card indices:", selectedCards);
}

// Add touch support for mobile devices
function addTouchSupport() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);
    
    document.addEventListener('touchend', function(e) {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // Check if it's a tap (not a swipe)
        if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
            // Find the target element
            const target = e.target.closest('.card');
            if (target) {
                // Trigger the click event
                target.click();
            }
        }
    }, false);
}

// --- Game Logic Integration ---

function handleConfirmPlay() {
    // Check if game has ended
    if (gameEnded) {
        alert(`Pontuação Final: ${totalScore} pontos!`);
        return;
    }
    
    if (currentTurn > 4) {
        STATUS_EL.textContent = "O jogo já terminou!";
        return;
    }
    
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
    
    // Save turn history
    turnHistory.push({
        turn: currentTurn,
        cards: cardsToPlay,
        score: scoreResult.score,
        combination: scoreResult.combination,
        baseSum: scoreResult.baseSum
    });
    
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
    
    // Show detailed scoring feedback
    const combinationText = scoreResult.combination === 'country' ? 'País (x3)' : 
                           scoreResult.combination === 'club' ? 'Clube (x2)' : 'Sem combinação (x1)';
    const pointsText = `${scoreResult.baseSum} x ${scoreResult.combination === 'country' ? 3 : scoreResult.combination === 'club' ? 2 : 1} = ${scoreResult.score} pontos`;
    
    STATUS_EL.innerHTML = `Jogada confirmada!<br><strong>${combinationText}</strong><br>${pointsText}`;
    
    // Add animation to score display
    SCORE_EL.classList.add('highlight');
    setTimeout(() => {
        SCORE_EL.classList.remove('highlight');
    }, 1000);
    
    // Check for end of match (MVP: 5 turns)
    if (currentTurn > 5) {
        gameEnded = true;
        STATUS_EL.innerHTML += "<br><strong>Fim da partida!</strong>";
        CONFIRM_BTN_EL.textContent = "Ver Pontuação Final";
        CONFIRM_BTN_EL.disabled = false;
        UNDO_BTN_EL.disabled = true;
        
        // Remove the existing event listener and add a new one to show final score
        CONFIRM_BTN_EL.removeEventListener('click', handleConfirmPlay);
        CONFIRM_BTN_EL.addEventListener('click', showFinalScoreModal);
    }
}

function handleUndo() {
    // Check if game has ended
    if (gameEnded) {
        return;
    }
    
    // MVP: Simple undo - just clear selection
    // A more complex version would revert the last play
    selectedCards.forEach(index => {
        const cardEl = HAND_CONTAINER_EL.querySelector(`.card[data-card-index="${index}"]`);
        if (cardEl) {
            cardEl.classList.remove('selected');
        }
    });
    selectedCards = [];
    // Reset selected card counter
    SELECTED_COUNT_EL.textContent = selectedCards.length;
}

// --- Final Score Modal ---
function showFinalScoreModal() {
    const finalScoreModal = document.getElementById('finalScoreModal');
    const finalScoreValue = document.getElementById('finalScoreValue');
    const turnsSummary = document.getElementById('turnsSummary');
    
    // Set final score
    finalScoreValue.textContent = totalScore;
    
    // Generate turns summary
    let summaryHTML = '<h3>Resumo dos Turnos</h3>';
    turnHistory.forEach(turn => {
        const combinationText = turn.combination === 'country' ? 'País (x3)' : 
                              turn.combination === 'club' ? 'Clube (x2)' : 'Sem combinação (x1)';
        summaryHTML += `
            <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <div><strong>Turno ${turn.turn}:</strong> ${turn.cards.length} cartas</div>
                <div>Combinação: ${combinationText}</div>
                <div>Pontuação: ${turn.baseSum} x ${turn.combination === 'country' ? 3 : turn.combination === 'club' ? 2 : 1} = ${turn.score} pontos</div>
            </div>
        `;
    });
    
    turnsSummary.innerHTML = summaryHTML;
    
    // Show modal
    finalScoreModal.style.display = 'block';
    
    // Set up close button
    const closeBtn = finalScoreModal.querySelector('.close');
    closeBtn.onclick = function() {
        finalScoreModal.style.display = 'none';
    };
    
    // Close modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == finalScoreModal) {
            finalScoreModal.style.display = 'none';
        }
    };
    
    // Set up play again button
    const playAgainBtn = document.getElementById('playAgainBtn');
    playAgainBtn.onclick = function() {
        // Reset game state
        currentTurn = 1;
        totalScore = 0;
        turnHistory = [];
        gameEnded = false;
        
        // Hide modal
        finalScoreModal.style.display = 'none';
        
        // Reinitialize game
        initializeGame();
        
        // Reset button text and event listener
        CONFIRM_BTN_EL.textContent = "Confirmar Jogada";
        CONFIRM_BTN_EL.removeEventListener('click', showFinalScoreModal);
        CONFIRM_BTN_EL.addEventListener('click', handleConfirmPlay);
        UNDO_BTN_EL.disabled = false;
    };
}

// --- Modal Functionality ---
function initializeModal() {
    const rulesLink = document.getElementById('rulesLink');
    const modal = document.getElementById('rulesModal');
    const closeBtn = document.querySelector('#rulesModal .close');
    
    if (rulesLink && modal && closeBtn) {
        rulesLink.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = 'block';
        });

        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });

        // Close modal when clicking outside of it
        window.addEventListener('click', function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Initialize final score modal
    const finalScoreModal = document.getElementById('finalScoreModal');
    if (finalScoreModal) {
        const closeBtn = finalScoreModal.querySelector('.close');
        closeBtn.addEventListener('click', function() {
            finalScoreModal.style.display = 'none';
        });
        
        // Close modal when clicking outside of it
        window.addEventListener('click', function(event) {
            if (event.target == finalScoreModal) {
                finalScoreModal.style.display = 'none';
            }
        });
    }
}

// --- Initialize the game on load ---
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    initializeModal();
    addTouchSupport(); // Add touch support for mobile devices
});