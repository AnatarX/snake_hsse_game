const canvasSize = 400;
const gridSize = 20;

let canvas, ctx, snake, food, direction, score, speed, gameInterval;

function initMenu() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  switchTab('about');
}

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(div => {
    div.classList.toggle('active', div.id === 'tab-' + tab);
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  if (tab === 'play') {
    startGame();
  }
  if (tab === 'scores') {
    showScores();
  }
}

function startGame() {
  const container = document.getElementById('tab-play');
  container.innerHTML = '';
  canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  ctx = canvas.getContext('2d');
  container.appendChild(canvas);

  resetGame();
  gameInterval = setInterval(gameLoop, 200 - speed);
  window.addEventListener('keydown', handleKey);
}

function resetGame() {
  snake = [{ x: 10, y: 10 }];
  direction = { x: 0, y: 0 };
  spawnFood();
  score = 0;
  speed = 50;
}

function gameLoop() {
  moveSnake();
  if (checkCollision()) {
    return gameOver();
  }
  if (eatFood()) {
    score += 10;
    speed = Math.min(180, speed + 5);
    spawnFood();
  }
  draw();
}

function moveSnake() {
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  snake.unshift(head);
  snake.pop();
}

function handleKey(e) {
  if (e.key === 'ArrowUp' && direction.y === 0) {
    direction = { x: 0, y: -1 };
  }
  if (e.key === 'ArrowDown' && direction.y === 0) {
    direction = { x: 0, y: 1 };
  }
  if (e.key === 'ArrowLeft' && direction.x === 0) {
    direction = { x: -1, y: 0 };
  }
  if (e.key === 'ArrowRight' && direction.x === 0) {
    direction = { x: 1, y: 0 };
  }
}

function checkCollision() {
  const head = snake[0];
  if (head.x < 0 || head.x >= canvasSize / gridSize || head.y < 0 || head.y >= canvasSize / gridSize) {
    return true;
  }
  return snake.slice(1).some(s => s.x === head.x && s.y === head.y);
}

function eatFood() {
  const head = snake[0];
  if (head.x === food.x && head.y === food.y) {
    snake.push({});
    return true;
  }
  return false;
}

function spawnFood() {
  food = {
    x: Math.floor(Math.random() * canvasSize / gridSize),
    y: Math.floor(Math.random() * canvasSize / gridSize)
  };
}

function draw() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = 'lime';
  snake.forEach(s =>
    ctx.fillRect(s.x * gridSize, s.y * gridSize, gridSize - 1, gridSize - 1)
  );
  ctx.fillStyle = 'red';
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
  ctx.fillStyle = 'white';
  ctx.fillText(`Очки: ${score}`, 10, canvasSize - 10);
}

function gameOver() {
  clearInterval(gameInterval);
  window.removeEventListener('keydown', handleKey);
  const name = prompt('Игра окончена! Ваше имя:');
  if (name) {
    saveScore(name, score);
  }
}

async function saveScore(name, score) {
  await fetch('/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score })
  });
  switchTab('scores');
}

const select = document.getElementById('rows-select');
const tbody = document.querySelector('#scores-table tbody');
const headers = document.querySelectorAll('#scores-table th.sortable');
let currentSort = { col: 'score', dir: 'desc' };

async function showScores() {
  const list = await fetch('/scores').then(r => r.json());

  function render() {
    const count = +select.value;
    const sorted = [...list].sort((a, b) => {
      if (currentSort.col === 'score') {
        return currentSort.dir === 'asc' ? a.score - b.score : b.score - a.score;
      }
      return currentSort.dir === 'asc'
        ? new Date(a.time) - new Date(b.time)
        : new Date(b.time) - new Date(a.time);
    });
    tbody.innerHTML = '';
    sorted.slice(0, count).forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${r.name}</td>
        <td>${r.score}</td>
        <td>${new Date(r.time).toLocaleString()}</td>
      `;
      tbody.append(tr);
    });
    headers.forEach(th => th.dataset.sorted = '');
    const active = [...headers].find(th => th.dataset.col === currentSort.col);
    if (active) {
      active.dataset.sorted = currentSort.dir;
    }
  }

  headers.forEach(th => {
    th.onclick = () => {
      const col = th.dataset.col;
      if (currentSort.col === col) {
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.col = col;
        currentSort.dir = 'desc';
      }
      render();
    };
  });
  select.onchange = render;
  render();
}

window.onload = initMenu;