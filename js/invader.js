const GAME_CONFIG = {
  canvasWidth: 720,
  canvasHeight: 480,
  playerSpeed: 4,
  bulletSpeed: 6,
  alienRows: 4,
  alienCols: 8,
  alienSpacingX: 70,
  alienSpacingY: 50,
  alienStartX: 60,
  alienStartY: 60,
  alienSpeed: 1,
  alienDrop: 18,
  alienFireChance: 0.003,
  maxEnemyBullets: 3,
};

function createPlayer() {
  return {
    width: 46,
    height: 18,
    x: GAME_CONFIG.canvasWidth / 2 - 23,
    y: GAME_CONFIG.canvasHeight - 40,
    speed: GAME_CONFIG.playerSpeed,
  };
}

function createAlienField(level) {
  const aliens = [];
  for (let row = 0; row < GAME_CONFIG.alienRows; row += 1) {
    for (let col = 0; col < GAME_CONFIG.alienCols; col += 1) {
      aliens.push({
        x: GAME_CONFIG.alienStartX + col * GAME_CONFIG.alienSpacingX,
        y: GAME_CONFIG.alienStartY + row * GAME_CONFIG.alienSpacingY,
        width: 32,
        height: 24,
        alive: true,
      });
    }
  }
  return {
    aliens,
    direction: 1,
    speed: GAME_CONFIG.alienSpeed + level * 0.4,
  };
}

function createBullet(x, y, direction, speed) {
  return {
    x,
    y,
    width: 4,
    height: 12,
    direction,
    speed,
  };
}

