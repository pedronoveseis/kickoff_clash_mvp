// Integration tests for the complete game flow

// Import the game logic functions
const { calculateScore, validateTurn } = require('./test_gameLogic.js');

// Mock DOM elements
const mockDOM = {
    status: { textContent: '' },
    confirmBtn: { disabled: false },
    undoBtn: { disabled: false },

    currentTurn: { textContent: '1' },
    score: { textContent: 'Pontuação: 0', classList: { add: () => {}, remove: () => {} } }
};

// Game state
let currentTurn = 1;
let totalScore = 0;
let selectedCards = [];
let playerHand = [];

// Mock card data
const mockCards = [
    { name: "Kylian Mbappe", country: "France", club: "Real Madrid", base_value: 9, rarity: "epic" },
    { name: "Vinicius Junior", country: "Brazil", club: "Real Madrid", base_value: 11, rarity: "epic" },
    { name: "Jude Bellingham", country: "England", club: "Real Madrid", base_value: 8, rarity: "rare" },
    { name: "Erling Haaland", country: "Norway", club: "Manchester City", base_value: 9, rarity: "epic" },
    { name: "Lionel Messi", country: "Argentina", club: "Inter Miami", base_value: 10, rarity: "legend" },
    { name: "Cristiano Ronaldo", country: "Portugal", club: "Al Nassr", base_value: 9, rarity: "legend" }
];

// UI update function
function updateGameInfo() {
    mockDOM.currentTurn.textContent = currentTurn;
    mockDOM.score.textContent = `Pontuação: ${totalScore}`;
}

// Game end function
function endGame() {
    mockDOM.confirmBtn.disabled = true;
    mockDOM.undoBtn.disabled = true;
    mockDOM.score.classList.add('final-score');
}

// Main game function that integrates with real game logic
function playTurn(cards) {
    // Validate turn
    const gameRules = {
        deck: {
            minCardsPerTurn: 2,
            maxCardsPerTurn: 5
        }
    };
    
    const validationResult = validateTurn(cards, gameRules, currentTurn);
    
    if (!validationResult.isValid) {
        return { success: false, errors: validationResult.errors };
    }
    
    // Calculate score using real game logic
    const combinations = [
        { type: 'country', required_players: 2, multiplier: 3 },
        { type: 'club', required_players: 2, multiplier: 2 }
    ];
    
    const scoreResult = calculateScore(cards, combinations);
    
    // Update game state
    totalScore += scoreResult.score;
    currentTurn++;
    
    // Update UI
    updateGameInfo();
    
    mockDOM.status.textContent = `Jogada confirmada! ${scoreResult.baseSum} x ${scoreResult.combination === 'country' ? 3 : scoreResult.combination === 'club' ? 2 : 1} = ${scoreResult.score} pontos.`;
    
    // Check for game end
    if (currentTurn > 4) {
        endGame();
        return { success: true, gameEnded: true, score: scoreResult.score, finalScore: totalScore };
    }
    
    return { success: true, score: scoreResult.score };
}

// Test scenarios
console.log('=== Integration Test Suite ===\n');

// Test 1: Valid turn with no combination
console.log('Test 1: Valid turn with no combination');
currentTurn = 1;
totalScore = 0;
const result1 = playTurn([mockCards[0], mockCards[3]]); // Mbappe and Haaland (different country and club)
console.log(`Turn: ${currentTurn-1} -> ${currentTurn}, Score: ${result1.score}, Total: ${totalScore}`);
console.log(`Expected: Score=18, Total=18 | Actual: Score=${result1.score}, Total=${totalScore}\n---\n`);

// Test 2: Valid turn with club combination
console.log('Test 2: Valid turn with club combination');
currentTurn = 2;
const result2 = playTurn([mockCards[0], mockCards[1], mockCards[2]]); // All Real Madrid
console.log(`Turn: ${currentTurn-1} -> ${currentTurn}, Score: ${result2.score}, Total: ${totalScore}`);
console.log(`Expected: Score=56, Total=74 | Actual: Score=${result2.score}, Total=${totalScore}\n---\n`);

// Test 3: Valid turn with country combination
console.log('Test 3: Valid turn with country combination');
currentTurn = 3;
// Create two players from the same country
const brazilCard1 = { ...mockCards[1] }; // Vinicius Junior
const brazilCard2 = { name: "Neymar Jr", country: "Brazil", club: "Al Hilal", base_value: 9, rarity: "epic" };
const result3 = playTurn([brazilCard1, brazilCard2]);
console.log(`Turn: ${currentTurn-1} -> ${currentTurn}, Score: ${result3.score}, Total: ${totalScore}`);
console.log(`Expected: Score=60, Total=134 | Actual: Score=${result3.score}, Total=${totalScore}
---
`);

// Test 4: Valid turn that leads to game end
console.log('Test 4: Valid turn that leads to game end');
currentTurn = 4;
const result4 = playTurn([mockCards[4], mockCards[5]]); // Messi and Ronaldo (different country and club)
console.log(`Turn: ${currentTurn-1} -> ${currentTurn}, Score: ${result4.score}, Total: ${totalScore}`);
console.log(`Expected: Score=19, Total=153, Game ended: true | Actual: Score=${result4.score}, Total=${totalScore}, Game ended: ${result4.gameEnded}
---
`);

// Test 5: Attempt to play after game end
console.log('Test 5: Attempt to play after game end');
currentTurn = 5;
mockDOM.confirmBtn.disabled = true;
mockDOM.undoBtn.disabled = true;
const result5 = playTurn([mockCards[0], mockCards[1]]);
console.log(`Game state: Turn ${currentTurn}, Buttons disabled: ${mockDOM.confirmBtn.disabled}, Status: "${mockDOM.status.textContent}"`);
console.log('Expected: Game remains ended with buttons disabled\n---\n');

// Test 6: Invalid turn (too few cards)
console.log('Test 6: Invalid turn (too few cards)');
currentTurn = 1; // Reset for this test
totalScore = 0; // Reset for this test
const result6 = playTurn([mockCards[0]]); // Only 1 card
console.log(`Validation success: ${result6.success}, Errors: ${result6.errors ? result6.errors.join(', ') : 'None'}`);
console.log('Expected: Validation failure with error message\n---\n');

// Test 7: Invalid turn (too many cards)
console.log('Test 7: Invalid turn (too many cards)');
const tooManyCards = [mockCards[0], mockCards[1], mockCards[2], mockCards[3], mockCards[4], mockCards[5]]; // 6 cards
const result7 = playTurn(tooManyCards);
console.log(`Validation success: ${result7.success}, Errors: ${result7.errors ? result7.errors.join(', ') : 'None'}`);
console.log('Expected: Validation failure with error message\n---\n');

console.log('=== End of Integration Test Suite ===');