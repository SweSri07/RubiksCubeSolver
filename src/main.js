// Firestore sync helpers
async function saveSolveToFirestore(solve) {
    if (window.auth && window.auth.currentUser) {
        await window.db.collection('users').doc(window.auth.currentUser.uid)
            .collection('solves').add(solve);
    }
}

async function loadSolvesFromFirestore() {
    if (window.auth && window.auth.currentUser) {
        const snapshot = await window.db.collection('users').doc(window.auth.currentUser.uid)
            .collection('solves').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return [];
}

// State management
class AppState {
    constructor() {
        console.log('AppState constructor called');
        this.solves = [];
        this.sessionSolves = [];
        this.currentScramble = '';
        this.timerRunning = false;
        this.startTime = 0;
        this.timerInterval = null;
        this.cubeState = this.initializeCubeState();

        console.log('Loading solves...');
        this.loadSolves();
        console.log('Initializing UI...');
        this.initializeUI();
        console.log('AppState initialization complete');
    }

    initializeCubeState() {
        // Initialize solved cube state with correct color names
        return {
            U: Array(9).fill('white'),
            R: Array(9).fill('red'),
            F: Array(9).fill('green'),
            D: Array(9).fill('yellow'),
            L: Array(9).fill('orange'),
            B: Array(9).fill('blue')
        };
    }

    async loadSolves() {
        // If logged in, load from Firestore; else from localStorage
        if (window.auth && window.auth.currentUser) {
            this.solves = await loadSolvesFromFirestore();
        } else {
            const savedSolves = localStorage.getItem('solves');
            if (savedSolves) {
                this.solves = JSON.parse(savedSolves);
            }
        }
    }

    saveSolves() {
        // If logged in, save to Firestore; else to localStorage
        if (window.auth && window.auth.currentUser) {
            // Firestore save handled in addSolve
        } else {
            localStorage.setItem('solves', JSON.stringify(this.solves));
        }
    }

    initializeUI() {
        console.log('Initializing UI components');
        this.renderScramble();
        this.renderTimer();
        this.renderStats();
        this.renderHistory();
        this.setupEventListeners();
        console.log('UI initialization complete');
    }

    renderScramble() {
        console.log('Rendering scramble');
        const scrambleElement = document.getElementById('scrambleText');
        if (scrambleElement) {
            scrambleElement.textContent = this.currentScramble || 'Generate new scramble';
            console.log('Scramble text updated:', this.currentScramble);
        } else {
            console.warn('Scramble element not found');
        }
        // Debug: log the cube state before rendering
        console.log('Cube state before renderCube (in renderScramble):', JSON.parse(JSON.stringify(this.cubeState)));
        this.renderCube();
    }

    renderCube() {
        // Log the state at the top of renderCube
        console.log('Cube state at top of renderCube:', JSON.parse(JSON.stringify(this.cubeState)));
        const visualElement = document.getElementById('scrambleVisual');
        if (!visualElement) return;

        const html = `
            <div class="cube-net">
                <div class="cube-face face-back"> <div class="face-label">B</div> ${this.renderFace('B')} </div>
                <div class="cube-face face-left"> <div class="face-label">L</div> ${this.renderFace('L')} </div>
                <div class="cube-face face-up"> <div class="face-label">U</div> ${this.renderFace('U')} </div>
                <div class="cube-face face-right"> <div class="face-label">R</div> ${this.renderFace('R')} </div>
                <div class="cube-face face-down"> <div class="face-label">D</div> ${this.renderFace('D')} </div>
                <div class="cube-face face-front"> <div class="face-label">F</div> ${this.renderFace('F')} </div>
            </div>
        `;
        console.log('Injected scrambleVisual HTML:', html);
        visualElement.innerHTML = html;
    }

    renderFace(face) {
        // Map color names to CSS classes
        const colorMap = {
            white: 'sticker-white',
            red: 'sticker-red',
            green: 'sticker-green',
            yellow: 'sticker-yellow',
            orange: 'sticker-orange',
            blue: 'sticker-blue',
        };
        // Debug: log the face and its current state
        console.log(`Rendering face ${face}:`, this.cubeState[face]);
        return this.cubeState[face].map((color, idx) =>
            `<div class="cube-sticker ${colorMap[color] || ''}">${this.debugMode ? `<span class='sticker-index'>${idx}</span>` : ''}</div>`
        ).join('');
    }

    applyMove(move) {
        // Apply the move to the cube state (do NOT reset the cube here)
        const face = move[0];
        const direction = move.includes("'") ? 'counterclockwise' : 'clockwise';
        const isDouble = move.includes('2');
        console.log(`applyMove called: move=${move}, face=${face}, direction=${direction}, isDouble=${isDouble}`);
        // Apply the move 1 or 2 times
        const turns = isDouble ? 2 : 1;
        for (let i = 0; i < turns; i++) {
            this.rotateFace(face, direction);
            this.updateAdjacentFaces(face, direction);
            console.log(`After turn ${i+1} of ${move}:`, JSON.parse(JSON.stringify(this.cubeState)));
        }
    }

    rotateFace(face, direction) {
        // Rotates a face 90 degrees in the given direction
        const f = this.cubeState[face];
        let newFace;
        if (direction === 'clockwise') {
            newFace = [f[6], f[3], f[0], f[7], f[4], f[1], f[8], f[5], f[2]];
        } else {
            newFace = [f[2], f[5], f[8], f[1], f[4], f[7], f[0], f[3], f[6]];
        }
        this.cubeState[face] = newFace;
    }

    updateAdjacentFaces(face, direction) {
        // Standard Rubik's Cube facelet mapping for each move
        const cs = this.cubeState;
        // Helper to rotate arrays
        const rotate = (arr, dir) => dir === 'clockwise' ? arr.slice(-3).concat(arr.slice(0, -3)) : arr.slice(3).concat(arr.slice(0, 3));

        // For each face, define the order of adjacent faces and the indices of affected stickers
        // These are the standard mappings for a 3x3 cube
        const adjacent = {
            U: [
                { f: 'B', idx: [0,1,2] },
                { f: 'R', idx: [0,1,2] },
                { f: 'F', idx: [0,1,2] },
                { f: 'L', idx: [0,1,2] },
            ],
            D: [
                { f: 'F', idx: [6,7,8] },
                { f: 'R', idx: [6,7,8] },
                { f: 'B', idx: [6,7,8] },
                { f: 'L', idx: [6,7,8] },
            ],
            F: [
                { f: 'U', idx: [6,7,8] },
                { f: 'R', idx: [0,3,6] },
                { f: 'D', idx: [2,1,0] },
                { f: 'L', idx: [8,5,2] },
            ],
            B: [
                { f: 'U', idx: [2,1,0] },
                { f: 'L', idx: [0,3,6] },
                { f: 'D', idx: [6,7,8] },
                { f: 'R', idx: [8,5,2] },
            ],
            L: [
                { f: 'U', idx: [0,3,6] },
                { f: 'F', idx: [0,3,6] },
                { f: 'D', idx: [0,3,6] },
                { f: 'B', idx: [8,5,2] },
            ],
            R: [
                { f: 'U', idx: [8,5,2] },
                { f: 'B', idx: [0,3,6] },
                { f: 'D', idx: [8,5,2] },
                { f: 'F', idx: [8,5,2] },
            ],
        };

        // Get the stickers from the 4 adjacent faces
        const adj = adjacent[face];
        const stickers = adj.map(a => a.idx.map(i => cs[a.f][i]));
        // Rotate the stickers
        const rotated = direction === 'clockwise' ? rotate(stickers, 'counterclockwise') : rotate(stickers, 'clockwise');
        // Place the rotated stickers back
        for (let i = 0; i < 4; i++) {
            const a = adj[i];
            for (let j = 0; j < 3; j++) {
                cs[a.f][a.idx[j]] = rotated[i][j];
            }
        }
    }

    renderTimer() {
        console.log('Rendering timer');
        const timerElement = document.getElementById('timerDisplay');
        const timerBtn = document.getElementById('timerBtn');
        if (timerElement) {
            timerElement.textContent = '0.00';
            console.log('Timer display updated');
        } else {
            console.warn('Timer element not found');
        }
        if (timerBtn) {
            timerBtn.textContent = this.timerRunning ? 'Stop Timer' : 'Start Timer';
            console.log('Timer button updated');
        } else {
            console.warn('Timer button not found');
        }
    }

    renderStats() {
        const stats = this.calculateStats();
        const statsElement = document.getElementById('stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div>Personal Best: ${stats.personalBest.toFixed(2)}s</div>
                <div>Average of 5: ${stats.averageOf5.toFixed(2)}s</div>
                <div>Average of 10: ${stats.averageOf10.toFixed(2)}s</div>
                <div>Total Solves: ${stats.totalSolves}</div>
            `;
        }
    }

    renderHistory() {
        const historyElement = document.getElementById('history');
        if (historyElement) {
            // Get sort order from dropdown
            const sortSelect = document.getElementById('historySort');
            let solves = [...this.solves];
            if (sortSelect) {
                const sort = sortSelect.value;
                if (sort === 'newest') {
                    solves.sort((a, b) => b.date - a.date);
                } else if (sort === 'oldest') {
                    solves.sort((a, b) => a.date - b.date);
                } else if (sort === 'fastest') {
                    solves.sort((a, b) => a.time - b.time);
                } else if (sort === 'slowest') {
                    solves.sort((a, b) => b.time - a.time);
                }
            }
            historyElement.innerHTML = solves
                .map(solve => `
                    <div class="solve-entry ${solve.isPersonalBest ? 'bg-yellow-100' : ''}">
                        <span>${solve.time.toFixed(2)}s</span>
                        <span>${solve.scramble}</span>
                        <span>${new Date(solve.date).toLocaleDateString()}</span>
                        <button class="delete-solve" data-id="${solve.id}">×</button>
                    </div>
                `)
                .join('');

            // Add delete event listeners
            historyElement.querySelectorAll('.delete-solve').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    this.deleteSolve(id);
                });
            });
        }
    }

    deleteSolve(id) {
        this.solves = this.solves.filter(solve => solve.id !== id);
        this.saveSolves();
        this.renderStats();
        this.renderHistory();
    }

    calculateStats() {
        const sortedSolves = [...this.solves].sort((a, b) => a.time - b.time);
        const personalBest = sortedSolves[0]?.time || 0;
        const last5 = sortedSolves.slice(-5);
        const last10 = sortedSolves.slice(-10);

        return {
            personalBest,
            averageOf5: this.calculateAverage(last5),
            averageOf10: this.calculateAverage(last10),
            totalSolves: this.solves.length
        };
    }

    calculateAverage(solves) {
        if (solves.length === 0) return 0;
        const sum = solves.reduce((acc, solve) => acc + solve.time, 0);
        return sum / solves.length;
    }

    setupEventListeners() {
        // New scramble button
        const newScrambleBtn = document.getElementById('newScramble');
        if (newScrambleBtn) {
            newScrambleBtn.addEventListener('click', () => this.generateNewScramble());
        }

        // Timer controls
        const timerBtn = document.getElementById('timerBtn');
        if (timerBtn) {
            timerBtn.addEventListener('click', () => this.toggleTimer());
        }

        // History sort dropdown
        const sortSelect = document.getElementById('historySort');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.renderHistory());
        }

        // Delete all data button
        const deleteAllBtn = document.getElementById('deleteAllBtn');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to delete ALL your solve data? This cannot be undone.')) return;
                if (window.auth && window.auth.currentUser) {
                    // Delete all solves from Firestore
                    const user = window.auth.currentUser;
                    const solvesRef = window.db.collection('users').doc(user.uid).collection('solves');
                    const snapshot = await solvesRef.get();
                    const batch = window.db.batch();
                    snapshot.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                } else {
                    // Delete from localStorage
                    localStorage.removeItem('solves');
                }
                this.solves = [];
                this.renderStats();
                this.renderHistory();
                alert('All solve data deleted.');
            });
        }

        // Keyboard spacebar for timer
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.timerRunning) {
                e.preventDefault();
                this.toggleTimer();
            }
        });
    }

    generateNewScramble() {
        this.currentScramble = window.generateScramble();
        console.log('Generated scramble:', this.currentScramble);
        // Reset cube state to solved
        this.cubeState = this.initializeCubeState();
        // Apply the scramble to the cube state, move by move
        this.currentScramble.split(' ').forEach(move => {
            console.log('Applying move:', move);
            this.applyMove(move);
        });
        // Debug: log the cube state after scramble
        console.log('Cube state after scramble (in generateNewScramble):', JSON.parse(JSON.stringify(this.cubeState)));
        this.renderScramble();
        // Force a re-render and log state
        this.renderCube();
        console.log('Cube state right before forced renderCube:', JSON.parse(JSON.stringify(this.cubeState)));
    }

    toggleTimer() {
        if (!this.timerRunning) {
            this.startTimer();
        } else {
            this.stopTimer();
        }
        this.renderTimer();
    }

    startTimer() {
        this.timerRunning = true;
        this.startTime = Date.now();
        this.timerInterval = window.setInterval(() => {
            const currentTime = (Date.now() - this.startTime) / 1000;
            const timerElement = document.getElementById('timerDisplay');
            if (timerElement) {
                timerElement.textContent = currentTime.toFixed(2);
            }
        }, 10);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerRunning = false;
        const solveTime = (Date.now() - this.startTime) / 1000;
        this.addSolve(solveTime);
    }

    calculateAo5(solves) {
        if (solves.length < 5) return null;
        const last5 = solves.slice(-5);
        const times = last5.map(s => s.time);
        const max = Math.max(...times);
        const min = Math.min(...times);
        const sum = times.reduce((a, b) => a + b, 0) - max - min;
        return sum / 3;
    }

    calculateAo12(solves) {
        if (solves.length < 12) return null;
        const last12 = solves.slice(-12);
        const times = last12.map(s => s.time);
        const max = Math.max(...times);
        const min = Math.min(...times);
        const sum = times.reduce((a, b) => a + b, 0) - max - min;
        return sum / 10;
    }

    updateStats() {
        // All solves
        const solves = this.solves;
        const totalSolves = solves.length;
        const allTimeBest = totalSolves > 0 ? Math.min(...solves.map(s => s.time)) : null;
        const last5 = solves.slice(-5);
        const last10 = solves.slice(-10);
        const averageOf5 = last5.length === 5 ? (last5.reduce((sum, s) => sum + s.time, 0) / 5) : null;
        const averageOf10 = last10.length === 10 ? (last10.reduce((sum, s) => sum + s.time, 0) / 10) : null;
        const allTimeAverage = totalSolves > 0 ? (solves.reduce((sum, s) => sum + s.time, 0) / totalSolves) : null;

        document.getElementById('totalSolves').textContent = totalSolves;
        document.getElementById('allTimeBest').textContent = allTimeBest !== null ? allTimeBest.toFixed(2) + 's' : '-';
        document.getElementById('averageOf5').textContent = averageOf5 !== null ? averageOf5.toFixed(2) + 's' : '-';
        document.getElementById('averageOf10').textContent = averageOf10 !== null ? averageOf10.toFixed(2) + 's' : '-';
        document.getElementById('allTimeAverage').textContent = allTimeAverage !== null ? allTimeAverage.toFixed(2) + 's' : '-';
    }

    async addSolve(time) {
        const solve = {
            id: Date.now().toString(),
            time,
            scramble: this.currentScramble,
            date: Date.now(),
            isPersonalBest: this.solves.length === 0 || time < Math.min(...this.solves.map(s => s.time))
        };
        this.solves.push(solve);
        this.sessionSolves.push(solve);
        this.saveSolves();
        if (window.auth && window.auth.currentUser) {
            await saveSolveToFirestore(solve);
        }
        this.updateStats();
        this.renderHistory();
        this.generateNewScramble();
    }
}

// Initialize the app and expose as window.appState
window.appState = new AppState(); 