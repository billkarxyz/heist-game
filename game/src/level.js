// The museum: one floor, four wings around a grand hall, a vault room in
// the north, and the getaway door in the south wall. Every number below is
// hand-placed so patrols, cones and loot are all readable in one frame.
import { WORLD_W, WORLD_H } from './config.js';

export function buildLevel() {
  const walls = [
    // Outer shell (the south wall leaves the getaway gap x600-680).
    { x: 0, y: 0, w: WORLD_W, h: 16 },
    { x: 0, y: 0, w: 16, h: WORLD_H },
    { x: 1264, y: 0, w: 16, h: WORLD_H },
    { x: 0, y: 704, w: 600, h: 16 },
    { x: 680, y: 704, w: 600, h: 16 },
    // Vault room (north centre), door gap x610-670 in its south wall.
    { x: 520, y: 16, w: 16, h: 154 },
    { x: 744, y: 16, w: 16, h: 154 },
    { x: 536, y: 154, w: 74, h: 16 },
    { x: 670, y: 154, w: 74, h: 16 },
    // West gallery divider, door gap y180-240.
    { x: 300, y: 16, w: 16, h: 164 },
    { x: 300, y: 240, w: 16, h: 76 },
    // East gallery divider, door gap y180-240.
    { x: 964, y: 16, w: 16, h: 164 },
    { x: 964, y: 240, w: 16, h: 76 },
    // Freestanding cover walls in the grand hall.
    { x: 560, y: 380, w: 160, h: 16 },
    { x: 200, y: 420, w: 16, h: 140 },
    { x: 1064, y: 420, w: 16, h: 140 },
    { x: 420, y: 220, w: 16, h: 90 },
    { x: 844, y: 220, w: 16, h: 90 },
  ];

  // Display cases: solid, block sight, each holds one gem.
  const cases = [
    { x: 380, y: 260, w: 64, h: 36, label: 'Sapphire Case' },
    { x: 840, y: 260, w: 64, h: 36, label: 'Ruby Case' },
    { x: 480, y: 480, w: 64, h: 36, label: 'Pearl Case' },
    { x: 760, y: 480, w: 64, h: 36, label: 'Opal Case' },
    { x: 100, y: 110, w: 64, h: 36, label: 'Jade Case' },
    { x: 1120, y: 110, w: 64, h: 36, label: 'Topaz Case' },
    { x: 100, y: 560, w: 64, h: 36, label: 'Amber Case' },
    { x: 1120, y: 560, w: 64, h: 36, label: 'Onyx Case' },
  ];

  // Shadow patches: stand still and sneak here and guards barely see you.
  const shadows = [
    { x: 40, y: 620, w: 110, h: 70, label: 'Palm shadow' },
    { x: 1130, y: 620, w: 110, h: 70, label: 'Palm shadow' },
    { x: 560, y: 600, w: 160, h: 80, label: 'Curtain shadow' },
    { x: 330, y: 330, w: 90, h: 60, label: 'Statue shadow' },
    { x: 860, y: 330, w: 90, h: 60, label: 'Statue shadow' },
    { x: 40, y: 330, w: 90, h: 70, label: 'Gallery shadow' },
    { x: 1150, y: 330, w: 90, h: 70, label: 'Gallery shadow' },
  ];

  // Paintings and plants are decoration only: they never block sight.
  const paintings = [
    { x: 60, y: 18, w: 90, h: 8, tint: '#b07a3a' },
    { x: 190, y: 18, w: 90, h: 8, tint: '#3a7ab0' },
    { x: 340, y: 18, w: 90, h: 8, tint: '#7a3ab0' },
    { x: 850, y: 18, w: 90, h: 8, tint: '#b03a3a' },
    { x: 1000, y: 18, w: 90, h: 8, tint: '#7a3ab0' },
    { x: 1130, y: 18, w: 90, h: 8, tint: '#b03a3a' },
    { x: 18, y: 120, w: 8, h: 90, tint: '#3ab07a' },
    { x: 1254, y: 120, w: 8, h: 90, tint: '#b07a3a' },
    { x: 304, y: 60, w: 8, h: 70, tint: '#b03a7a' },
    { x: 968, y: 60, w: 8, h: 70, tint: '#3ab0b0' },
  ];
  const plants = [
    { x: 60, y: 640 }, { x: 1220, y: 640 }, { x: 340, y: 660 },
    { x: 940, y: 660 }, { x: 60, y: 340 }, { x: 1220, y: 340 },
    { x: 320, y: 340 }, { x: 960, y: 340 }, { x: 170, y: 620 }, { x: 1110, y: 620 },
  ];

  // Rugs and statues are decoration only: they fill the empty floor so no
  // corner of the hall reads as dead space. They never block sight or move.
  const rugs = [
    { x: 60, y: 380, w: 180, h: 120 },
    { x: 1040, y: 380, w: 180, h: 120 },
    { x: 300, y: 630, w: 240, h: 50 },
    { x: 740, y: 630, w: 240, h: 50 },
  ];
  const statues = [
    { x: 60, y: 200 }, { x: 1220, y: 200 }, { x: 250, y: 620 }, { x: 1030, y: 620 },
  ];

  // 24 treasures: 8 gems on cases, 8 coins on pedestals, 7 gold bars,
  // and the Aurora Emerald on its pedestal inside the vault room.
  const loot = [];
  const gemNames = ['Sapphire', 'Ruby', 'Pearl', 'Opal', 'Jade', 'Topaz', 'Amber', 'Onyx'];
  cases.forEach((c, i) => {
    loot.push({ id: `gem-${i}`, kind: 'gem', name: gemNames[i], x: c.x + c.w / 2, y: c.y + c.h / 2, value: 150, taken: false });
  });
  const coinSpots = [
    [640, 250], [430, 340], [850, 340], [250, 300], [1030, 300],
    [640, 560], [180, 470], [1100, 470],
  ];
  coinSpots.forEach(([x, y], i) => {
    loot.push({ id: `coin-${i}`, kind: 'coin', name: 'Gold Coin', x, y, value: 50, taken: false });
  });
  const barSpots = [
    [580, 60], [700, 60], [580, 120], [700, 120], // inside the vault room
    [150, 200], [1130, 200], [640, 640],
  ];
  barSpots.forEach(([x, y], i) => {
    loot.push({ id: `bar-${i}`, kind: 'bar', name: 'Gold Bar', x, y, value: 100, taken: false });
  });
  loot.push({ id: 'emerald', kind: 'emerald', name: 'Aurora Emerald', x: 640, y: 85, value: 500, taken: false, locked: true });

  // 8 guards, each with a named patrol loop the player can learn.
  const guards = [
    { name: 'Marco', x: 300, y: 450, waypoints: [[300, 450], [980, 450]], speed: 62 },
    { name: 'Lena', x: 640, y: 220, waypoints: [[640, 220], [640, 620]], speed: 62 },
    { name: 'Otto', x: 80, y: 80, waypoints: [[80, 80], [240, 80], [240, 260], [80, 260]], speed: 58 },
    { name: 'Iris', x: 1040, y: 80, waypoints: [[1040, 80], [1200, 80], [1200, 260], [1040, 260]], speed: 58 },
    { name: 'Viktor', x: 560, y: 220, waypoints: [[560, 220], [720, 220]], speed: 55 },
    { name: 'Nadia', x: 340, y: 120, waypoints: [[340, 120], [940, 120]], speed: 66 },
    { name: 'Felix', x: 300, y: 600, waypoints: [[300, 600], [980, 600]], speed: 62 },
    { name: 'Rosa', x: 380, y: 560, waypoints: [[380, 560], [900, 560], [900, 330], [380, 330]], speed: 60 },
  ];

  // 4 cameras on the walls, sweeping their cones back and forth.
  const cameras = [
    { id: 'cam-vault', x: 640, y: 176, baseAngle: Math.PI / 2, sweep: 0.7, period: 5.0, phase: 0 },
    { id: 'cam-west', x: 308, y: 120, baseAngle: Math.PI, sweep: 0.6, period: 6.0, phase: 1.3 },
    { id: 'cam-east', x: 972, y: 120, baseAngle: 0, sweep: 0.6, period: 6.0, phase: 2.6 },
    { id: 'cam-door', x: 640, y: 700, baseAngle: -Math.PI / 2, sweep: 0.55, period: 5.0, phase: 3.9 },
  ];

  return {
    walls,
    cases,
    shadows,
    paintings,
    plants,
    rugs,
    statues,
    loot,
    guards,
    cameras,
    solids: [...walls, ...cases],
    blockers: [...walls, ...cases],
    vault: { x: 536, y: 16, w: 224, h: 154, door: { x: 610, y: 154, w: 60, h: 16 } },
    exit: { x: 600, y: 690, w: 80, h: 30 },
    spawn: { x: 640, y: 668 },
    carpet: { x: 596, y: 170, w: 88, h: 534 },
  };
}
