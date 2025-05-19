// Rubik's cube move notation
const MOVES = {
    // Face turns
    R: ['R', 'R\'', 'R2'],
    L: ['L', 'L\'', 'L2'],
    U: ['U', 'U\'', 'U2'],
    D: ['D', 'D\'', 'D2'],
    F: ['F', 'F\'', 'F2'],
    B: ['B', 'B\'', 'B2']
};

// Generate a random move
function getRandomMove() {
    const faces = Object.keys(MOVES);
    const randomFace = faces[Math.floor(Math.random() * faces.length)];
    const moves = MOVES[randomFace];
    return moves[Math.floor(Math.random() * moves.length)];
}

// Check if two consecutive moves are on the same face
function isSameFace(move1, move2) {
    return move1[0] === move2[0];
}

// Generate a valid scramble
function generateScramble(length = 20) {
    let scramble = [];
    let lastMove = '';

    while (scramble.length < length) {
        const move = getRandomMove();
        
        // Avoid same face moves and redundant moves
        if (!isSameFace(move, lastMove)) {
            scramble.push(move);
            lastMove = move;
        }
    }

    return scramble.join(' ');
}

// Export the function
window.generateScramble = generateScramble; 