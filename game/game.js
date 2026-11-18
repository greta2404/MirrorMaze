
/* ==========================================
   MIRROR MAZE - SHARED GAME ENGINE

   Controls every level using levels.js.
   All levels use the same level.html file.
========================================== */


/* ==========================================
   LOAD CURRENT LEVEL
========================================== */

const params = new URLSearchParams(window.location.search);

const levelNumber = Number(params.get("level") || 1);

const level = LEVELS[levelNumber];

if (!level) {
    throw new Error(
        `Level ${levelNumber} is not defined in levels.js`
    );
}

const {
    size,
    rowClues,
    columnClues,
    lasers,
    solution
} = level;

// Blocked squares are optional for each level.
const blocked = level.blocked || [];

function isBlocked(row, col) {
    return blocked.some(square =>
        square.row === row &&
        square.col === col
    );
}


/* ==========================================
   GAME STATE
========================================== */

let lives = 3;
let hintsRemaining = 1;

let mirrors = {};
let lockedMirrors = new Set();

let visiblePaths = [];

let isFiring = false;
let gameFinished = false;


/* ==========================================
   HTML ELEMENTS
========================================== */

const board = document.getElementById("game-board");
const message = document.getElementById("message");

const livesDisplay = document.getElementById("lives");

const fireButton = document.getElementById("fire-button");
const hintButton = document.getElementById("hint-button");

const resultScreen = document.getElementById("result-screen");
const resultTitle = document.getElementById("result-title");
const resultText = document.getElementById("result-text");
const retryButton = document.getElementById("retry-button");

const fireworks = document.getElementById("fireworks");


/* ==========================================
   UPDATE LEVEL TITLE
========================================== */

document.getElementById("level-title").textContent =
    `Level ${levelNumber}`;

document.title = `Mirror Maze - Level ${levelNumber}`;


/* ==========================================
   HELPER FUNCTIONS
========================================== */

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function keyFor(row, col) {
    return `${row},${col}`;
}

function findSource(row, col) {
    return lasers.find(laser =>
        laser.source.row === row &&
        laser.source.col === col
    );
}

function findTarget(row, col) {
    return lasers.find(laser =>
        laser.target.row === row &&
        laser.target.col === col
    );
}

function isReserved(row, col) {
    return Boolean(
        findSource(row, col) ||
        findTarget(row, col) ||
        isBlocked(row, col)
    );
}


/* ==========================================
   UPDATE LIVES
========================================== */

function updateLives() {
    livesDisplay.textContent =
        "Lives: " + "❤️ ".repeat(lives);
}


/* ==========================================
   UPDATE HINT BUTTON
========================================== */

function updateHintButton() {
    hintButton.textContent =
        hintsRemaining > 0
            ? "USE HINT (1)"
            : "HINT USED (0)";

    hintButton.disabled =
        hintsRemaining === 0 ||
        isFiring ||
        gameFinished;
}


/* ==========================================
   CREATE COLORED CRYSTALS
========================================== */

function createCrystal(color, active) {
    const crystal = document.createElement("div");

    crystal.className = "crystal";

    if (color === "blue") {
        crystal.classList.add("blue-crystal");
    }

    if (active) {
        crystal.classList.add("crystal-active");
    }

    crystal.innerHTML = `
        <svg viewBox="0 0 100 110"
             xmlns="http://www.w3.org/2000/svg"
             aria-hidden="true">

            <path class="gem-outline"
                  d="M50 4 L91 37 L82 75
                     L50 106 L18 75 L9 37 Z"/>

            <path class="gem-top-left"
                  d="M50 4 L50 30 L9 37 Z"/>

            <path class="gem-top-right"
                  d="M50 4 L91 37 L50 30 Z"/>

            <path class="gem-center"
                  d="M9 37 L50 30 L91 37 L50 61 Z"/>

            <path class="gem-left"
                  d="M9 37 L50 61 L50 106 L18 75 Z"/>

            <path class="gem-right"
                  d="M91 37 L82 75 L50 106 L50 61 Z"/>

            <path class="gem-lines"
                  d="M50 4 L50 30
                     M9 37 L50 61 L91 37
                     M50 61 L50 106"/>

        </svg>
    `;

    return crystal;
}


/* ==========================================
   CREATE GAME BOARD
========================================== */

