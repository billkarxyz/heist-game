// The thief: movement, sneak, gadgets, and the vault lockpick.
import {
  PLAYER_RADIUS, PLAYER_WALK_SPEED, PLAYER_SNEAK_SPEED,
  PLAYER_NOISE_WALK, PLAYER_NOISE_SNEAK, COIN_COUNT, SMOKE_COUNT,
  SMOKE_RADIUS, SMOKE_SECONDS, VAULT_CRACK_SECONDS,
} from './config.js';
import { clampToWorld, resolveCollisions } from './sight.js';

export class Player {
  constructor(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.facing = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.coins = COIN_COUNT;
    this.smokes = SMOKE_COUNT;
    this.noiseRadius = 0;
    this.inShadow = false;
    this.vaultProgress = 0; // 0..1 while holding E at the emerald
    this.stepPhase = 0;
  }

  update(dt, input, level) {
    let mx = 0;
    let my = 0;
    if (input.isDown('KeyW') || input.isDown('ArrowUp')) my -= 1;
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) my += 1;
    if (input.isDown('KeyA') || input.isDown('ArrowLeft')) mx -= 1;
    if (input.isDown('KeyD') || input.isDown('ArrowRight')) mx += 1;
    this.sneaking = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    this.moving = mx !== 0 || my !== 0;
    if (this.moving) {
      const len = Math.hypot(mx, my);
      const speed = this.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
      const nx = this.x + (mx / len) * speed * dt;
      const ny = this.y + (my / len) * speed * dt;
      this.facing = Math.atan2(my, mx);
      const solved = resolveCollisions(nx, ny, PLAYER_RADIUS, level.solids);
      const clamped = clampToWorld(solved.x, solved.y, PLAYER_RADIUS);
      this.x = clamped.x;
      this.y = clamped.y;
      this.stepPhase += dt * (this.sneaking ? 5 : 9);
      this.noiseRadius = this.sneaking ? PLAYER_NOISE_SNEAK : PLAYER_NOISE_WALK;
    } else {
      this.noiseRadius = 0;
    }
    this.inShadow = level.shadows.some(
      (s) => this.x > s.x && this.x < s.x + s.w && this.y > s.y && this.y < s.y + s.h,
    );
    // Lockpick progress only grows while standing at the emerald and
    // holding E; stepping away resets it.
    const emerald = level.loot.find((l) => l.id === 'emerald');
    const nearVault = emerald && !emerald.taken &&
      Math.hypot(this.x - emerald.x, this.y - emerald.y) < 46;
    if (nearVault && input.isDown('KeyE')) {
      this.vaultProgress = Math.min(1, this.vaultProgress + dt / VAULT_CRACK_SECONDS);
    } else if (!nearVault) {
      this.vaultProgress = 0;
    }
  }

  tossCoin(input, game) {
    if (this.coins <= 0) return false;
    this.coins -= 1;
    // The coin flies 130px ahead of the thief, towards the mouse if the
    // player is aiming, otherwise straight ahead.
    const aim = input.mouseActive
      ? Math.atan2(input.mouseY - this.y, input.mouseX - this.x)
      : this.facing;
    const tx = this.x + Math.cos(aim) * 130;
    const ty = this.y + Math.sin(aim) * 130;
    game.noises.push({ x: tx, y: ty, r: 12, ttl: 1.2, consumed: false, kind: 'coin' });
    game.sounds.coin();
    return true;
  }

  dropSmoke(game) {
    if (this.smokes <= 0) return false;
    this.smokes -= 1;
    game.smokes.push({ x: this.x, y: this.y, r: SMOKE_RADIUS, ttl: SMOKE_SECONDS });
    game.sounds.smoke();
    return true;
  }
}
