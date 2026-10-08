const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const blockCountEl = document.getElementById('blockCount');
const healthValueEl = document.getElementById('healthValue');
const inventoryEl = document.getElementById('inventory');

const TILE = 32;
const WORLD_W = 48;
const WORLD_H = 20;
const VIEW_WIDTH = canvas.width;
const VIEW_HEIGHT = canvas.height;

const BLOCKS = {
  grass: { color: '#6fcf5a', emoji: '🌿', name: 'Grass' },
  dirt: { color: '#8b5a2b', emoji: '🟫', name: 'Dirt' },
  stone: { color: '#8e9aa5', emoji: '🪨', name: 'Stone' },
  wood: { color: '#b77b46', emoji: '🪵', name: 'Wood' },
  leaves: { color: '#3da35d', emoji: '🍃', name: 'Leaves' },
  sand: { color: '#d9c57f', emoji: '🏖️', name: 'Sand' },
  water: { color: '#4ca3ff', emoji: '💧', name: 'Water' },
  brick: { color: '#d66363', emoji: '🧱', name: 'Brick' },
};

const blockOrder = ['grass', 'dirt', 'stone', 'wood', 'leaves', 'sand', 'water', 'brick'];
const inventory = [
  { type: 'grass', count: 12 },
  { type: 'dirt', count: 12 },
  { type: 'stone', count: 10 },
  { type: 'wood', count: 8 },
  { type: 'leaves', count: 8 },
  { type: 'sand', count: 6 },
  { type: 'brick', count: 6 },
];
let selectedIndex = 0;

const player = {
  x: 6 * TILE,
  y: 7 * TILE,
  w: 28,
  h: 32,
  vx: 0,
  vy: 0,
  speed: 2.6,
  jump: 8.4,
  grounded: false,
  health: 100,
  facing: 1,
};

function generateWorld() {
  for (let y = 0; y < WORLD_H; y++) {
    const row = [];
    for (let x = 0; x < WORLD_W; x++) {
      let type = null;

      if (y > 12) {
        type = 'water';
      } else if (y === 12) {
        type = 'sand';
      } else if (y > 9) {
        type = 'dirt';
      } else if (y > 7) {
        type = 'grass';
      } else if (y > 5 && x % 7 === 0) {
        type = 'stone';
      } else if (y > 4 && x % 9 === 0) {
        type = 'stone';
      } else if (y < 5 && x % 11 === 0) {
        type = 'leaves';
      } else {
        type = null;
      }

      if (x > 3 && x < 8 && y === 10) {
        type = 'wood';
      }
      if (x > 4 && x < 7 && y === 9) {
        type = 'leaves';
      }

      row.push(type);
    }
    world.push(row);
  }
}

const world = [];

function getTile(x, y) {
  const tileX = Math.floor(x / TILE);
  const tileY = Math.floor(y / TILE);
  if (tileX < 0 || tileY < 0 || tileX >= WORLD_W || tileY >= WORLD_H) {
    return null;
  }
  return world[tileY][tileX];
}

function setTile(x, y, type) {
  const tileX = Math.floor(x / TILE);
  const tileY = Math.floor(y / TILE);
  if (tileX < 0 || tileY < 0 || tileX >= WORLD_W || tileY >= WORLD_H) {
    return;
  }
  world[tileY][tileX] = type;
}

function checkCollisions() {
  player.grounded = false;

  const left = Math.floor((player.x) / TILE);
  const right = Math.floor((player.x + player.w) / TILE);
  const top = Math.floor((player.y) / TILE);
  const bottom = Math.floor((player.y + player.h) / TILE);

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) continue;
      const tile = world[y][x];
      if (!tile) continue;
      if (tile === 'water') continue;

      const tileX = x * TILE;
      const tileY = y * TILE;

      if (player.vy > 0 && player.y + player.h <= tileY + 12 && player.y + player.h + player.vy >= tileY) {
        player.y = tileY - player.h;
        player.vy = 0;
        player.grounded = true;
      }

      if (player.vy < 0 && player.y >= tileY + TILE - 12 && player.y + player.vy <= tileY + TILE) {
        player.y = tileY + TILE;
        player.vy = 0;
      }

      if (player.vx > 0 && player.x + player.w <= tileX + 12 && player.x + player.w + player.vx >= tileX) {
        player.x = tileX - player.w;
        player.vx = 0;
      }

      if (player.vx < 0 && player.x >= tileX + TILE - 12 && player.x + player.vx <= tileX + TILE) {
        player.x = tileX + TILE;
        player.vx = 0;
      }
    }
  }
}

function updatePlayer() {
  if (keys['ArrowLeft'] || keys['a']) {
    player.vx = -player.speed;
    player.facing = -1;
  } else if (keys['ArrowRight'] || keys['d']) {
    player.vx = player.speed;
    player.facing = 1;
  } else {
    player.vx *= 0.72;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  }

  if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && player.grounded) {
    player.vy = -player.jump;
    player.grounded = false;
  }

  player.vy += 0.45;
  player.x += player.vx;
  player.y += player.vy;

  if (player.y > VIEW_HEIGHT + 100) {
    player.health -= 25;
    player.x = 6 * TILE;
    player.y = 4 * TILE;
  }

  if (player.x < 0) player.x = 0;
  if (player.x + player.w > WORLD_W * TILE) player.x = WORLD_W * TILE - player.w;

  checkCollisions();

  if (player.health <= 0) {
    player.health = 100;
    player.x = 6 * TILE;
    player.y = 4 * TILE;
  }
}