function createBoard() {
    board.innerHTML = "";

    board.style.gridTemplateColumns =
        `var(--clue-size) repeat(${size}, minmax(0, 1fr))`;

    // Empty top-left corner
    const corner = document.createElement("div");
    board.appendChild(corner);

    // Column clues
    for (let col = 0; col < size; col++) {
        const clue = document.createElement("div");

        clue.className = "clue";
        clue.textContent = columnClues[col];

        board.appendChild(clue);
    }

    // Create rows
    for (let row = 0; row < size; row++) {
        const rowClue = document.createElement("div");

        rowClue.className = "clue";
        rowClue.textContent = rowClues[row];

        board.appendChild(rowClue);

        // Create cells
        for (let col = 0; col < size; col++) {
            const cell = document.createElement("div");
            const key = keyFor(row, col);

            cell.className = "cell";

            const source = findSource(row, col);
            const target = findTarget(row, col);

            // Blocked square - no X displayed
            if (isBlocked(row, col)) {
                cell.classList.add("blocked");

            // Laser source
            } else if (source) {
                cell.classList.add(
                    "source",
                    `${source.name}-source`
                );

                cell.textContent = "●";

            // Target crystal
            } else if (target) {
                cell.classList.add(
                    "target",
                    `${target.name}-target`
                );

                const active = visiblePaths.some(item =>
                    item.name === target.name &&
                    item.path.some(point =>
                        point.row === row &&
                        point.col === col
                    )
                );

                cell.appendChild(
                    createCrystal(target.name, active)
                );

            // Mirror
            } else if (mirrors[key]) {
                cell.classList.add("mirror");

                if (mirrors[key] === "/") {
                    cell.classList.add("mirror-forward");
                } else {
                    cell.classList.add("mirror-backward");
                }

                if (lockedMirrors.has(key)) {
                    cell.classList.add("hinted-mirror");
                }
            }

            // Interactive squares
            if (!isReserved(row, col)) {
                cell.setAttribute("role", "button");
                cell.tabIndex = 0;

                const mirrorName =
                    mirrors[key] === "/"
                        ? "forward slash"
                        : mirrors[key] === "\\"
                            ? "backslash"
                            : "empty";

                cell.setAttribute(
                    "aria-label",
                    `Row ${row + 1}, column ${col + 1}, ${mirrorName}` +
                    (lockedMirrors.has(key)
                        ? ", locked hint"
                        : "")
                );

                cell.addEventListener("click", () => {
                    placeMirror(row, col);
                });

                cell.addEventListener("keydown", event => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        placeMirror(row, col);
                    }
                });
            }

            board.appendChild(cell);
        }
    }

    drawLasers();
}


/* ==========================================
   PLACE AND ROTATE MIRRORS
========================================== */

function placeMirror(row, col) {
    if (
        isFiring ||
        gameFinished ||
        lives === 0 ||
        isReserved(row, col)
    ) {
        return;
    }

    const key = keyFor(row, col);

    if (lockedMirrors.has(key)) {
        message.textContent =
            "This mirror was revealed by your hint!";
        return;
    }

    // Cycle: empty -> / -> \ -> empty
    if (!mirrors[key]) {
        mirrors[key] = "/";

    } else if (mirrors[key] === "/") {
        mirrors[key] = "\\";

    } else {
        delete mirrors[key];
    }

    visiblePaths = [];

    message.textContent =
        "Press FIRE LASERS to test your mirrors!";

    createBoard();
}


/* ==========================================
   HINT SYSTEM
========================================== */

function useHint() {
    if (
        hintsRemaining === 0 ||
        isFiring ||
        gameFinished
    ) {
        return;
    }

    const availableHints = solution.filter(item => {
        const key = keyFor(item.row, item.col);

        return mirrors[key] !== item.angle;
    });

    if (availableHints.length === 0) {
        message.textContent =
            "Your solution mirrors are already correct! Try firing!";
        return;
    }

    const chosen = availableHints[
        Math.floor(Math.random() * availableHints.length)
    ];

    const key = keyFor(chosen.row, chosen.col);

    mirrors[key] = chosen.angle;
    lockedMirrors.add(key);

    hintsRemaining--;
    visiblePaths = [];

    createBoard();
    updateHintButton();

    const cells = board.querySelectorAll(".cell");
    const index = chosen.row * size + chosen.col;

    const hintedCell = cells[index];

    if (hintedCell) {
        hintedCell.classList.add("hint-reveal");
    }

    message.textContent =
        `Hint revealed! Row ${chosen.row + 1}, ` +
        `Column ${chosen.col + 1}: ${chosen.angle}`;
}


/* ==========================================
   CHECK ROW AND COLUMN CLUES
========================================== */

function checkClues() {
    // Check rows
    for (let row = 0; row < size; row++) {
        let count = 0;

        for (let col = 0; col < size; col++) {
            if (mirrors[keyFor(row, col)]) {
                count++;
            }
        }

        if (count !== rowClues[row]) {
            return false;
        }
    }

    // Check columns
    for (let col = 0; col < size; col++) {
        let count = 0;

        for (let row = 0; row < size; row++) {
            if (mirrors[keyFor(row, col)]) {
                count++;
            }
        }

        if (count !== columnClues[col]) {
            return false;
        }
    }

    return true;
}


