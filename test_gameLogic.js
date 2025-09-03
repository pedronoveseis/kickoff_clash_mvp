// Test suite for game logic functions

// Importing functions for Node.js environment
const { calculateScore, validateTurn } = require('./js/gameLogic.js');

// Mock game rules based on Regras_Do_Card_Game.xml
const mockGameRules = {
    deck: {
        totalCards: 33,
        minCardsPerTurn: 2,
        maxCardsPerTurn: 5
    },
    combinations: [
        { type: 'country', required_players: 2, multiplier: 3 },
        { type: 'club', required_players: 2, multiplier: 2 }
    ]
};

// Mock card data based on players.json
const mockCards = [
    { id: "KM09", name: "Kylian Mbappe", country: "France", club: "Real Madrid", base_value: 9 },
    { id: "VJ11", name: "Vinicius Junior", country: "Brazil", club: "Real Madrid", base_value: 11 },
    { id: "JB08", name: "Jude Bellingham", country: "England", club: "Real Madrid", base_value: 8 },
    { id: "EH09", name: "Erling Haaland", country: "Norway", club: "Manchester City", base_value: 9 },
    { id: "LM10", name: "Lionel Messi", country: "Argentina", club: "Inter Miami", base_value: 10 }
];

// --- Test Cases ---

// Test 1: Calculate Score - No Combination
console.log('Test 1: Calculate Score - No Combination');
const noComboCards = [mockCards[0], mockCards[3]]; // Mbappe (France) and Haaland (Norway)
const result1 = calculateScore(noComboCards, mockGameRules.combinations);
console.log(`Expected: Score=18, Combination=none, BaseSum=18 | Actual: Score=${result1.score}, Combination=${result1.combination}, BaseSum=${result1.baseSum}`);
console.log('---');

// Test 2: Calculate Score - Club Combination (x2)
console.log('Test 2: Calculate Score - Club Combination (x2)');
const clubComboCards = [mockCards[0], mockCards[1], mockCards[2]]; // All Real Madrid
const result2 = calculateScore(clubComboCards, mockGameRules.combinations);
console.log(`Expected: Score=56, Combination=club, BaseSum=28 | Actual: Score=${result2.score}, Combination=${result2.combination}, BaseSum=${result2.baseSum}`);
console.log('---');

// Test 3: Calculate Score - Country Combination (x3) - Higher Priority
console.log('Test 3: Calculate Score - Country Combination (x3) - Higher Priority');
const countryComboCards = [mockCards[1], mockCards[4]]; // Vinicius (Brazil) and Alisson (Brazil) - need to add Alisson to mock or use another
// Let's simulate a country combo with available mock cards by adjusting the test concept slightly or adding a mock card.
// For this test, let's assume we have two French players. We'll modify one mock card for the test.
const frenchCard1 = { ...mockCards[0] }; // Kylian Mbappe
const frenchCard2 = { ...mockCards[0], id: "FC07", name: "Franck Chris", country: "France", base_value: 7 }; // Another French player
const countryComboCards2 = [frenchCard1, frenchCard2];
const result3 = calculateScore(countryComboCards2, mockGameRules.combinations);
console.log(`Expected: Score=48, Combination=country, BaseSum=16 | Actual: Score=${result3.score}, Combination=${result3.combination}, BaseSum=${result3.baseSum}`);
console.log('---');

// Test 4: Validate Turn - Valid Number of Cards
console.log('Test 4: Validate Turn - Valid Number of Cards');
const validTurnCards = [mockCards[0], mockCards[1], mockCards[2]];
const validationResult1 = validateTurn(validTurnCards, mockGameRules, 1);
console.log(`Expected: isValid=true | Actual: isValid=${validationResult1.isValid}, Errors: ${validationResult1.errors.join(', ')}`);
console.log('---');

// Test 5: Validate Turn - Invalid Number of Cards (Too Few)
console.log('Test 5: Validate Turn - Invalid Number of Cards (Too Few)');
const invalidTurnCardsFew = [mockCards[0]];
const validationResult2 = validateTurn(invalidTurnCardsFew, mockGameRules, 2);
console.log(`Expected: isValid=false | Actual: isValid=${validationResult2.isValid}, Errors: ${validationResult2.errors.join(', ')}`);
console.log('---');

// Test 6: Validate Turn - Invalid Number of Cards (Too Many)
console.log('Test 6: Validate Turn - Invalid Number of Cards (Too Many)');
const invalidTurnCardsMany = [mockCards[0], mockCards[1], mockCards[2], mockCards[3], mockCards[4], mockCards[0]]; // 6 cards
const validationResult3 = validateTurn(invalidTurnCardsMany, mockGameRules, 3);
console.log(`Expected: isValid=false | Actual: isValid=${validationResult3.isValid}, Errors: ${validationResult3.errors.join(', ')}`);
console.log('---');