// Minesweeper Game Logic
let minesweeperState = {
    board: [],
    revealed: [],
    flagged: [],
    gameActive: false,
    gameWon: false,
    gameLost: false,
    mineCount: 0,
    rows: 0,
    cols: 0,
    difficulty: 'easy',
    otterMode: false,
    startTime: 0,
    time: 0,
    timerInterval: null
};

const minesweeperSizes = {
    easy: { rows: 8, cols: 8, mines: 10, label: 'Easy (8x8 - 10 mines)' },
    medium: { rows: 12, cols: 12, mines: 30, label: 'Medium (12x12 - 30 mines)' },
    hard: { rows: 16, cols: 16, mines: 99, label: 'Hard (16x16 - 99 mines)' }
};

function initMinesweeper(difficulty) {
    const size = minesweeperSizes[difficulty];
    minesweeperState.rows = size.rows;
    minesweeperState.cols = size.cols;
    minesweeperState.mineCount = size.mines;
    
    // Initialize empty board
    minesweeperState.board = Array(minesweeperState.rows).fill(null).map(() => 
        Array(minesweeperState.cols).fill(0)
    );
    minesweeperState.revealed = Array(minesweeperState.rows).fill(null).map(() => 
        Array(minesweeperState.cols).fill(false)
    );
    minesweeperState.flagged = Array(minesweeperState.rows).fill(null).map(() => 
        Array(minesweeperState.cols).fill(false)
    );
    
    minesweeperState.gameActive = true;
    minesweeperState.difficulty = difficulty;
    minesweeperState.otterMode = Boolean(document.getElementById('minesweeper-otter-mode-toggle')?.checked);
    minesweeperState.gameWon = false;
    minesweeperState.gameLost = false;
    minesweeperState.startTime = Date.now();
    minesweeperState.time = 0;
    updateMinesweeperTitles();
    
    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < minesweeperState.mineCount) {
        const row = Math.floor(Math.random() * minesweeperState.rows);
        const col = Math.floor(Math.random() * minesweeperState.cols);
        
        if (minesweeperState.board[row][col] !== 'M') {
            minesweeperState.board[row][col] = 'M';
            minesPlaced++;
        }
    }
    
    // Calculate numbers
    for (let r = 0; r < minesweeperState.rows; r++) {
        for (let c = 0; c < minesweeperState.cols; c++) {
            if (minesweeperState.board[r][c] === 'M') continue;
            
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < minesweeperState.rows && 
                        nc >= 0 && nc < minesweeperState.cols && 
                        minesweeperState.board[nr][nc] === 'M') {
                        count++;
                    }
                }
            }
            minesweeperState.board[r][c] = count;
        }
    }
    
    renderMinesweeperBoard();
    startMinesweeperTimer();
    renderMinesweeperLeaderboard();
}

function startMinesweeperTimer() {
    if (minesweeperState.timerInterval) clearInterval(minesweeperState.timerInterval);
    
    minesweeperState.timerInterval = setInterval(() => {
        if (minesweeperState.gameActive) {
            minesweeperState.time = Math.floor((Date.now() - minesweeperState.startTime) / 1000);
            updateMinesweeperTimer();
        }
    }, 100);
}

