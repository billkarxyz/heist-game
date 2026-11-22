// Loot: what the thief can pocket, what it is worth, and the win check.
import { PICKUP_RADIUS } from './config.js';

export function lootTakenCount(level) {
  return level.loot.filter((l) => l.taken).length;
}

export function lootValue(level) {
  return level.loot.filter((l) => l.taken).reduce((s, l) => s + l.value, 0);
}

export function emeraldTaken(level) {
  const e = level.loot.find((l) => l.id === 'emerald');
  return e ? e.taken : false;
}

// Nearest loot the thief can grab right now (E), if any.
export function nearestGrabbable(player, level) {
  let best = null;
  let bestD = PICKUP_RADIUS;
  for (const l of level.loot) {
    if (l.taken || l.locked) continue;
    const d = Math.hypot(l.x - player.x, l.y - player.y);
    if (d < bestD) {
      best = l;
      bestD = d;
    }
  }
  return best;
}

export function grabLoot(player, level, sounds) {
  const target = nearestGrabbable(player, level);
  if (target) {
    target.taken = true;
    sounds.pickup(target.kind);
    return target;
  }
  return null;
}

// The emerald's case opens only when the lockpick finishes.
export function tryCrackVault(player, level, sounds) {
  const emerald = level.loot.find((l) => l.id === 'emerald');
  if (!emerald || emerald.taken) return null;
  if (player.vaultProgress >= 1) {
    emerald.taken = true;
    emerald.locked = false;
    sounds.vaultOpen();
    return emerald;
  }
  return null;
}

export function playerAtExit(player, level) {
  const e = level.exit;
  return player.x > e.x && player.x < e.x + e.w && player.y > e.y - 6 && player.y < e.y + e.h + 10;
}
