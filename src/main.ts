// Types
interface Solve {
    id: string;
    time: number;
    scramble: string;
    date: Date;
    isPersonalBest: boolean;
}

interface Stats {
    personalBest: number;
    averageOf5: number;
    averageOf10: number;
    totalSolves: number;
}

// State management
class AppState {
    private solves: Solve[] = [];
    private currentScramble: string = '';
    private timerRunning: boolean = false;
    private startTime: number = 0;
    private timerInterval: number | null = null;

    constructor() {
        this.loadSolves();
        this.initializeUI();
    }

    private loadSolves(): void {
        const savedSolves = localStorage.getItem('solves');
        if (savedSolves) {
            this.solves = JSON.parse(savedSolves);
        }
    }

    private saveSolves(): void {
        localStorage.setItem('solves', JSON.stringify(this.solves));
    }

    private initializeUI(): void {
        this.renderScramble();
        this.renderTimer();
        this.renderStats();
        this.renderHistory();
        this.setupEventListeners();
    }

    private renderScramble(): void {
        const scrambleElement = document.getElementById('scramble');
        if (scrambleElement) {
            scrambleElement.textContent = this.currentScramble || 'Generate new scramble';
        }
    }

    private renderTimer(): void {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = '0.00';
        }
    }

    private renderStats(): void {
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

    private renderHistory(): void {
        const historyElement = document.getElementById('history');
        if (historyElement) {
            historyElement.innerHTML = this.solves
                .map(solve => `
                    <div class="solve-entry ${solve.isPersonalBest ? 'bg-yellow-100' : ''}">
                        <span>${solve.time.toFixed(2)}s</span>
                        <span>${solve.scramble}</span>
                        <span>${new Date(solve.date).toLocaleDateString()}</span>
                    </div>
                `)
                .join('');
        }
    }

    private calculateStats(): Stats {
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

    private calculateAverage(solves: Solve[]): number {
        if (solves.length === 0) return 0;
        const sum = solves.reduce((acc, solve) => acc + solve.time, 0);
        return sum / solves.length;
    }

    private setupEventListeners(): void {
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

        // Keyboard spacebar for timer
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.timerRunning) {
                e.preventDefault();
                this.toggleTimer();
            }
        });
    }

    private generateNewScramble(): void {
        // TODO: Implement proper scramble generation
        this.currentScramble = 'R U R\' U\'';
        this.renderScramble();
    }

    private toggleTimer(): void {
        if (!this.timerRunning) {
            this.startTimer();
        } else {
            this.stopTimer();
        }
    }

    private startTimer(): void {
        this.timerRunning = true;
        this.startTime = Date.now();
        this.timerInterval = window.setInterval(() => {
            const currentTime = (Date.now() - this.startTime) / 1000;
            const timerElement = document.getElementById('timer');
            if (timerElement) {
                timerElement.textContent = currentTime.toFixed(2);
            }
        }, 10);
    }

    private stopTimer(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerRunning = false;
        const solveTime = (Date.now() - this.startTime) / 1000;
        this.addSolve(solveTime);
    }

    private addSolve(time: number): void {
        const solve: Solve = {
            id: Date.now().toString(),
            time,
            scramble: this.currentScramble,
            date: new Date(),
            isPersonalBest: this.solves.length === 0 || time < Math.min(...this.solves.map(s => s.time))
        };

        this.solves.push(solve);
        this.saveSolves();
        this.renderStats();
        this.renderHistory();
        this.generateNewScramble();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new AppState();
}); 