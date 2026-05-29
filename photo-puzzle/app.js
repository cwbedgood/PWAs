'use strict';

const GRID = 3;
const CANVAS_PX = 330; // internal resolution: 110px per tile

const state = {
  sourceDataUrl: null,  // cropped preview image stored for peek/win screens
  tiles: [],            // tiles[i] = dataURL for tile with correctIndex i
  tileOrder: [],        // tileOrder[gridPos] = correctIndex (which tile is here)
  selectedPos: -1,      // currently picked-up tile position, -1 = none
  moveCount: 0,
};

// --- Screen Management ---

function showScreen(id) {
  document.querySelectorAll('body > section').forEach(s => {
    s.hidden = s.id !== id;
  });
}

// --- Image Handling ---

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const canvas = document.getElementById('canvas-preview');
    centerCropToCanvas(img, canvas, CANVAS_PX);
    URL.revokeObjectURL(url);
    showScreen('screen-preview');
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

function centerCropToCanvas(img, canvas, size) {
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const srcSize = Math.min(img.naturalWidth, img.naturalHeight);
  const srcX = (img.naturalWidth - srcSize) / 2;
  const srcY = (img.naturalHeight - srcSize) / 2;
  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);
}

// --- Tile Slicing ---

function sliceImage(sourceCanvas) {
  const tileSize = sourceCanvas.width / GRID;
  const result = [];
  for (let i = 0; i < GRID * GRID; i++) {
    const row = Math.floor(i / GRID);
    const col = i % GRID;
    const offscreen = document.createElement('canvas');
    offscreen.width = tileSize;
    offscreen.height = tileSize;
    offscreen.getContext('2d').drawImage(
      sourceCanvas,
      col * tileSize, row * tileSize, tileSize, tileSize,
      0, 0, tileSize, tileSize
    );
    result.push(offscreen.toDataURL('image/jpeg', 0.9));
  }
  return result;
}

// --- Puzzle Logic ---

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function isSolved() {
  return state.tileOrder.every((correctIndex, pos) => correctIndex === pos);
}

function startPuzzle() {
  const sourceCanvas = document.getElementById('canvas-preview');

  state.sourceDataUrl = sourceCanvas.toDataURL('image/jpeg', 0.85);
  state.tiles = sliceImage(sourceCanvas);
  state.tileOrder = Array.from({ length: GRID * GRID }, (_, i) => i);
  shuffle(state.tileOrder);
  if (isSolved()) shuffle(state.tileOrder); // extremely unlikely but handle it

  state.selectedPos = -1;
  state.moveCount = 0;

  // Reset peek canvas so it gets redrawn with the new image
  document.getElementById('canvas-peek')._drawn = false;

  buildGrid();
  renderGrid();
  updateMoveCounter();
  showScreen('screen-game');
}

// --- Grid Rendering ---

function buildGrid() {
  const grid = document.getElementById('puzzle-grid');
  grid.innerHTML = '';
  for (let i = 0; i < GRID * GRID; i++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.pos = i;
    tile.setAttribute('role', 'gridcell');
    tile.setAttribute('tabindex', '0');
    grid.appendChild(tile);
  }
}

function renderGrid() {
  document.querySelectorAll('.tile').forEach((el, pos) => {
    const correctIndex = state.tileOrder[pos];
    el.style.backgroundImage = `url('${state.tiles[correctIndex]}')`;
    el.classList.toggle('selected', pos === state.selectedPos);
    el.setAttribute(
      'aria-label',
      pos === state.selectedPos ? 'Selected tile (tap another to swap)' : `Tile ${pos + 1}`
    );
  });
}

function handleTileClick(pos) {
  if (state.selectedPos === -1) {
    state.selectedPos = pos;
  } else if (state.selectedPos === pos) {
    state.selectedPos = -1;
  } else {
    const a = state.selectedPos;
    const b = pos;
    [state.tileOrder[a], state.tileOrder[b]] = [state.tileOrder[b], state.tileOrder[a]];
    state.moveCount++;
    state.selectedPos = -1;
    updateMoveCounter();
    renderGrid();
    if (isSolved()) {
      setTimeout(showWin, 350);
      return;
    }
    return;
  }
  renderGrid();
}

function updateMoveCounter() {
  document.getElementById('move-counter').textContent =
    `${state.moveCount} move${state.moveCount !== 1 ? 's' : ''}`;
}

// --- Win Screen ---

function showWin() {
  const canvas = document.getElementById('canvas-win');
  canvas.width = CANVAS_PX;
  canvas.height = CANVAS_PX;
  const img = new Image();
  img.onload = () => canvas.getContext('2d').drawImage(img, 0, 0);
  img.src = state.sourceDataUrl;

  document.getElementById('win-stats').textContent =
    `Solved in ${state.moveCount} move${state.moveCount !== 1 ? 's' : ''}!`;
  showScreen('screen-win');
}

// --- Peek Overlay ---

function showPeek() {
  const overlay = document.getElementById('peek-overlay');
  const canvas = document.getElementById('canvas-peek');
  if (!canvas._drawn) {
    canvas.width = CANVAS_PX;
    canvas.height = CANVAS_PX;
    const img = new Image();
    img.onload = () => canvas.getContext('2d').drawImage(img, 0, 0);
    img.src = state.sourceDataUrl;
    canvas._drawn = true;
  }
  overlay.hidden = false;
  overlay.removeAttribute('aria-hidden');
}

function hidePeek() {
  const overlay = document.getElementById('peek-overlay');
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
}

// --- Boot ---

document.addEventListener('DOMContentLoaded', () => {
  // File inputs — one with camera capture, one for gallery
  document.getElementById('input-camera').addEventListener('change', e => {
    handleFile(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('input-gallery').addEventListener('change', e => {
    handleFile(e.target.files[0]);
    e.target.value = '';
  });

  // Preview screen
  document.getElementById('btn-retake').addEventListener('click', () => {
    showScreen('screen-home');
  });
  document.getElementById('btn-start').addEventListener('click', startPuzzle);

  // Game screen — event delegation for tile clicks
  document.getElementById('btn-new-game').addEventListener('click', () => {
    showScreen('screen-home');
  });

  document.getElementById('puzzle-grid').addEventListener('click', e => {
    const tile = e.target.closest('.tile');
    if (!tile) {
      state.selectedPos = -1;
      renderGrid();
      return;
    }
    handleTileClick(parseInt(tile.dataset.pos, 10));
  });

  // Keyboard support for tile selection
  document.getElementById('puzzle-grid').addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const tile = e.target.closest('.tile');
    if (!tile) return;
    e.preventDefault();
    handleTileClick(parseInt(tile.dataset.pos, 10));
  });

  // Peek button — show reference image while held
  const peekBtn = document.getElementById('btn-peek');
  peekBtn.addEventListener('pointerdown', e => {
    e.preventDefault(); // prevent text selection on long press
    showPeek();
  });
  peekBtn.addEventListener('pointerup', hidePeek);
  peekBtn.addEventListener('pointercancel', hidePeek);
  peekBtn.addEventListener('pointerleave', hidePeek);

  document.getElementById('peek-overlay').addEventListener('pointerdown', hidePeek);

  // Win screen
  document.getElementById('btn-play-again').addEventListener('click', () => {
    showScreen('screen-home');
  });

  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
