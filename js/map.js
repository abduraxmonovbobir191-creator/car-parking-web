// ==============================
//  O'zbekiston uslubidagi xarita
//  1-bosqich: Quruq yer (terrain)
// ==============================

const MAP_WIDTH = 2400;   // virtual xarita kengligi
const MAP_HEIGHT = 1600;  // virtual xarita balandligi

// Ranglar (O'zbekiston landshaftiga mos)
const COLORS = {
  desert:     '#e8c97a',   // qumli cho'l
  dryLand:    '#d4b483',   // quruq yer
  steppe:     '#c2a36b',   // dasht
  mountain:   '#8b7355',   // tog'
  highMount:  '#6b5b4a',   // baland tog'
  river:      '#4a90a4',   // daryo
  lake:       '#3a7a8c',   // ko'l
  green:      '#7a9e5a',   // vodiylar / yashil joylar
  roadBase:   '#5a5a5a',   // kelajakdagi yo'llar uchun
};

class GameMap {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Mouse events for panning
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', () => this.isDragging = false);
    canvas.addEventListener('mouseleave', () => this.isDragging = false);
    canvas.addEventListener('wheel', (e) => this.onWheel(e));

    this.generateTerrain();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.draw();
  }

  // Oddiy noise funksiyasi (terrain uchun)
  noise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  smoothNoise(x, y) {
    const corners = (this.noise(x-1, y-1) + this.noise(x+1, y-1) + this.noise(x-1, y+1) + this.noise(x+1, y+1)) / 16;
    const sides   = (this.noise(x-1, y) + this.noise(x+1, y) + this.noise(x, y-1) + this.noise(x, y+1)) / 8;
    const center  = this.noise(x, y) / 4;
    return corners + sides + center;
  }

  // Terrain generatsiya (O'zbekiston geografiysiga taxminan mos)
  generateTerrain() {
    this.terrain = [];
    const cellSize = 8; // har bir katak o'lchami

    for (let y = 0; y < MAP_HEIGHT; y += cellSize) {
      const row = [];
      for (let x = 0; x < MAP_WIDTH; x += cellSize) {
        // O'zbekiston shakliga taxminan mos keladigan maska
        // Markazga yaqinroq pastroq, chetlari tog'liroq
        const nx = x / MAP_WIDTH;
        const ny = y / MAP_HEIGHT;

        // Markaziy pasttekislik + chekka tog'lar
        let height = this.smoothNoise(x * 0.008, y * 0.008);
        height += this.smoothNoise(x * 0.02, y * 0.02) * 0.4;

        // O'zbekiston shakliga o'xshash maska (markaz past, chetlar baland)
        const distFromCenter = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.48) ** 2);
        height += distFromCenter * 0.7;

        // Daryo (Amudaryo / Sirdaryo uslubida)
        const river1 = Math.abs(Math.sin(x * 0.003) * 80 + 400 - y);
        const river2 = Math.abs(Math.sin(x * 0.0025 + 2) * 60 + 900 - y);

        let type = 'dryLand';

        if (river1 < 18 || river2 < 14) {
          type = 'river';
        } else if (height > 0.85) {
          type = 'highMount';
        } else if (height > 0.68) {
          type = 'mountain';
        } else if (height < 0.32) {
          type = 'desert';
        } else if (height < 0.42 && (nx > 0.3 && nx < 0.7)) {
          type = 'green'; // vodiylar
        } else if (height < 0.55) {
          type = 'steppe';
        }

        row.push({ type, height });
      }
      this.terrain.push(row);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    const cellSize = 8;

    // Faqat ko'rinadigan qismini chizamiz (performance)
    const startX = Math.max(0, Math.floor((-this.offsetX / this.scale) / cellSize));
    const startY = Math.max(0, Math.floor((-this.offsetY / this.scale) / cellSize));
    const endX = Math.min(this.terrain[0].length, Math.ceil((this.canvas.width - this.offsetX) / this.scale / cellSize) + 1);
    const endY = Math.min(this.terrain.length, Math.ceil((this.canvas.height - this.offsetY) / this.scale / cellSize) + 1);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const cell = this.terrain[y][x];
        ctx.fillStyle = COLORS[cell.type] || COLORS.dryLand;

        // Biroz height ga qarab soyalar
        if (cell.type === 'mountain' || cell.type === 'highMount') {
          const shade = Math.floor(cell.height * 40);
          ctx.fillStyle = this.shadeColor(COLORS[cell.type], -shade);
        }

        ctx.fillRect(x * cellSize, y * cellSize, cellSize + 1, cellSize + 1);
      }
    }

    // Xarita chegarasi
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    ctx.restore();
  }

  shadeColor(color, percent) {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }

  onMouseDown(e) {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Koordinatalarni ko'rsatish
    const worldX = Math.floor((mouseX - this.offsetX) / this.scale);
    const worldY = Math.floor((mouseY - this.offsetY) / this.scale);
    document.getElementById('coords').textContent = `X: ${worldX} | Y: ${worldY}`;

    if (this.isDragging) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.offsetX += dx;
      this.offsetY += dy;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.draw();
    }
  }

  onWheel(e) {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
    const newScale = Math.min(Math.max(0.3, this.scale + delta), 3);

    // Zoom towards mouse
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    this.offsetX = mouseX - (mouseX - this.offsetX) * (newScale / this.scale);
    this.offsetY = mouseY - (mouseY - this.offsetY) * (newScale / this.scale);
    this.scale = newScale;

    this.draw();
  }

  reset() {
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.generateTerrain();
    this.draw();
  }
}
