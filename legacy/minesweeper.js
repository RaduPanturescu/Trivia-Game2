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
    customSettings: null,
    otterMode: false,
    startTime: 0,
    time: 0,
    timerInterval: null
};

const minesweeperSizes = {
    easy: { rows: 9, cols: 9, mines: 10, label: 'Beginner' },
    medium: { rows: 16, cols: 16, mines: 40, label: 'Intermediate' },
    hard: { rows: 16, cols: 30, mines: 99, label: 'Expert' }
};

let minesweeperFlagMode = false;
const minesweeperFlagModeButton = document.getElementById('minesweeper-flag-mode');

function setMinesweeperFlagMode(enabled) {
    minesweeperFlagMode = enabled;
    if (minesweeperFlagModeButton) {
        minesweeperFlagModeButton.setAttribute('aria-pressed', String(enabled));
        minesweeperFlagModeButton.textContent = `🚩 Flag mode: ${enabled ? 'On' : 'Off'}`;
    }
}

minesweeperFlagModeButton?.addEventListener('click', () => setMinesweeperFlagMode(!minesweeperFlagMode));

function initMinesweeper(difficulty, customSettings = null) {
    const size = difficulty === 'custom' ? customSettings : minesweeperSizes[difficulty];
    const customDimensionsInBounds = difficulty !== 'custom' ||
        (size && size.rows >= 5 && size.rows <= 30 && size.cols >= 5 && size.cols <= 30);
    if (!size || !Number.isInteger(size.rows) || !Number.isInteger(size.cols) || !Number.isInteger(size.mines) ||
        size.rows < 1 || size.cols < 1 || size.mines < 1 || size.mines >= size.rows * size.cols || !customDimensionsInBounds) {
        return false;
    }
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
    setMinesweeperFlagMode(false);
    minesweeperState.difficulty = difficulty;
    minesweeperState.customSettings = difficulty === 'custom' ? { ...size } : null;
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
    return true;
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
    boardEl.style.setProperty('--minesweeper-columns', minesweeperState.cols);
    boardEl.style.setProperty('--minesweeper-rows', minesweeperState.rows);
    
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
            
            cell.addEventListener('click', () => {
                if (minesweeperFlagMode) flagCell(r, c);
                else revealCell(r, c);
            });
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
    const leaderboardTitle = document.getElementById('minesweeper-leaderboard-title');
    if (sizeTitle) sizeTitle.textContent = modeName;
    if (gameTitle) gameTitle.textContent = modeName;
    if (leaderboardTitle) leaderboardTitle.textContent = `${modeName} Leaderboard`;
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
        recordMinesweeperPersonalBest();
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
            resultEl.innerHTML = minesweeperState.otterMode
                ? '<h2>💥 Game Over!</h2><p>An otter got you!</p>'
                : '<h2>💥 Game Over!</h2><p>You hit a mine!</p>';
            resultEl.style.color = 'var(--incorrect)';
        }
        resultEl.style.display = 'block';
    }
}

function recordMinesweeperPersonalBest() {
    if (minesweeperState.difficulty === 'custom') return;
    let bestTimes = {};
    try {
        bestTimes = JSON.parse(localStorage.getItem('minesweeperPersonalBests') || '{}') || {};
    } catch {
        bestTimes = {};
    }
    const previousBest = Number(bestTimes[minesweeperState.difficulty]);
    if (!Number.isFinite(previousBest) || minesweeperState.time < previousBest) {
        bestTimes[minesweeperState.difficulty] = minesweeperState.time;
        localStorage.setItem('minesweeperPersonalBests', JSON.stringify(bestTimes));
    }
}

function recordMinesweeperLeaderboardEntry() {
    const entries = loadMinesweeperLeaderboard();
    const entry = {
        difficulty: minesweeperState.difficulty,
        rows: minesweeperState.rows,
        cols: minesweeperState.cols,
        time: minesweeperState.time,
        date: new Date().toISOString()
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
        const modeName = minesweeperState.otterMode ? 'Ottersweeper' : 'Minesweeper';
        listEl.innerHTML = `<div class="leaderboard-empty">No ${modeName} rounds played yet.</div>`;
        return;
    }

    listEl.innerHTML = entries.map((entry, index) => `
        <div class="leaderboard-row ${index === 0 ? 'leaderboard-top' : ''}">
            <div>#${index + 1}</div>
            <div>${entry.difficulty === 'custom'
                ? `Custom (${entry.cols}×${entry.rows})`
                : minesweeperSizes[entry.difficulty]?.label || entry.difficulty}</div>
            <div>${formatTime(entry.time)}</div>
            <div>${formatLeaderboardDate(entry.date)}</div>
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
        const leaderboardTitle = document.getElementById('minesweeper-leaderboard-title');
        if (sizeTitle) sizeTitle.textContent = modeName;
        if (gameTitle) gameTitle.textContent = modeName;
        if (leaderboardTitle) leaderboardTitle.textContent = `${modeName} Leaderboard`;
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
