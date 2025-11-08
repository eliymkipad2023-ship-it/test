// ゲーム設定
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = {
    'I': '#00f0f0',
    'O': '#f0f000',
    'T': '#a000f0',
    'S': '#00f000',
    'Z': '#f00000',
    'J': '#0000f0',
    'L': '#f0a000',
    'EMPTY': '#000000',
    'GRID': '#1a1a1a'
};

// テトロミノの形状定義
const SHAPES = {
    'I': [
        [[0, 0, 0, 0],
         [1, 1, 1, 1],
         [0, 0, 0, 0],
         [0, 0, 0, 0]]
    ],
    'O': [
        [[1, 1],
         [1, 1]]
    ],
    'T': [
        [[0, 1, 0],
         [1, 1, 1],
         [0, 0, 0]],
        [[0, 1, 0],
         [0, 1, 1],
         [0, 1, 0]],
        [[0, 0, 0],
         [1, 1, 1],
         [0, 1, 0]],
        [[0, 1, 0],
         [1, 1, 0],
         [0, 1, 0]]
    ],
    'S': [
        [[0, 1, 1],
         [1, 1, 0],
         [0, 0, 0]],
        [[0, 1, 0],
         [0, 1, 1],
         [0, 0, 1]]
    ],
    'Z': [
        [[1, 1, 0],
         [0, 1, 1],
         [0, 0, 0]],
        [[0, 0, 1],
         [0, 1, 1],
         [0, 1, 0]]
    ],
    'J': [
        [[1, 0, 0],
         [1, 1, 1],
         [0, 0, 0]],
        [[0, 1, 1],
         [0, 1, 0],
         [0, 1, 0]],
        [[0, 0, 0],
         [1, 1, 1],
         [0, 0, 1]],
        [[0, 1, 0],
         [0, 1, 0],
         [1, 1, 0]]
    ],
    'L': [
        [[0, 0, 1],
         [1, 1, 1],
         [0, 0, 0]],
        [[0, 1, 0],
         [0, 1, 0],
         [0, 1, 1]],
        [[0, 0, 0],
         [1, 1, 1],
         [1, 0, 0]],
        [[1, 1, 0],
         [0, 1, 0],
         [0, 1, 0]]
    ]
};

// ゲーム状態
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.gameStarted = false;

        this.currentPiece = null;
        this.nextPiece = null;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;

        this.setupEventListeners();
        this.drawBoard();
        this.generateNextPiece();
        this.drawNextPiece();
    }

    createBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('restartBtn').addEventListener('click', () => this.reset());

        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    start() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.currentPiece = this.nextPiece;
            this.generateNextPiece();
            this.drawNextPiece();
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
            requestAnimationFrame((time) => this.update(time));
        }
    }

    togglePause() {
        if (this.gameStarted && !this.gameOver) {
            this.paused = !this.paused;
            document.getElementById('pauseBtn').textContent = this.paused ? '再開' : '一時停止';
            if (!this.paused) {
                requestAnimationFrame((time) => this.update(time));
            }
        }
    }

    reset() {
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.gameStarted = false;
        this.dropCounter = 0;
        this.dropInterval = 1000;

        this.generateNextPiece();
        this.currentPiece = null;

        this.updateScore();
        this.drawBoard();
        this.drawNextPiece();

        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = '一時停止';
    }

    generateNextPiece() {
        const pieces = Object.keys(SHAPES);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        this.nextPiece = {
            type: randomPiece,
            shape: SHAPES[randomPiece][0],
            rotation: 0,
            x: Math.floor(COLS / 2) - Math.floor(SHAPES[randomPiece][0][0].length / 2),
            y: 0
        };
    }

    handleKeyPress(e) {
        if (!this.gameStarted || this.gameOver || this.paused) {
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
            return;
        }

        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.softDrop();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }

    movePiece(dir) {
        this.currentPiece.x += dir;
        if (this.collision()) {
            this.currentPiece.x -= dir;
        }
        this.drawBoard();
    }

    softDrop() {
        this.currentPiece.y++;
        if (this.collision()) {
            this.currentPiece.y--;
            this.mergePiece();
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.generateNextPiece();
            this.drawNextPiece();

            if (this.collision()) {
                this.endGame();
            }
        }
        this.dropCounter = 0;
        this.drawBoard();
    }

    hardDrop() {
        while (!this.collision()) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
        this.mergePiece();
        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.generateNextPiece();
        this.drawNextPiece();

        if (this.collision()) {
            this.endGame();
        }
        this.dropCounter = 0;
        this.drawBoard();
    }

    rotatePiece() {
        const originalRotation = this.currentPiece.rotation;
        const shapes = SHAPES[this.currentPiece.type];
        this.currentPiece.rotation = (this.currentPiece.rotation + 1) % shapes.length;
        this.currentPiece.shape = shapes[this.currentPiece.rotation];

        // ウォールキック: 回転後に壁と衝突する場合、位置を調整
        let offset = 0;
        const maxOffset = 2;
        while (this.collision() && offset <= maxOffset) {
            this.currentPiece.x += offset;
            if (!this.collision()) break;
            this.currentPiece.x -= offset * 2;
            if (!this.collision()) break;
            this.currentPiece.x += offset;
            offset++;
        }

        if (this.collision()) {
            this.currentPiece.rotation = originalRotation;
            this.currentPiece.shape = shapes[originalRotation];
        }

        this.drawBoard();
    }

    collision() {
        const shape = this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = this.currentPiece.x + x;
                    const newY = this.currentPiece.y + y;

                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true;
                    }

                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    mergePiece() {
        const shape = this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.type;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            // スコア計算: 1ライン=100, 2ライン=300, 3ライン=500, 4ライン=800
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;

            // レベルアップ: 10ライン毎
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);

            this.updateScore();
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('pauseBtn').disabled = true;
    }

    update(time = 0) {
        if (this.gameOver || this.paused || !this.gameStarted) {
            return;
        }

        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            this.softDrop();
        }

        this.drawBoard();
        requestAnimationFrame((time) => this.update(time));
    }

    drawBoard() {
        // 背景をクリア
        this.ctx.fillStyle = COLORS.EMPTY;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // グリッドを描画
        this.ctx.strokeStyle = COLORS.GRID;
        this.ctx.lineWidth = 1;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }

        // ボード上の固定されたブロックを描画
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(this.ctx, x, y, COLORS[this.board[y][x]]);
                }
            }
        }

        // 現在のピースを描画
        if (this.currentPiece) {
            this.drawPiece(this.ctx, this.currentPiece);
        }
    }

    drawBlock(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

        // 光沢効果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE / 3);
    }

    drawPiece(ctx, piece) {
        const shape = piece.shape;
        const color = COLORS[piece.type];

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    this.drawBlock(ctx, piece.x + x, piece.y + y, color);
                }
            }
        }
    }

    drawNextPiece() {
        const blockSize = 25;
        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (this.nextPiece) {
            const shape = this.nextPiece.shape;
            const color = COLORS[this.nextPiece.type];
            const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;

            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        this.nextCtx.fillStyle = color;
                        this.nextCtx.fillRect(
                            offsetX + x * blockSize + 1,
                            offsetY + y * blockSize + 1,
                            blockSize - 2,
                            blockSize - 2
                        );

                        // 光沢効果
                        this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        this.nextCtx.fillRect(
                            offsetX + x * blockSize + 2,
                            offsetY + y * blockSize + 2,
                            blockSize - 4,
                            blockSize / 3
                        );
                    }
                }
            }
        }
    }
}

// ゲーム開始
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