function mineBlockAtMouse(mx, my) {
  const tileX = Math.floor(mx / TILE);
  const tileY = Math.floor(my / TILE);
  if (tileX < 0 || tileY < 0 || tileX >= WORLD_W || tileY >= WORLD_H) return;

  if (!world[tileY][tileX]) return;

  const blockType = world[tileY][tileX];
  if (blockType === 'water') return;

  world[tileY][tileX] = null;

  const item = inventory.find((slot) => slot.type === blockType);
  if (item) {
    item.count += 1;
  } else {
    inventory.push({ type: blockType, count: 1 });
  }

  updateHUD();
}

function placeSelectedBlock(mx, my) {
  const tileX = Math.floor(mx / TILE);
  const tileY = Math.floor(my / TILE);
  if (tileX < 0 || tileY < 0 || tileX >= WORLD_W || tileY >= WORLD_H) return;

  const slot = inventory[selectedIndex];
  if (!slot || slot.count <= 0) return;
  if (world[tileY][tileX]) return;

  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const tileCenterX = tileX * TILE + TILE / 2;
  const tileCenterY = tileY * TILE + TILE / 2;
  const distance = Math.hypot(px - tileCenterX, py - tileCenterY);
  if (distance > 2.2 * TILE) return;

  world[tileY][tileX] = slot.type;
  slot.count -= 1;
  if (slot.count <= 0) {
    inventory.splice(selectedIndex, 1);
    selectedIndex = Math.max(0, selectedIndex - 1);
  }

  updateHUD();
}

function updateHUD() {
  blockCountEl.textContent = inventory.reduce((sum, slot) => sum + slot.count, 0);
  healthValueEl.textContent = Math.round(player.health);

  inventoryEl.innerHTML = '';
  inventory.forEach((slot, index) => {
    const node = document.createElement('div');
    node.className = 'slot' + (index === selectedIndex ? ' active' : '');
    node.innerHTML = `<div class="emoji">${BLOCKS[slot.type].emoji}</div><div class="label">${slot.count}</div>`;
    node.addEventListener('click', () => {
      selectedIndex = index;
      updateHUD();
    });
    inventoryEl.appendChild(node);
  });
}

function drawWorld() {
  const camX = Math.max(0, Math.min(player.x - VIEW_WIDTH / 2 + player.w / 2, WORLD_W * TILE - VIEW_WIDTH));

  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const tile = world[y][x];
      if (!tile) continue;
      const drawX = x * TILE - camX;
      const drawY = y * TILE;
      ctx.fillStyle = BLOCKS[tile].color;
      ctx.fillRect(drawX, drawY, TILE, TILE);

      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX, drawY, TILE, TILE);
    }
  }
}

function drawPlayer() {
  const camX = Math.max(0, Math.min(player.x - VIEW_WIDTH / 2 + player.w / 2, WORLD_W * TILE - VIEW_WIDTH));
  const drawX = player.x - camX;

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(drawX, player.y, player.w, player.h);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(drawX + 6, player.y + 6, 6, 8);
  ctx.fillRect(drawX + player.w - 12, player.y + 6, 6, 8);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(drawX + 4, player.y + player.h - 10, player.w - 8, 8);
}

function drawCrosshair() {
  const mx = canvas.width / 2;
  const my = canvas.height / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx - 8, my);
  ctx.lineTo(mx + 8, my);
  ctx.moveTo(mx, my - 8);
  ctx.lineTo(mx, my + 8);
  ctx.stroke();
}

function drawSelectedBlock() {
  const slot = inventory[selectedIndex];
  if (!slot) return;
  const name = BLOCKS[slot.type].name;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(18, 18, 205, 54);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('Selected: ' + name, 30, 44);
  ctx.fillText('Hotkey: ' + (selectedIndex + 1), 30, 64);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawWorld();
  drawPlayer();
  drawCrosshair();
  drawSelectedBlock();
}

const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  keys[e.key.toLowerCase()] = true;

  if (e.key >= '1' && e.key <= '9') {
    const idx = Number(e.key) - 1;
    if (inventory[idx]) selectedIndex = idx;
    updateHUD();
  }

  if (e.key === 'e') {
    const mouseX = player.x + player.w / 2;
    const mouseY = player.y + player.h / 2;
    mineBlockAtMouse(mouseX, mouseY);
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const clickY = ((event.clientY - rect.top) / rect.height) * canvas.height;

  const camX = Math.max(0, Math.min(player.x - VIEW_WIDTH / 2 + player.w / 2, WORLD_W * TILE - VIEW_WIDTH));
  const worldX = clickX + camX;
  const worldY = clickY;

  const tileX = Math.floor(worldX / TILE);
  const tileY = Math.floor(worldY / TILE);

  if (event.shiftKey) {
    mineBlockAtMouse(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2);
  } else {
    placeSelectedBlock(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2);
  }
});

function loop() {
  updatePlayer();
  draw();
  requestAnimationFrame(loop);
}

generateWorld();
updateHUD();
loop();