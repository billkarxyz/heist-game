// Staged scenes for the screenshots (?shot=1..4). Each one freezes the game
// at a moment of maximum visual density: the thief mid-room, guards with
// visible cones, cameras sweeping, loot glinting, the alarm meter legible.
// Nothing here is edited or composited — it is the game itself, posed.
import { GUARD_VIEW_HALF_ANGLE, CAMERA_HALF_ANGLE, GUARD_VIEW_RANGE, CAMERA_RANGE } from './config.js';
import { conePolygon } from './sight.js';

function poseGuard(game, name, x, y, facingDeg, state, suspicion) {
  const g = game.guards.find((gg) => gg.name === name);
  if (!g) return;
  g.x = x;
  g.y = y;
  g.facing = (facingDeg * Math.PI) / 180;
  g.state = state || 'patrol';
  g.suspicion = suspicion || 0;
  g.seesPlayer = state === 'chase';
  g.cone = conePolygon(x, y, g.facing, GUARD_VIEW_HALF_ANGLE, GUARD_VIEW_RANGE, game.blockers);
}

function poseCameras(game) {
  for (const cam of game.cameras) {
    cam.angle = cam.baseAngle + cam.sweep * Math.sin((2 * Math.PI * game.time) / cam.period + cam.phase);
    cam.cone = conePolygon(cam.x, cam.y, cam.angle, CAMERA_HALF_ANGLE, CAMERA_RANGE, game.blockers);
  }
}

function takeLoot(game, ids) {
  for (const id of ids) {
    const l = game.level.loot.find((x) => x.id === id);
    if (l) l.taken = true;
  }
}

function posePlayer(game, x, y, facingDeg, sneaking) {
  game.player.x = x;
  game.player.y = y;
  game.player.facing = (facingDeg * Math.PI) / 180;
  game.player.sneaking = !!sneaking;
  game.player.moving = true;
  game.player.stepPhase = 1.2;
  game.player.inShadow = game.level.shadows.some(
    (s) => x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h,
  );
}

export function stageShot(game, n) {
  game.state = 'playing';
  game.time = 12.5; // fixed moment: glints and camera sweeps are repeatable
  game.timer = n === 1 ? 83 : n === 2 ? 147 : n === 3 ? 212 : 268;
  game.sounds.muted = true;

  if (n === 1) {
    // COVER: the thief mid-hall, cones crossing, cameras live, loot out.
    game.alarm = 45;
    game.lives = 3;
    takeLoot(game, ['gem-0', 'coin-0', 'coin-1', 'bar-6', 'coin-5']);
    posePlayer(game, 700, 470, 180, true);
    poseGuard(game, 'Marco', 420, 450, 0, 'patrol', 12);
    poseGuard(game, 'Lena', 640, 300, 90, 'suspicious', 62);
    poseGuard(game, 'Rosa', 880, 560, 180, 'patrol', 8);
    poseGuard(game, 'Felix', 760, 640, 180, 'patrol', 0);
    poseGuard(game, 'Viktor', 600, 220, 90, 'patrol', 20);
    poseGuard(game, 'Nadia', 470, 120, 0, 'patrol', 0);
    poseGuard(game, 'Otto', 150, 160, 45, 'patrol', 0);
    poseGuard(game, 'Iris', 1130, 160, 135, 'patrol', 0);
    poseCameras(game);
  } else if (n === 2) {
    // SNEAK: hidden in the west gallery shadow as a camera sweeps past.
    game.alarm = 25;
    game.lives = 3;
    takeLoot(game, ['gem-0', 'gem-1', 'coin-0', 'coin-1', 'coin-2', 'bar-4', 'bar-5', 'coin-3', 'coin-4']);
    posePlayer(game, 85, 365, 0, true);
    poseGuard(game, 'Otto', 180, 260, 270, 'patrol', 18);
    poseGuard(game, 'Marco', 340, 450, 180, 'patrol', 0);
    poseGuard(game, 'Lena', 640, 520, 90, 'patrol', 0);
    poseGuard(game, 'Nadia', 500, 120, 0, 'patrol', 0);
    poseGuard(game, 'Viktor', 640, 220, 90, 'patrol', 0);
    poseGuard(game, 'Iris', 1100, 200, 90, 'patrol', 0);
    poseGuard(game, 'Felix', 500, 640, 0, 'patrol', 0);
    poseGuard(game, 'Rosa', 700, 400, 0, 'patrol', 5);
    poseCameras(game);
    game.cameras.find((c) => c.id === 'cam-west').seesPlayer = false;
  } else if (n === 3) {
    // THE CRACK: lockpick on the Aurora Emerald, a guard closing in.
    game.alarm = 70;
    game.lives = 2;
    takeLoot(game, ['gem-0', 'gem-1', 'gem-2', 'gem-3', 'coin-0', 'coin-1', 'coin-2', 'coin-3', 'coin-4', 'coin-5', 'bar-0', 'bar-1', 'bar-4', 'bar-6']);
    posePlayer(game, 640, 130, -90, false);
    game.player.vaultProgress = 0.65;
    poseGuard(game, 'Viktor', 640, 230, -90, 'suspicious', 78);
    poseGuard(game, 'Nadia', 760, 120, 180, 'patrol', 30);
    poseGuard(game, 'Lena', 640, 300, -90, 'patrol', 15);
    poseGuard(game, 'Marco', 420, 450, 0, 'patrol', 0);
    poseGuard(game, 'Otto', 120, 120, 0, 'patrol', 0);
    poseGuard(game, 'Iris', 1150, 120, 180, 'patrol', 0);
    poseGuard(game, 'Felix', 640, 640, -90, 'patrol', 0);
    poseGuard(game, 'Rosa', 850, 500, 180, 'patrol', 0);
    poseCameras(game);
  } else {
    // GETAWAY: emerald in hand, alarm screaming, guards on the hunt.
    game.alarm = 92;
    game.lives = 1;
    game.hasEmerald = true;
    takeLoot(game, ['emerald', 'gem-0', 'gem-1', 'gem-2', 'gem-3', 'gem-4', 'gem-5', 'coin-0', 'coin-1', 'coin-2', 'coin-3', 'coin-4', 'coin-5', 'coin-6', 'coin-7', 'bar-0', 'bar-1', 'bar-2', 'bar-3', 'bar-4', 'bar-5']);
    posePlayer(game, 655, 662, 90, false);
    game.smokes.push({ x: 530, y: 600, r: 110, ttl: 4.5 });
    poseGuard(game, 'Felix', 480, 640, 0, 'chase', 100);
    poseGuard(game, 'Lena', 640, 540, 90, 'chase', 100);
    poseGuard(game, 'Marco', 820, 450, 135, 'suspicious', 85);
    poseGuard(game, 'Rosa', 900, 600, 135, 'chase', 100);
    poseGuard(game, 'Viktor', 640, 260, 90, 'patrol', 45);
    poseGuard(game, 'Nadia', 500, 120, 0, 'patrol', 10);
    poseGuard(game, 'Otto', 160, 200, 45, 'patrol', 0);
    poseGuard(game, 'Iris', 1120, 200, 135, 'patrol', 0);
    poseCameras(game);
  }
  game.grabTarget = null;
}
