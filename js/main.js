// ==============================
//  Asosiy o'yin ishga tushirish
// ==============================

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const gameMap = new GameMap(canvas);

  // Qayta chizish tugmasi
  document.getElementById('btn-reset').addEventListener('click', () => {
    gameMap.reset();
  });

  console.log('Car Parking Uzbekistan — Xarita yuklandi');
  console.log('Hozirgi bosqich: Quruq yer (terrain)');
});