function updateMinesweeperTimer() {
    const timerEl = document.getElementById('minesweeper-timer');
    if (timerEl) {
        const mins = Math.floor(minesweeperState.time / 60);
        const secs = minesweeperState.time % 60;
        timerEl.textContent = `⏱️ ${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

function renderMinesweeperBoard() {
    const boardEl = document.getElementById('minesweeper-board');
    if (!boardEl) return;
    
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${minesweeperState.cols}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${minesweeperState.rows}, 1fr)`;
    
    for (let r = 0; r < minesweeperState.rows; r++) {
        for (let c = 0; c < minesweeperState.cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'minesweeper-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            const isDev = localStorage.getItem('devMode') === 'true';
            if (minesweeperState.revealed[r][c]) {
                cell.classList.add('revealed');
                if (minesweeperState.board[r][c] === 'M') {
                    cell.classList.add('mine');
                    cell.textContent = minesweeperState.otterMode ? '🦦' : '💣';
                } else if (minesweeperState.board[r][c] > 0) {
                    cell.textContent = minesweeperState.board[r][c];
                    cell.classList.add(`num-${minesweeperState.board[r][c]}`);
                }
            } else if (minesweeperState.flagged[r][c]) {
                cell.classList.add('flagged');
                cell.textContent = '🚩';
            } else if (isDev && minesweeperState.board[r][c] === 'M') {
                cell.innerHTML = `<span style="opacity: 0.35;">${minesweeperState.otterMode ? '🦦' : '💣'}</span>`;
            }
            
            cell.addEventListener('click', () => revealCell(r, c));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                flagCell(r, c);
            });
            
            boardEl.appendChild(cell);
        }
    }
    
    updateMineCount();
}

function updateMineCount() {
    const flagCount = minesweeperState.flagged.flat().filter(f => f).length;
    const mineCountEl = document.getElementById('minesweeper-mine-count');
    if (mineCountEl) {
        const icon = minesweeperState.otterMode ? '🦦' : '💣';
        mineCountEl.textContent = `${icon} ${Math.max(0, minesweeperState.mineCount - flagCount)}`;
    }
}

function revealCell(row, col) {
    if (!minesweeperState.gameActive || minesweeperState.revealed[row][col] || minesweeperState.flagged[row][col]) {
        return;
    }
    
    minesweeperState.revealed[row][col] = true;
    
    if (minesweeperState.board[row][col] === 'M') {
        minesweeperState.gameLost = true;
        minesweeperState.gameActive = false;
        revealAllMines();
        endMinesweeperGame(false);
    } else if (minesweeperState.board[row][col] === 0) {
        // Flood fill
        revealAdjacentCells(row, col);
    }
    
    renderMinesweeperBoard();
    checkMinesweeperWin();
}

function revealAdjacentCells(row, col) {
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = row + dr;
            const nc = col + dc;
            
            if (nr >= 0 && nr < minesweeperState.rows && 
                nc >= 0 && nc < minesweeperState.cols && 
                !minesweeperState.revealed[nr][nc]) {
                
                minesweeperState.revealed[nr][nc] = true;
                
                if (minesweeperState.board[nr][nc] === 0) {
                    revealAdjacentCells(nr, nc);
                }
            }
        }
    }
}

function flagCell(row, col) {
    if (!minesweeperState.gameActive || minesweeperState.revealed[row][col]) {
        return;
    }
    
    minesweeperState.flagged[row][col] = !minesweeperState.flagged[row][col];
    renderMinesweeperBoard();
}

function revealAllMines() {
    for (let r = 0; r < minesweeperState.rows; r++) {
        for (let c = 0; c < minesweeperState.cols; c++) {
            if (minesweeperState.board[r][c] === 'M') {
                minesweeperState.revealed[r][c] = true;
            }
        }
    }
}

function updateMinesweeperTitles() {
    const modeName = minesweeperState.otterMode ? 'Ottersweeper' : 'Minesweeper';
    const sizeTitle = document.getElementById('minesweeper-size-title');
    const gameTitle = document.getElementById('minesweeper-game-title');
    if (sizeTitle) sizeTitle.textContent = modeName;
    if (gameTitle) gameTitle.textContent = modeName;
}

function checkMinesweeperWin() {
    let revealedCount = 0;
    let totalNonMines = minesweeperState.rows * minesweeperState.cols - minesweeperState.mineCount;
    
    for (let r = 0; r < minesweeperState.rows; r++) {
        for (let c = 0; c < minesweeperState.cols; c++) {
            if (minesweeperState.board[r][c] !== 'M' && minesweeperState.revealed[r][c]) {
                revealedCount++;
            }
        }
    }
    
    if (revealedCount === totalNonMines) {
        minesweeperState.gameWon = true;
        minesweeperState.gameActive = false;
        endMinesweeperGame(true);
    }
}

