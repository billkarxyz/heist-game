// Velvet Vault: game state, the alarm meter, lives, and the main loop.
// One polished level: cross the museum, crack the vault, get out.
import { WORLD_W, WORLD_H, ALARM_DECAY, MAX_LIVES, SMOKE_SECONDS } from './config.js';
import { buildLevel } from './level.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { Player } from './player.js';
import { SoundFX } from './audio.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import {
  lootTakenCount, lootValue, emeraldTaken, nearestGrabbable,
  grabLoot, tryCrackVault, playerAtExit,
} from './loot.js';
import { stageShot } from './shots.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.sounds = new SoundFX();
    this.level = buildLevel();
    this.solids = this.level.solids;
    this.blockers = this.level.blockers;
    this.player = new Player(this.level.spawn);
    this.guards = this.level.guards.map((g) => new Guard(g));
    this.cameras = this.level.cameras.map((c) => new Camera(c));
    this.state = 'title'; // title | playing | caught | win | lose
    this.alarm = 0;
    this.lives = MAX_LIVES;
    this.timer = 0;
    this.time = 0;
    this.smokes = [];
    this.noises = [];
    this.caughtFlash = 0;
    this.caughtTimer = 0;
    this.hasEmerald = false;
    this.grabTarget = null;
    this.lastVaultTick = 0;
    this.grace = 0; // seconds of spawn protection after a respawn
    this.shotMode = false;
    this.frozen = false;
  }

  get lootCount() {
    return lootTakenCount(this.level);
  }

  get lootValue() {
    return lootValue(this.level);
  }

  timerText() {
    const mins = Math.floor(this.timer / 60);
    const secs = Math.floor(this.timer % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  objectiveText() {
    if (!this.hasEmerald) {
      const left = 24 - this.lootCount;
      return `Objective: crack the vault and steal the Aurora Emerald — ${left} treasures left in the museum`;
    }
    return 'Objective: the Emerald is yours — reach the GETAWAY DOOR, south wall!';
  }

  start() {
    this.state = 'playing';
    this.sounds.unlock();
  }

  reset() {
    this.level = buildLevel();
    this.solids = this.level.solids;
    this.blockers = this.level.blockers;
    this.player = new Player(this.level.spawn);
    this.guards = this.level.guards.map((g) => new Guard(g));
    this.cameras = this.level.cameras.map((c) => new Camera(c));
    this.alarm = 0;
    this.lives = MAX_LIVES;
    this.timer = 0;
    this.smokes = [];
    this.noises = [];
    this.caughtFlash = 0;
    this.hasEmerald = false;
    this.state = 'playing';
  }

  update(dt) {
    this.time += dt;
    if (this.state === 'title') {
      if (this.input.wasPressed('Enter') || this.input.wasPressed('MouseClick')) this.start();
      this.idlePatrol(dt);
      return;
    }
    if (this.state === 'caught') {
      this.caughtTimer -= dt;
      this.caughtFlash = Math.max(0, this.caughtTimer);
      if (this.caughtTimer <= 0) {
        if (this.lives <= 0) {
          this.state = 'lose';
          this.sounds.alarmStop();
        } else {
          this.respawn();
        }
      }
      return;
    }
    if (this.state === 'win' || this.state === 'lose') {
      if (this.input.wasPressed('KeyR')) this.reset();
      return;
    }

    // --- playing ---
    this.timer += dt;
    if (this.grace > 0) this.grace -= dt;
    const player = this.player;

    if (this.input.wasPressed('KeyM')) {
      this.sounds.unlock();
      const muted = this.sounds.toggleMute();
      void muted;
    }
    if (this.input.wasPressed('KeyR')) {
      this.reset();
      return;
    }
    if (this.input.wasPressed('KeyF')) player.tossCoin(this.input, this);
    if (this.input.wasPressed('KeyQ')) player.dropSmoke(this);

    player.update(dt, this.input, this.level);

    // Footstep ticks while walking.
    if (player.moving && Math.floor(player.stepPhase) !== Math.floor(player.stepPhase - dt * 9)) {
      this.sounds.step(player.sneaking);
    }

    // Grab loot with E (the emerald needs the lockpick instead).
    this.grabTarget = nearestGrabbable(player, this.level);
    if (this.input.wasPressed('KeyE') && this.grabTarget) {
      grabLoot(player, this.level, this.sounds);
      this.grabTarget = nearestGrabbable(player, this.level);
    }
    const cracked = tryCrackVault(player, this.level, this.sounds);
    if (cracked) {
      this.hasEmerald = true;
    }
    if (player.vaultProgress > 0 && Math.floor(player.vaultProgress * 10) !== this.lastVaultTick) {
      this.lastVaultTick = Math.floor(player.vaultProgress * 10);
      this.sounds.vaultTick();
    }
    this.hasEmerald = emeraldTaken(this.level);

    // Cameras feed the alarm meter.
    const camCtx = { player, blockers: this.blockers, smokes: this.smokes, alarmDelta: 0, grace: this.grace > 0 };
    for (const cam of this.cameras) cam.update(dt, this.time, camCtx);
    let alarmDelta = camCtx.alarmDelta;

    // Guards: suspicion feeds the alarm; a full meter means a hunt.
    const alarmFull = this.alarm >= 100;
    const guardCtx = {
      player, blockers: this.blockers, solids: this.solids,
      smokes: this.smokes, noises: this.noises, alarmFull, grace: this.grace > 0,
    };
    for (const g of this.guards) {
      g.update(dt, guardCtx);
      if (g.state === 'chase') alarmDelta += 14 * dt;
      else if (g.suspicion >= 40) alarmDelta += 6 * dt;
    }

    // The alarm decays when nobody sees the thief — recovery is possible.
    if (alarmDelta <= 0) alarmDelta -= ALARM_DECAY * dt;
    this.alarm = Math.min(100, Math.max(0, this.alarm + alarmDelta));
    if (this.alarm >= 100) this.sounds.alarmStart();
    else this.sounds.alarmStop();

    // Caught: a chasing guard touches the thief.
    for (const g of this.guards) {
      if (g.state === 'chase' && Math.hypot(g.x - player.x, g.y - player.y) < g.radius + 13) {
        this.getCaught();
        break;
      }
    }

    // Win: emerald in hand and through the getaway door.
    if (this.hasEmerald && playerAtExit(player, this.level)) {
      this.state = 'win';
      this.sounds.alarmStop();
      this.sounds.win();
    }

    // Age smoke clouds and coin rings.
    for (const s of this.smokes) s.ttl -= dt;
    this.smokes = this.smokes.filter((s) => s.ttl > 0);
    for (const n of this.noises) n.ttl -= dt;
    this.noises = this.noises.filter((n) => n.ttl > 0);
    void SMOKE_SECONDS;
  }

  getCaught() {
    this.lives -= 1;
    this.state = 'caught';
    this.caughtTimer = 1.6;
    this.caughtFlash = 1;
    this.sounds.caught();
    this.sounds.alarmStop();
  }

  respawn() {
    this.player.x = this.level.spawn.x;
    this.player.y = this.level.spawn.y;
    this.player.vaultProgress = 0;
    this.alarm = 25;
    this.grace = 2.5;
    this.smokes = [];
    this.noises = [];
    for (const g of this.guards) {
      g.state = 'patrol';
      g.suspicion = 0;
      g.wp = 0;
      g.x = g.waypoints[0][0];
      g.y = g.waypoints[0][1];
    }
    this.state = 'playing';
  }

  // Behind the title screen the guards keep walking, so the museum feels alive.
  idlePatrol(dt) {
    const ctx = {
      player: { x: -9999, y: -9999, inShadow: false, sneaking: false, noiseRadius: 0 },
      blockers: this.blockers, solids: this.solids, smokes: [], noises: [], alarmFull: false,
    };
    for (const g of this.guards) {
      g.seesPlayer = false;
      g.suspicion = 0;
      g.walkPatrol(dt, this.solids);
      g.cone = [];
    }
  }

  render() {
    this.renderer.draw(this);
  }

  frame(dt) {
    if (!this.frozen) this.update(dt);
    this.render();
    this.input.endFrame();
  }
}

function boot() {
  const canvas = document.getElementById('game');
  const game = new Game(canvas);
  window.__game = game;
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    game.shotMode = true;
    stageShot(game, Number(shot));
    game.frozen = true;
    game.render();
    document.title = `Velvet Vault — shot ${shot}`;
    return;
  }
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.frame(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

document.addEventListener('DOMContentLoaded', boot);