function initInvaderGame() {
  const canvas = document.getElementById('invader-canvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const scoreLabel = document.getElementById('score');
  const livesLabel = document.getElementById('lives');
  const levelLabel = document.getElementById('level');
  const startButton = document.getElementById('start-button');
  const pauseButton = document.getElementById('pause-button');
  const restartButton = document.getElementById('restart-button');

  canvas.width = GAME_CONFIG.canvasWidth;
  canvas.height = GAME_CONFIG.canvasHeight;

  let player = createPlayer();
  let bullets = [];
  let enemyBullets = [];
  let field = createAlienField(1);
  let score = 0;
  let lives = 3;
  let level = 1;
  let isRunning = false;
  let isPaused = false;
  let lastTime = 0;
  const pressedKeys = new Set();

  function updateHud() {
    if (scoreLabel) scoreLabel.textContent = score;
    if (livesLabel) livesLabel.textContent = lives;
    if (levelLabel) levelLabel.textContent = level;
  }

  function resetLevel() {
    bullets = [];
    enemyBullets = [];
    field = createAlienField(level);
    player = createPlayer();
  }

  function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    resetLevel();
    updateHud();
  }

  function togglePause() {
    if (!isRunning) return;
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? '再開' : '一時停止';
  }

  function shootPlayerBullet() {
    if (bullets.length >= 3) return;
    bullets.push(createBullet(player.x + player.width / 2 - 2, player.y - 12, -1, GAME_CONFIG.bulletSpeed));
  }

  function shootEnemyBullet(alien) {
    if (enemyBullets.length >= GAME_CONFIG.maxEnemyBullets) return;
    enemyBullets.push(createBullet(alien.x + alien.width / 2 - 2, alien.y + alien.height, 1, GAME_CONFIG.bulletSpeed - 2));
  }

  function handleInput() {
    if (pressedKeys.has('ArrowLeft') || pressedKeys.has('KeyA')) {
      player.x -= player.speed;
    }
    if (pressedKeys.has('ArrowRight') || pressedKeys.has('KeyD')) {
      player.x += player.speed;
    }
    if (pressedKeys.has('Space')) {
      if (!pressedKeys.has('shoot-lock')) {
        shootPlayerBullet();
        pressedKeys.add('shoot-lock');
      }
    } else {
      pressedKeys.delete('shoot-lock');
    }

    player.x = Math.max(12, Math.min(GAME_CONFIG.canvasWidth - player.width - 12, player.x));
  }

  function updateBullets() {
    bullets.forEach((bullet) => {
      bullet.y += bullet.direction * bullet.speed;
    });
    bullets = bullets.filter((bullet) => bullet.y + bullet.height > 0);

    enemyBullets.forEach((bullet) => {
      bullet.y += bullet.direction * bullet.speed;
    });
    enemyBullets = enemyBullets.filter((bullet) => bullet.y < GAME_CONFIG.canvasHeight + 20);
  }

  function updateAliens(delta) {
    const shift = field.speed * field.direction * delta;
    let shouldDrop = false;

    field.aliens.forEach((alien) => {
      if (!alien.alive) return;
      alien.x += shift;
      if (alien.x + alien.width > GAME_CONFIG.canvasWidth - 10 || alien.x < 10) {
        shouldDrop = true;
      }
    });

    if (shouldDrop) {
      field.direction *= -1;
      field.aliens.forEach((alien) => {
        if (!alien.alive) return;
        alien.y += GAME_CONFIG.alienDrop;
      });
    }

    field.aliens.forEach((alien) => {
      if (!alien.alive) return;
      if (Math.random() < GAME_CONFIG.alienFireChance * level) {
        shootEnemyBullet(alien);
      }
    });
  }

  function detectCollisions() {
    bullets.forEach((bullet) => {
      field.aliens.forEach((alien) => {
        if (!alien.alive) return;
        if (
          bullet.x < alien.x + alien.width &&
          bullet.x + bullet.width > alien.x &&
          bullet.y < alien.y + alien.height &&
          bullet.y + bullet.height > alien.y
        ) {
          alien.alive = false;
          bullet.y = -999;
          score += 50;
        }
      });
    });

    enemyBullets.forEach((bullet) => {
      if (
        bullet.x < player.x + player.width &&
        bullet.x + bullet.width > player.x &&
        bullet.y < player.y + player.height &&
        bullet.y + bullet.height > player.y
      ) {
        bullet.y = GAME_CONFIG.canvasHeight + 100;
        lives -= 1;
      }
    });

    field.aliens.forEach((alien) => {
      if (!alien.alive) return;
      if (alien.y + alien.height >= player.y) {
        lives = 0;
      }
    });

    bullets = bullets.filter((bullet) => bullet.y > -50);
    enemyBullets = enemyBullets.filter((bullet) => bullet.y < GAME_CONFIG.canvasHeight + 50);
  }

  function drawBackground() {
    context.fillStyle = '#0b1d2a';
    context.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);

    context.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 60; i += 1) {
      const x = (i * 97) % GAME_CONFIG.canvasWidth;
      const y = (i * 53) % GAME_CONFIG.canvasHeight;
      context.fillRect(x, y, 2, 2);
    }
  }

  function drawPlayer() {
    context.fillStyle = '#48cae4';
    context.fillRect(player.x, player.y, player.width, player.height);
    context.fillStyle = '#caf0f8';
    context.fillRect(player.x + 18, player.y - 6, 10, 6);
  }

  function drawAliens() {
    field.aliens.forEach((alien) => {
      if (!alien.alive) return;
      context.fillStyle = '#ffb703';
      context.fillRect(alien.x, alien.y, alien.width, alien.height);
      context.fillStyle = '#fb8500';
      context.fillRect(alien.x + 6, alien.y + 6, alien.width - 12, alien.height - 12);
    });
  }

  function drawBullets() {
    context.fillStyle = '#e0f2fe';
    bullets.forEach((bullet) => {
      context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    context.fillStyle = '#ff595e';
    enemyBullets.forEach((bullet) => {
      context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  }

  function drawStatus() {
    context.fillStyle = 'rgba(255,255,255,0.8)';
    context.font = '16px sans-serif';
    if (!isRunning) {
      context.fillText('スタートボタンで開始', 20, 30);
    } else if (isPaused) {
      context.fillText('一時停止中', 20, 30);
    }
  }

  function nextLevelCheck() {
    if (field.aliens.every((alien) => !alien.alive)) {
      level += 1;
      resetLevel();
    }
  }

  function update(delta) {
    handleInput();
    updateBullets();
    updateAliens(delta);
    detectCollisions();
    nextLevelCheck();
    updateHud();
  }

  function render() {
    drawBackground();
    drawPlayer();
    drawAliens();
    drawBullets();
    drawStatus();
  }

  function gameLoop(timestamp) {
    if (!isRunning) return;
    const delta = Math.min((timestamp - lastTime) / 16, 2);
    lastTime = timestamp;
    if (!isPaused) {
      update(delta);
    }
    render();
    if (lives <= 0) {
      isRunning = false;
      isPaused = false;
      render();
      context.fillStyle = 'rgba(0,0,0,0.6)';
      context.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);
      context.fillStyle = '#fff';
      context.font = '28px sans-serif';
      context.fillText('ゲームオーバー', 240, 240);
      return;
    }
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    if (isRunning) return;
    isRunning = true;
    isPaused = false;
    pauseButton.textContent = '一時停止';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }

  startButton.addEventListener('click', () => {
    if (!isRunning) {
      startGame();
    } else {
      isPaused = false;
      pauseButton.textContent = '一時停止';
    }
  });

  pauseButton.addEventListener('click', () => {
    togglePause();
  });

  restartButton.addEventListener('click', () => {
    resetGame();
    startGame();
  });

  window.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'Enter'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === 'Enter') {
      if (!isRunning) {
        startGame();
      } else {
        togglePause();
      }
      return;
    }
    pressedKeys.add(event.code);
  });

  window.addEventListener('keyup', (event) => {
    pressedKeys.delete(event.code);
  });

  resetGame();
  render();
}

document.addEventListener('DOMContentLoaded', initInvaderGame);