function endMinesweeperGame(won) {
    if (minesweeperState.timerInterval) clearInterval(minesweeperState.timerInterval);
    
    if (won) {
        recordMinesweeperLeaderboardEntry();
        renderMinesweeperLeaderboard();
        if (typeof unlockAchievement === 'function') {
            unlockAchievement('minesweeper');
        }
    }

    const resultEl = document.getElementById('minesweeper-result');
    if (resultEl) {
        if (won) {
            resultEl.innerHTML = `<h2>🎉 You Won!</h2><p>Time: ${formatTime(minesweeperState.time)}</p>`;
            resultEl.style.color = 'var(--correct)';
        } else {
            resultEl.innerHTML = `<h2>💥 Game Over!</h2><p>You hit a mine!</p>`;
            resultEl.style.color = 'var(--incorrect)';
        }
        resultEl.style.display = 'block';
    }
}

function recordMinesweeperLeaderboardEntry() {
    const entries = loadMinesweeperLeaderboard();
    const entry = {
        difficulty: minesweeperState.difficulty,
        time: minesweeperState.time,
        date: new Date().toLocaleString()
    };
    entries.push(entry);
    entries.sort((a, b) => a.time - b.time);
    localStorage.setItem('minesweeperLeaderboard', JSON.stringify(entries.slice(0, 20)));
}

function loadMinesweeperLeaderboard() {
    const stored = localStorage.getItem('minesweeperLeaderboard');
    if (!stored) return [];
    try {
        return JSON.parse(stored) || [];
    } catch {
        return [];
    }
}

function renderMinesweeperLeaderboard() {
    const listEl = document.getElementById('minesweeper-leaderboard-list');
    const prEl = document.getElementById('minesweeper-pr');
    if (!listEl || !prEl) return;

    const entries = loadMinesweeperLeaderboard();
    const best = entries.length > 0 ? entries[0] : null;
    prEl.textContent = best ? `PR: ${formatTime(best.time)} (${best.difficulty})` : 'PR: -';

    if (entries.length === 0) {
        listEl.innerHTML = '<div class="leaderboard-empty">No Minesweeper rounds played yet.</div>';
        return;
    }

    listEl.innerHTML = entries.map((entry, index) => `
        <div class="leaderboard-row ${index === 0 ? 'leaderboard-top' : ''}">
            <div>#${index + 1}</div>
            <div>${entry.difficulty}</div>
            <div>${formatTime(entry.time)}</div>
            <div>${entry.date}</div>
        </div>
    `).join('');
}

const minesweeperClearLeaderboardBtn = document.getElementById('minesweeper-clear-leaderboard-btn');
if (minesweeperClearLeaderboardBtn) {
    minesweeperClearLeaderboardBtn.addEventListener('click', () => {
        localStorage.removeItem('minesweeperLeaderboard');
        renderMinesweeperLeaderboard();
    });
}

const minesweeperOtterModeToggle = document.getElementById('minesweeper-otter-mode-toggle');
if (minesweeperOtterModeToggle) {
    minesweeperOtterModeToggle.addEventListener('change', () => {
        const modeName = minesweeperOtterModeToggle.checked ? 'Ottersweeper' : 'Minesweeper';
        const sizeTitle = document.getElementById('minesweeper-size-title');
        const gameTitle = document.getElementById('minesweeper-game-title');
        if (sizeTitle) sizeTitle.textContent = modeName;
        if (gameTitle) gameTitle.textContent = modeName;
    });
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function resetMinesweeper() {
    if (minesweeperState.timerInterval) clearInterval(minesweeperState.timerInterval);
    const resultEl = document.getElementById('minesweeper-result');
    if (resultEl) resultEl.style.display = 'none';
}
