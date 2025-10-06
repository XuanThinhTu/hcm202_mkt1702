// app.js — Toàn bộ logic game

const EMOJI = {
  empty: '',
  wall: '<img src="assets/barrier.png" class="tile-img"/>',
  exit: '<img src="assets/door.png" class="tile-img"/>',
  item: '<img src="assets/gift.png" class="tile-img"/>',
  person: '<img src="assets/disabled.png" class="tile-img"/>',
  obstacle: '<img src="assets/storm.png" class="tile-img"/>',
  share: '<img src="assets/agreement.png" class="tile-img"/>',
  player: '<img src="assets/player.png" class="tile-img"/>',
};

// === Popup hướng dẫn ===
const guideOverlay = document.getElementById('guideOverlay');
document.getElementById('guideBtn').addEventListener('click', () => {
  guideOverlay.classList.add('show');
});
document.getElementById('closeGuide').addEventListener('click', () => {
  guideOverlay.classList.remove('show');
});
document.getElementById('understoodBtn').addEventListener('click', () => {
  guideOverlay.classList.remove('show');
});

const BASE_MAP = [
  ['0', 'I', '0', '0', 'W', '0', 'P', 'E'],
  ['0', 'W', '0', 'O', '0', 'S', '0', '0'],
  ['0', '0', '0', '0', '0', '0', 'O', '0'],
  ['S', '0', 'W', '0', 'I', '0', '0', '0'],
  ['0', '0', '0', 'P', '0', '0', 'W', '0'],
  ['0', 'O', '0', '0', '0', 'I', '0', '0'],
];

function generateRandomMap(rows = 6, cols = 8, goal = 10) {
  const map = Array.from({ length: rows }, () => Array(cols).fill('0'));
  map[0][cols - 1] = 'E'; // đích
  // spawn tường
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    // tránh spawn vào start và exit
    if (
      map[y][x] === '0' &&
      !(x === 0 && y === rows - 1) && // start
      !(x === cols - 1 && y === 0) && // exit
      map[y][x] !== 'E'
    ) {
      map[y][x] = 'W';
    }
  }

  let warehousePotential = 0;
  // Bắt buộc spawn NPC (P)
  for (let i = 0; i < 3; i++) {
    placeRandom(map, 'P');
    warehousePotential += 3;
  }
  // Bắt buộc spawn Item (I)
  for (let i = 0; i < 3; i++) {
    placeRandom(map, 'I');
    warehousePotential += 2;
  }
  // Bắt buộc spawn Share (S)
  for (let i = 0; i < 2; i++) {
    placeRandom(map, 'S');
    warehousePotential += 2;
  }
  // Spawn vài chướng ngại
  for (let i = 0; i < 2; i++) {
    placeRandom(map, 'O');
  }

  // Nếu vẫn chưa đủ khả năng đạt goal → spawn thêm điểm S
  while (warehousePotential < goal + 2) {
    placeRandom(map, 'S');
    warehousePotential += 2;
  }

  return map;
}

// cấm spawn item/NPC ngay start hoặc exit
function placeRandom(map, symbol) {
  let rows = map.length,
    cols = map[0].length;
  while (true) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    if (
      map[y][x] === '0' &&
      !(x === 0 && y === rows - 1) && // tránh start
      !(x === cols - 1 && y === 0) // tránh exit
    ) {
      map[y][x] = symbol;
      return;
    }
  }
}