/* ==========================================
   TRACE A LASER
========================================== */

function traceLaser(laser) {
    let row = laser.source.row;
    let col = laser.source.col;

    let dr = laser.direction.dr;
    let dc = laser.direction.dc;

    const path = [];
    const visited = new Set();

    while (
        row >= 0 &&
        row < size &&
        col >= 0 &&
        col < size
    ) {
        const state = `${row},${col},${dr},${dc}`;

        // Prevent infinite loops
        if (visited.has(state)) {
            break;
        }

        visited.add(state);
        path.push({ row, col });

        // Stop if already on a blocked square
        if (isBlocked(row, col)) {
            return {
                success: false,
                path: path.slice(0, -1),
                blockedCollision: true
            };
        }

        // Check if a crystal is reached
        const target = findTarget(row, col);

        if (target) {
            return {
                success: target.name === laser.name,
                path,
                blockedCollision: false
            };
        }

        // Check for mirrors
        const mirror = mirrors[keyFor(row, col)];

        if (mirror === "/") {
            const newDr = -dc;
            const newDc = -dr;

            dr = newDr;
            dc = newDc;

        } else if (mirror === "\\") {
            const newDr = dc;
            const newDc = dr;

            dr = newDr;
            dc = newDc;
        }

        const nextRow = row + dr;
        const nextCol = col + dc;

        // Stop BEFORE entering a blocked square
        if (isBlocked(nextRow, nextCol)) {
            return {
                success: false,
                path,
                blockedCollision: true
            };
        }

        row = nextRow;
        col = nextCol;
    }

    return {
        success: false,
        path,
        blockedCollision: false
    };
}


/* ==========================================
   DRAW COLORED LASERS
========================================== */

function drawLasers() {
    const cells = board.querySelectorAll(".cell");

    for (const item of visiblePaths) {
        const path = item.path;

        // Draw laser segments between cells
        for (let i = 0; i < path.length - 1; i++) {
            const current = path[i];
            const next = path[i + 1];

            const currentCell =
                cells[current.row * size + current.col];

            const nextCell =
                cells[next.row * size + next.col];

            const dr = next.row - current.row;
            const dc = next.col - current.col;

            addBeam(currentCell, dr, dc, item.color);
            addBeam(nextCell, -dr, -dc, item.color);
        }

        // Draw final beam to the edge of a blocked square
        // only when the complete path has been animated.
        if (item.blockedCollision && item.pathComplete) {
            const last = path[path.length - 1];

            if (!last) {
                continue;
            }

            const laser = lasers.find(l =>
                l.name === item.name
            );

            if (!laser) {
                continue;
            }

            let dr = laser.direction.dr;
            let dc = laser.direction.dc;

            // Calculate final laser direction
            for (const point of path) {
                const mirror =
                    mirrors[keyFor(point.row, point.col)];

                if (mirror === "/") {
                    const newDr = -dc;
                    const newDc = -dr;

                    dr = newDr;
                    dc = newDc;

                } else if (mirror === "\\") {
                    const newDr = dc;
                    const newDc = dr;

                    dr = newDr;
                    dc = newDc;
                }
            }

            // Draw only inside the last valid cell
            if (isBlocked(last.row + dr, last.col + dc)) {
                const cell =
                    cells[last.row * size + last.col];

                addBeam(cell, dr, dc, item.color);
            }
        }
    }
}


/* ==========================================
   CREATE LASER SEGMENTS
========================================== */

function addBeam(cell, dr, dc, color) {
    const beam = document.createElement("div");

    beam.className = "laser-beam";

    beam.style.background = color;

    beam.style.boxShadow =
        `0 0 6px ${color}, 0 0 12px ${color}`;

    if (dr !== 0) {
        // Vertical laser
        beam.style.width = "4px";
        beam.style.height = "50%";
        beam.style.left = "calc(50% - 2px)";
        beam.style.top = dr < 0 ? "0" : "50%";

    } else {
        // Horizontal laser
        beam.style.height = "4px";
        beam.style.width = "50%";
        beam.style.top = "calc(50% - 2px)";
        beam.style.left = dc < 0 ? "0" : "50%";
    }

    cell.appendChild(beam);
}


/* ==========================================
   FIRE ALL LASERS
========================================== */

