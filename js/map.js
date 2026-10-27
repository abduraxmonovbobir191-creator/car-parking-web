// ==============================
//  O'zbekiston uslubidagi xarita
//  1-bosqich: Quruq yer (terrain)
//  2-bosqich: Yo'llar
// ==============================

const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1600;

const COLORS = {
  desert:     '#e8c97a',
  dryLand:    '#d4b483',
  steppe:     '#c2a36b',
  mountain:   '#8b7355',
  highMount:  '#6b5b4a',
  river:      '#4a90a4',
  lake:       '#3a7a8c',
  green:      '#7a9e5a',
  road:       '#4a4a4a',
  roadEdge:   '#333333',
  roadLine:   '#f0e68c',
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

    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', () => this.isDragging = false);
    canvas.addEventListener('mouseleave', () => this.isDragging = false);
    canvas.addEventListener('wheel', (e) => this.onWheel(e));

    this.generateTerrain();
    this.generateRoads();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.draw();
  }

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

  generateTerrain() {
    this.terrain = [];
    const cellSize = 8;

    for (let y = 0; y < MAP_HEIGHT; y += cellSize) {
      const row = [];
      for (let x = 0; x < MAP_WIDTH; x += cellSize) {
        const nx = x / MAP_WIDTH;
        const ny = y / MAP_HEIGHT;

        let height = this.smoothNoise(x * 0.008, y * 0.008);
        height += this.smoothNoise(x * 0.02, y * 0.02) * 0.4;

        const distFromCenter = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.48) ** 2);
        height += distFromCenter * 0.7;

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
          type = 'green';
        } else if (height < 0.55) {
          type = 'steppe';
        }

        row.push({ type, height });
      }
      this.terrain.push(row);
    }
  }

  // ==============================
  //  2-bosqich: Yo'llar generatsiyasi
  // ==============================
  generateRoads() {
    this.roads = [];

    // Asosiy magistrallar (katta yo'llar)
    // 1. Gorizontal asosiy yo'l (Toshkent - Samarqand - Buxoro yo'nalishi)
    this.roads.push({
      points: [
        {x: 100, y: 480},
        {x: 500, y: 460},
        {x: 900, y: 500},
        {x: 1300, y: 470},
        {x: 1700, y: 520},
        {x: 2200, y: 490}
      ],
      width: 18,
      type: 'highway'
    });

    // 2. Vertikal asosiy yo'l (shimol-janub)
    this.roads.push({
      points: [
        {x: 1150, y: 80},
        {x: 1180, y: 350},
        {x: 1200, y: 600},
        {x: 1170, y: 900},
        {x: 1220, y: 1200},
        {x: 1190, y: 1500}
      ],
      width: 16,
      type: 'highway'
    });

    // 3. Ikkinchi gorizontal (janubiy yo'l)
    this.roads.push({
      points: [
        {x: 150, y: 1050},
        {x: 600, y: 1020},
        {x: 1100, y: 1080},
        {x: 1600, y: 1040},
        {x: 2100, y: 1100}
      ],
      width: 14,
      type: 'highway'
    });

    // 4. Diagonal yo'l
    this.roads.push({
      points: [
        {x: 300, y: 200},
        {x: 700, y: 400},
        {x: 1100, y: 550},
        {x: 1500, y: 750},
        {x: 1900, y: 950}
      ],
      width: 12,
      type: 'secondary'
    });

    // Kichikroq yo'llar (shaharlarga olib boruvchi)
    const secondaryRoads = [
      // Toshkent atrofi (shimoli-sharq)
      [{x: 1700, y: 300}, {x: 1850, y: 380}, {x: 2000, y: 320}, {x: 2150, y: 400}],
      // Samarqand atrofi
      [{x: 900, y: 500}, {x: 850, y: 600}, {x: 920, y: 720}],
      // Buxoro tomon
      [{x: 500, y: 460}, {x: 420, y: 580}, {x: 380, y: 700}],
      // Farg'ona vodiysi tomon
      [{x: 1900, y: 500}, {x: 2050, y: 580}, {x: 2200, y: 650}],
      // Janubiy yo'llar
      [{x: 800, y: 1050}, {x: 750, y: 1200}, {x: 820, y: 1350}],
      [{x: 1400, y: 1040}, {x: 1500, y: 1180}, {x: 1450, y: 1400}],
    ];

    secondaryRoads.forEach(points => {
      this.roads.push({
        points,
        width: 9,
        type: 'secondary'
      });
    });

    // Juda kichik yo'llar (qishloq yo'llari)
    for (let i = 0; i < 12; i++) {
      const startX = 200 + Math.random() * 2000;
      const startY = 150 + Math.random() * 1300;
      const points = [{x: startX, y: startY}];

      let cx = startX;
      let cy = startY;
      for (let j = 0; j < 4; j++) {
        cx += (Math.random() - 0.5) * 280;
        cy += (Math.random() - 0.5) * 200;
        cx = Math.max(50, Math.min(MAP_WIDTH - 50, cx));
        cy = Math.max(50, Math.min(MAP_HEIGHT - 50, cy));
        points.push({x: cx, y: cy});
      }

      this.roads.push({
        points,
        width: 5,
        type: 'local'
      });
    }
  }

  drawRoad(road) {
    const ctx = this.ctx;
    if (road.points.length < 2) return;

    // Yo'l tanasi
    ctx.beginPath();
    ctx.moveTo(road.points[0].x, road.points[0].y);
    for (let i = 1; i < road.points.length; i++) {
      ctx.lineTo(road.points[i].x, road.points[i].y);
    }

    ctx.strokeStyle = COLORS.roadEdge;
    ctx.lineWidth = road.width + 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.strokeStyle = COLORS.road;
    ctx.lineWidth = road.width;
    ctx.stroke();

    // O'rta chiziq (faqat katta yo'llarda)
    if (road.type === 'highway') {
      ctx.strokeStyle = COLORS.roadLine;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([12, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    const cellSize = 8;

    const startX = Math.max(0, Math.floor((-this.offsetX / this.scale) / cellSize));
    const startY = Math.max(0, Math.floor((-this.offsetY / this.scale) / cellSize));
    const endX = Math.min(this.terrain[0].length, Math.ceil((this.canvas.width - this.offsetX) / this.scale / cellSize) + 1);
    const endY = Math.min(this.terrain.length, Math.ceil((this.canvas.height - this.offsetY) / this.scale / cellSize) + 1);

    // 1. Terrain chizish
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const cell = this.terrain[y][x];
        ctx.fillStyle = COLORS[cell.type] || COLORS.dryLand;

        if (cell.type === 'mountain' || cell.type === 'highMount') {
          const shade = Math.floor(cell.height * 40);
          ctx.fillStyle = this.shadeColor(COLORS[cell.type], -shade);
        }

        ctx.fillRect(x * cellSize, y * cellSize, cellSize + 1, cellSize + 1);
      }
    }

    // 2. Yo'llarni chizish
    this.roads.forEach(road => this.drawRoad(road));

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
    this.generateRoads();
    this.draw();
  }
}