function isPathReachable(map) {
  const rows = map.length;
  const cols = map[0].length;
  const start = { x: 0, y: rows - 1 };
  const exit = { x: cols - 1, y: 0 };
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  const queue = [start];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    if (x === exit.x && y === exit.y) return true;

    for (const [dx, dy] of dirs) {
      const nx = x + dx,
        ny = y + dy;
      if (
        nx >= 0 &&
        ny >= 0 &&
        nx < cols &&
        ny < rows &&
        !visited[ny][nx] &&
        map[ny][nx] !== 'W'
      ) {
        visited[ny][nx] = true;
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return false;
}

const S = {
  x: 0,
  y: 5,
  stamina: 12,
  weight: 0,
  warehouse: 0,
  esteem: 0,
  helpers: 0,
  goal: 15,
  map: [],
  rows: 6,
  cols: 8,
  busy: false,
  over: false,
};

function initGame() {
  S.map = generateRandomMap();
  S.rows = S.map.length;
  S.cols = S.map[0].length;
  S.x = 0;
  S.y = S.rows - 1;
  S.stamina = 12;
  S.weight = 0;
  S.warehouse = 0;
  S.esteem = 0;
  S.helpers = 0;
  S.over = false;
  S.busy = false;
  document.getElementById('end').classList.remove('show');
  renderGrid();
  renderHUD();
  hidePanel();
}

function renderGrid() {
  const board = document.getElementById('board');
  board.style.setProperty('--cols', S.cols);
  board.style.setProperty('--rows', S.rows);
  board.innerHTML = '';
  for (let y = 0; y < S.rows; y++) {
    for (let x = 0; x < S.cols; x++) {
      const tile = S.map[y][x];
      const cell = document.createElement('div');
      cell.className = 'cell';
      let symbol = '';
      if (tile === 'W') {
        cell.classList.add('wall');
        symbol = EMOJI.wall;
      }
      if (tile === 'E') {
        cell.classList.add('exit');
        symbol = EMOJI.exit;
      }
      if (tile === 'I') {
        symbol = EMOJI.item;
      }
      if (tile === 'P') {
        symbol = EMOJI.person;
      }
      if (tile === 'O') {
        symbol = EMOJI.obstacle;
      }
      if (tile === 'S') {
        symbol = EMOJI.share;
      }
      if (x === S.x && y === S.y) {
        symbol = `<span class="player">${EMOJI.player}</span>`;
      }
      cell.innerHTML = symbol;
      board.appendChild(cell);
    }
  }
}

function renderHUD() {
  const pct = (v, max) =>
    Math.max(0, Math.min(100, Math.round((v * 100) / max)));
  document.querySelector('#staminaBar span').style.width =
    pct(S.stamina, 12) + '%';
  document.querySelector('#weightBar span').style.width =
    pct(S.weight, 12) + '%';
  document.querySelector('#warehouseBar span').style.width =
    pct(S.warehouse, S.goal) + '%';
  const estWidth = Math.min(100, 50 + S.esteem * 8);
  document.querySelector('#esteemBar span').style.width =
    Math.max(0, estWidth) + '%';
  document.getElementById('helperCount').textContent = S.helpers;
}

window.addEventListener('keydown', (e) => {
  if (S.busy || S.over) return;
  const key = e.key.toLowerCase();
  if (['arrowup', 'w'].includes(key)) {
    e.preventDefault();
    handleMove(0, -1);
  }
  if (['arrowdown', 's'].includes(key)) {
    e.preventDefault();
    handleMove(0, 1);
  }
  if (['arrowleft', 'a'].includes(key)) {
    e.preventDefault();
    handleMove(-1, 0);
  }
  if (['arrowright', 'd'].includes(key)) {
    e.preventDefault();
    handleMove(1, 0);
  }
});

function inside(x, y) {
  return x >= 0 && y >= 0 && x < S.cols && y < S.rows;
}

function handleMove(dx, dy) {
  const nx = S.x + dx,
    ny = S.y + dy;
  if (!inside(nx, ny)) return;
  const tile = S.map[ny][nx];
  if (tile === 'W') return;

  S.x = nx;
  S.y = ny;
  fatigueTick();

  if (tile === 'E') {
    checkEnd(true);
    renderGrid();
    return;
  }

  if (['I', 'P', 'O', 'S'].includes(tile)) {
    triggerTile(tile, nx, ny);
  } else {
    renderHUD();
  }
  renderGrid();
}

function fatigueTick() {
  S.stamina -= S.weight >= 8 ? 1 : 0.5;
  if (S.stamina < 0) S.stamina = 0;
  renderHUD();
  checkEnd(false);
}

function clearTile(x, y) {
  S.map[y][x] = '0';
}

function triggerTile(type, x, y) {
  if (type === 'I') {
    showChoice(
      'Bạn gặp vật phẩm giá trị.',
      { label: 'Nhặt cho mình', effect: { weight: +2, stamina: -1 } },
      {
        label: 'Gửi vào kho chung',
        effect: { warehouse: +2, weight: -1, esteem: +1 },
      },
      () => {
        clearTile(x, y);
      }
    );
  } else if (type === 'P') {
    showChoice(
      'Gặp người cần trợ giúp.',
      { label: 'Bỏ qua', effect: { esteem: -1 } },
      { label: 'Giúp đỡ (mất 1 lượt)', effect: { warehouse: +3, helpers: +1 } },
      () => {
        clearTile(x, y);
      }
    );
  } else if (type === 'O') {
    const canUseHelper = S.helpers > 0;
    const optionA = { label: 'Quay xe (bỏ qua)', effect: {}, keepTile: true }; // 👈 thêm flag keepTile
    const optionB = canUseHelper
      ? { label: 'Dùng thẻ Trợ giúp', effect: { helpers: -1, esteem: +1 } }
      : { label: 'Tự vượt (mệt)', effect: { stamina: -2 } };

    showChoice('Chướng ngại trước mặt.', optionA, optionB, (chosen) => {
      // ✅ Chỉ xóa tile nếu KHÔNG phải quay xe
      if (!chosen.keepTile) clearTile(x, y);
    });
  } else if (type === 'S') {
    showChoice(
      'Điểm chia sẻ – hiến bớt từ ba lô?',
      { label: 'Không', effect: {} },
      {
        label: 'Hiến 2 đơn vị',
        effect: { warehouse: +2, weight: -2, esteem: +1 },
        opensWall: true,
      },
      () => {
        clearTile(x, y);
      }
    );
  }
}

function showChoice(prompt, optA, optB, after) {
  S.busy = true;
  document.getElementById('prompt').textContent = prompt;
  const btnA = document.getElementById('optA');
  const btnB = document.getElementById('optB');
  btnA.textContent = optA.label;
  btnB.textContent = optB.label;

  function choose(opt) {
    applyEffect(opt.effect);
    if (opt.opensWall) openNearestWall(S.x, S.y);
    if (after) after(opt); // 👈 truyền opt đã chọn vào callback
    hidePanel();
    renderGrid();
    renderHUD();
    checkEnd(false);
  }

  btnA.onclick = () => choose(optA);
  btnB.onclick = () => choose(optB);

  document.getElementById('panel').classList.add('show');
}

function hidePanel() {
  document.getElementById('panel').classList.remove('show');
  S.busy = false;
}

function applyEffect(eff) {
  if (!eff) return;
  for (const k of Object.keys(eff)) {
    S[k] += eff[k];
  }
  S.weight = Math.max(0, Math.min(12, S.weight));
  S.stamina = Math.max(0, Math.min(12, S.stamina));
  S.warehouse = Math.max(0, S.warehouse);
}

function openNearestWall(cx, cy) {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (const [dx, dy] of dirs) {
    const nx = cx + dx,
      ny = cy + dy;
    if (!inside(nx, ny)) continue;
    if (S.map[ny][nx] === 'W') {
      S.map[ny][nx] = '0';
      break;
    }
  }
}

function checkEnd(atExit) {
  if (S.over) return;

  if (atExit && S.warehouse >= S.goal) {
    document.body.classList.add('victory-glow');
    setTimeout(() => document.body.classList.remove('victory-glow'), 1500);
  }

  if (S.stamina <= 0) {
    return endGame(
      'Bạn kiệt sức',
      'Bạn đã đi quá sức vì mang nặng và ít chia sẻ. Hãy thử giúp đỡ để nhẹ hành trang và mở thêm lối đi.'
    );
  }
  if (atExit) {
    if (S.warehouse < S.goal) {
      return endGame(
        'Cửa chưa mở…',
        'Bạn đã tới đích nhưng Kho chung chưa đủ để mở cổng. “Mình vì mọi người, mọi người vì mình”.'
      );
    }
    const quote = '“Mình vì mọi người, mọi người vì mình.” — HCM';
    if (S.esteem >= 4) {
      return endGame(
        'Chiến thắng — Lan tỏa',
        'Bạn và cộng đồng đã cùng nhau về đích. ' + quote
      );
    }
    return endGame(
      'Chiến thắng',
      'Kho chung đủ và cổng đã mở. Lần sau hãy lan tỏa nhiều hơn nhé! ' + quote
    );
  }
}

function endGame(title, msg) {
  S.over = true;
  hidePanel();
  document.getElementById('endTitle').textContent = title;
  document.getElementById('endMsg').textContent = msg;
  document.getElementById('statS').textContent = `Stamina: ${S.stamina}/12`;
  document.getElementById('statW').textContent = `Weight: ${S.weight}/12`;
  document.getElementById(
    'statWh'
  ).textContent = `Kho chung: ${S.warehouse}/${S.goal}`;
  document.getElementById('statE').textContent = `Esteem: ${S.esteem}`;
  document.getElementById('statH').textContent = `Trợ giúp: ${S.helpers}`;
  document.getElementById('end').classList.add('show');
}

document.getElementById('restartBtn').addEventListener('click', initGame);
initGame();

// Tooltip click trigger cho mobile
document.querySelectorAll('.stat').forEach((stat) => {
  stat.addEventListener('click', () => {
    stat.classList.add('show-tooltip');
    setTimeout(() => stat.classList.remove('show-tooltip'), 3000);
  });
});

// Tự động điều chỉnh hướng hiển thị tooltip
document.querySelectorAll('.stat').forEach((stat) => {
  stat.addEventListener('mouseenter', () => {
    const rect = stat.getBoundingClientRect();
    if (rect.top < 60) stat.classList.add('tooltip-below');
    else stat.classList.remove('tooltip-below');
  });
});