async function fireLasers() {
    if (
        isFiring ||
        gameFinished ||
        lives === 0
    ) {
        return;
    }

    isFiring = true;

    fireButton.disabled = true;
    updateHintButton();

    visiblePaths = [];
    createBoard();

    message.textContent =
        lasers.length > 1
            ? "Firing lasers..."
            : "Firing laser...";

    // Trace all lasers
    const results = lasers.map(laser => ({
        ...laser,
        ...traceLaser(laser)
    }));

    const longestPath = Math.max(
        ...results.map(result => result.path.length)
    );

    // Animate all lasers simultaneously
    for (let step = 1; step <= longestPath; step++) {
        visiblePaths = results.map(result => ({
            name: result.name,
            color: result.color,
            path: result.path.slice(0, step),

            // Draw collision only at the final step
            blockedCollision: result.blockedCollision,
            pathComplete: step >= result.path.length
        }));

        createBoard();

        await wait(75);
    }

    // All lasers must reach matching crystals
    // and all clues must be satisfied
    const success =
        results.every(result => result.success) &&
        checkClues();

    if (success) {
        message.textContent = "Level Complete!";

        await wait(500);

        isFiring = false;
        gameFinished = true;

        showResult(true);
        updateHintButton();

        return;
    }

    // Incorrect solution
    message.textContent = "Wrong path!";

    board.classList.add("laser-shake");

    await wait(600);

    board.classList.remove("laser-shake");

    message.textContent = "Lasers retracting...";

    // Retract lasers
    for (
        let step = longestPath - 1;
        step >= 0;
        step--
    ) {
        visiblePaths = results.map(result => ({
            name: result.name,
            color: result.color,
            path: result.path.slice(0, step),

            blockedCollision: result.blockedCollision,
            pathComplete: step >= result.path.length
        }));

        createBoard();

        await wait(35);
    }

    // Lose one life
    lives--;

    updateLives();

    if (lives === 0) {
        message.textContent = "Game Over!";

        await wait(400);

        gameFinished = true;
        showResult(false);

    } else {
        message.textContent =
            "Try again! Adjust your mirrors.";

        fireButton.disabled = false;
    }

    isFiring = false;
    updateHintButton();
}


/* ==========================================
   WIN / GAME OVER SCREEN
========================================== */

function showResult(won) {
    resultScreen.classList.remove("hidden");

    if (won) {
        resultTitle.textContent = "YOU WIN!";
        resultTitle.className = "win-title";

        resultText.textContent =
            `Congratulations! Level ${levelNumber} complete!`;

        if (LEVELS[levelNumber + 1]) {
            retryButton.textContent = "NEXT LEVEL";
        } else {
            retryButton.textContent = "PLAY AGAIN";
        }

        createFireworks();

    } else {
        resultTitle.textContent = "GAME OVER";
        resultTitle.className = "lose-title";

        resultText.textContent =
            "You ran out of lives!";

        retryButton.textContent = "TRY AGAIN";
    }

    retryButton.focus();
}


/* ==========================================
   FIREWORKS
========================================== */

function createFireworks() {
    fireworks.innerHTML = "";

    const colors = [
        "#ff3434",
        "#32ff65",
        "#38bdf8",
        "#facc15",
        "#BF00FF",
        "#ff66cc"
    ];

    for (let burst = 0; burst < 12; burst++) {
        const centerX = 10 + Math.random() * 80;
        const centerY = 10 + Math.random() * 80;

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement("div");

            particle.className = "firework";

            const angle = (Math.PI * 2 * i) / 30;
            const distance = 50 + Math.random() * 110;

            particle.style.left = centerX + "%";
            particle.style.top = centerY + "%";

            particle.style.setProperty(
                "--x",
                Math.cos(angle) * distance + "px"
            );

            particle.style.setProperty(
                "--y",
                Math.sin(angle) * distance + "px"
            );

            particle.style.setProperty(
                "--color",
                colors[Math.floor(Math.random() * colors.length)]
            );

            particle.style.setProperty(
                "--delay",
                burst * 0.2 + "s"
            );

            fireworks.appendChild(particle);
        }
    }
}


/* ==========================================
   RESTART GAME
========================================== */

function restartGame() {
    lives = 3;
    hintsRemaining = 1;

    mirrors = {};
    lockedMirrors = new Set();

    visiblePaths = [];

    isFiring = false;
    gameFinished = false;

    board.classList.remove("laser-shake");
    resultScreen.classList.add("hidden");

    fireworks.innerHTML = "";

    fireButton.disabled = false;

    message.textContent =
        lasers.length > 1
            ? "Connect both lasers to their matching crystals!"
            : "Place your mirrors to begin!";

    updateLives();
    updateHintButton();
    createBoard();
}


/* ==========================================
   BUTTON EVENTS
========================================== */

fireButton.addEventListener("click", fireLasers);

hintButton.addEventListener("click", useHint);

retryButton.addEventListener("click", () => {
    if (
        gameFinished &&
        resultTitle.textContent === "YOU WIN!" &&
        LEVELS[levelNumber + 1]
    ) {
        window.location.href =
            `level.html?level=${levelNumber + 1}`;

    } else {
        restartGame();
    }
});


/* ==========================================
   START GAME
========================================== */

restartGame();
