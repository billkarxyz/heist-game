// Canvas rendering: the museum at night, every system visible in one frame
// — guards with their cones, cameras sweeping, loot glinting, the alarm
// meter legible at the top. Nothing here loads from the network.
import { WORLD_W, WORLD_H, COLORS } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, poly, fill) {
  if (poly.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(game) {
    const ctx = this.ctx;
    const level = game.level;
    const time = game.time;
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    this.drawFloor(ctx, level, time);
    this.drawVaultRoom(ctx, level);
    this.drawLoot(ctx, level, time);
    this.drawExit(ctx, level, game);
    this.drawCameraCones(ctx, game);
    this.drawGuardCones(ctx, game);
    this.drawSmokes(ctx, game);
    this.drawCases(ctx, level);
    this.drawWalls(ctx, level);
    this.drawDecor(ctx, level);
    this.drawCameras(ctx, game, time);
    this.drawGuards(ctx, game);
    this.drawPlayer(ctx, game);
    this.drawNoises(ctx, game);
    this.drawHud(ctx, game);
    if (game.state === 'title') this.drawTitle(ctx, game);
    if (game.state === 'win') this.drawEndCard(ctx, game, true);
    if (game.state === 'lose') this.drawEndCard(ctx, game, false);
    if (game.state === 'caught') this.drawCaughtFlash(ctx, game);
    if (game.alarm >= 100) this.drawAlarmVignette(ctx);
  }

  drawFloor(ctx, level, time) {
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    // Marble checker, faint so the playfield stays readable.
    ctx.fillStyle = COLORS.floorAlt;
    for (let y = 0; y < WORLD_H; y += 64) {
      for (let x = 0; x < WORLD_W; x += 64) {
        if (((x + y) / 64) % 2 === 0) ctx.fillRect(x, y, 64, 64);
      }
    }
    // Velvet runner from the vault door to the getaway door.
    const c = level.carpet;
    ctx.fillStyle = COLORS.carpet;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = COLORS.carpetEdge;
    ctx.fillRect(c.x - 3, c.y, 3, c.h);
    ctx.fillRect(c.x + c.w, c.y, 3, c.h);
    // Shadow patches: dark pools where the thief can hide.
    for (const s of level.shadows) {
      ctx.fillStyle = 'rgba(4, 4, 10, 0.55)';
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(150, 140, 220, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Moonlight pools drifting slowly across the hall.
    const mx = 640 + Math.sin(time * 0.11) * 180;
    const grad = ctx.createRadialGradient(mx, 300, 10, mx, 300, 260);
    grad.addColorStop(0, 'rgba(160, 180, 255, 0.07)');
    grad.addColorStop(1, 'rgba(160, 180, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }

  drawVaultRoom(ctx, level) {
    const v = level.vault;
    ctx.fillStyle = '#241a33';
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(v.x + 2, v.y + 2, v.w - 4, v.h - 4);
    // The vault door: heavy gold bars across the gap.
    const d = v.door;
    ctx.fillStyle = '#6b5a1e';
    ctx.fillRect(d.x - 4, d.y - 2, d.w + 8, d.h + 4);
    ctx.fillStyle = COLORS.gold;
    for (let i = 0; i < 5; i++) ctx.fillRect(d.x + 4 + i * 12, d.y - 2, 4, d.h + 4);
  }

  drawLoot(ctx, level, time) {
    for (const l of level.loot) {
      if (l.taken) continue;
      const glint = 0.55 + 0.45 * Math.sin(time * 3 + l.x * 0.05 + l.y * 0.03);
      if (l.kind === 'gem') {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#7fd4ff';
        ctx.fillRect(-7, -7, 14, 14);
        ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.4 * glint})`;
        ctx.fillRect(-7, -7, 14, 4);
        ctx.restore();
      } else if (l.kind === 'coin') {
        ctx.beginPath();
        ctx.arc(l.x, l.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.coin;
        ctx.fill();
        ctx.strokeStyle = '#8a6d1f';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${0.5 * glint})`;
        ctx.beginPath();
        ctx.arc(l.x - 2, l.y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (l.kind === 'bar') {
        ctx.fillStyle = '#e8c547';
        roundRect(ctx, l.x - 11, l.y - 5, 22, 10, 3);
        ctx.fill();
        ctx.strokeStyle = '#8a6d1f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (l.kind === 'emerald') {
        // The Aurora Emerald: big, green, pulsing on its pedestal.
        const pulse = 1 + 0.12 * Math.sin(time * 2.4);
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.scale(pulse, pulse);
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
        g.addColorStop(0, 'rgba(53, 224, 161, 0.55)');
        g.addColorStop(1, 'rgba(53, 224, 161, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = COLORS.emerald;
        ctx.fillRect(-11, -11, 22, 22);
        ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * glint})`;
        ctx.fillRect(-11, -11, 22, 6);
        ctx.restore();
        ctx.fillStyle = '#e8e8e8';
        ctx.font = 'bold 11px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText('EMERALD', l.x + 30, l.y + 4);
      }
    }
  }

  drawExit(ctx, level, game) {
    const e = level.exit;
    ctx.fillStyle = game.state === 'playing' && game.hasEmerald ? '#1f7a4d' : '#3a2f52';
    ctx.fillRect(e.x - 6, e.y - 4, e.w + 12, e.h + 4);
    ctx.fillStyle = '#0e2a1a';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = game.hasEmerald ? '#7dffb0' : '#b9a86a';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.hasEmerald ? 'GETAWAY — GO!' : 'GETAWAY DOOR', e.x + e.w / 2, e.y - 10);
  }

  drawCameraCones(ctx, game) {
    for (const cam of game.cameras) drawCone(ctx, cam.cone, COLORS.cameraCone);
  }

  drawGuardCones(ctx, game) {
    for (const g of game.guards) {
      let fill = COLORS.coneCalm;
      if (g.state === 'chase') fill = COLORS.coneChase;
      else if (g.state === 'suspicious' || g.suspicion > 35) fill = COLORS.coneAlert;
      drawCone(ctx, g.cone, fill);
    }
  }

  drawSmokes(ctx, game) {
    for (const s of game.smokes) {
      const alpha = Math.min(0.75, 0.35 + (s.ttl / 6) * 0.4);
      ctx.fillStyle = `rgba(200, 200, 210, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(220, 220, 230, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(s.x - 30, s.y + 12, s.r * 0.55, 0, Math.PI * 2);
      ctx.arc(s.x + 32, s.y - 10, s.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawCases(ctx, level) {
    for (const c of level.cases) {
      ctx.fillStyle = '#1c1428';
      roundRect(ctx, c.x, c.y, c.w, c.h, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200, 220, 255, 0.65)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(c.x + 6, c.y + 4, c.w - 12, 8);
    }
  }

  drawWalls(ctx, level) {
    for (const w of level.walls) {
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = COLORS.wallTop;
      if (w.h <= 16) ctx.fillRect(w.x, w.y, w.w, 3);
      else ctx.fillRect(w.x, w.y, 3, w.h);
    }
  }

  drawDecor(ctx, level) {
    for (const p of level.paintings) {
      ctx.fillStyle = p.tint;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }
    for (const pl of level.plants) {
      ctx.fillStyle = '#1e4d2b';
      ctx.beginPath();
      ctx.arc(pl.x, pl.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2f7a44';
      ctx.beginPath();
      ctx.arc(pl.x - 4, pl.y - 4, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawCameras(ctx, game, time) {
    for (const cam of game.cameras) {
      ctx.save();
      ctx.translate(cam.x, cam.y);
      ctx.rotate(cam.angle);
      ctx.fillStyle = '#222';
      roundRect(ctx, -4, -7, 20, 14, 4);
      ctx.fill();
      ctx.fillStyle = '#444';
      ctx.fillRect(12, -4, 6, 8);
      ctx.restore();
      // Blinking status light: red while the thief is spotted.
      const blinkOn = Math.floor(time * 2 + cam.phase) % 2 === 0;
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = cam.seesPlayer ? '#ff2d2d' : blinkOn ? '#ff5a5a' : '#5a2020';
      ctx.fill();
    }
  }

  drawGuards(ctx, game) {
    for (const g of game.guards) {
      // Body: navy uniform, cap, torch in the facing direction.
      ctx.fillStyle = '#1d2f57';
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0e1a33';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#d8d8d8';
      ctx.beginPath();
      ctx.arc(g.x, g.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1d2f57';
      ctx.beginPath();
      ctx.arc(g.x, g.y, 6.5, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffe9a8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.facing) * 20, g.y + Math.sin(g.facing) * 20);
      ctx.stroke();
      // State marker: ? while suspicious, ! while chasing.
      if (g.state === 'suspicious' || g.suspicion >= 40) {
        ctx.fillStyle = '#ffd94d';
        ctx.font = 'bold 20px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(g.state === 'chase' ? '!' : '?', g.x, g.y - 22);
      }
      if (g.state === 'chase') {
        ctx.fillStyle = '#ff4d4d';
        ctx.font = 'bold 20px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', g.x, g.y - 22);
      }
      // Suspicion arc above the guard.
      if (g.suspicion > 2) {
        ctx.strokeStyle = g.suspicion >= 100 ? '#ff4d4d' : '#e8c547';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 19, -Math.PI / 2, -Math.PI / 2 + (g.suspicion / 100) * Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  drawPlayer(ctx, game) {
    const p = game.player;
    // Sneaking makes the thief crouch smaller and dimmer.
    const r = p.sneaking ? 12 : 14;
    const bob = p.moving ? Math.sin(p.stepPhase) * 1.5 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + r + 2, r, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d0d12';
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob * 0.3, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob * 0.3, r + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = p.inShadow ? '#5a4a8a' : '#c9a227';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Mask stripe across the eyes.
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x - 7, p.y - 2 + bob * 0.3);
    ctx.lineTo(p.x + 7, p.y - 2 + bob * 0.3);
    ctx.stroke();
    // Lockpick progress ring while cracking the vault.
    if (p.vaultProgress > 0) {
      ctx.strokeStyle = '#35e0a1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 22, -Math.PI / 2, -Math.PI / 2 + p.vaultProgress * Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#7dffb0';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('CRACKING…', p.x, p.y - 30);
    }
    if (p.inShadow && p.sneaking) {
      ctx.fillStyle = '#b9a8ff';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDDEN', p.x, p.y - 24);
    }
  }

  drawNoises(ctx, game) {
    for (const n of game.noises) {
      if (n.kind !== 'coin') continue;
      ctx.strokeStyle = `rgba(255, 217, 77, ${Math.min(1, n.ttl)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 12 + (1.2 - n.ttl) * 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = COLORS.coin;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawHud(ctx, game) {
    const p = game.player;
    // Top bar.
    ctx.fillStyle = 'rgba(8, 6, 16, 0.88)';
    ctx.fillRect(0, 0, WORLD_W, 52);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('VELVET VAULT', 16, 33);
    ctx.fillStyle = '#b9a86a';
    ctx.font = '12px Georgia, serif';
    ctx.fillText('steal the Aurora Emerald', 16, 47);
    // Alarm meter: the big readable bar in the middle.
    const ax = 330;
    const aw = 360;
    ctx.fillStyle = '#3a0d0d';
    roundRect(ctx, ax, 14, aw, 22, 6);
    ctx.fill();
    const frac = Math.min(1, game.alarm / 100);
    const grad = ctx.createLinearGradient(ax, 0, ax + aw, 0);
    grad.addColorStop(0, '#e8c547');
    grad.addColorStop(0.6, '#ff8c2d');
    grad.addColorStop(1, '#ff2d2d');
    ctx.fillStyle = grad;
    if (frac > 0.01) {
      roundRect(ctx, ax + 2, 16, (aw - 4) * frac, 18, 5);
      ctx.fill();
    }
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 1.5;
    roundRect(ctx, ax, 14, aw, 22, 6);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ALARM ${Math.round(game.alarm)}%`, ax + aw / 2, 30);
    if (game.alarm >= 100) {
      ctx.fillStyle = '#ff4d4d';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.fillText('!! ALARM — RUN !!', ax + aw / 2, 47);
    } else if (game.alarm >= 60) {
      ctx.fillStyle = '#ff8c2d';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.fillText('guards are hunting', ax + aw / 2, 47);
    }
    // Loot, lives, gadgets, timer on the right.
    ctx.textAlign = 'right';
    ctx.fillStyle = '#7fd4ff';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText(`LOOT ${game.lootCount}/24  •  $${game.lootValue}`, 1264, 24);
    ctx.fillStyle = '#ff8a8a';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText('♥'.repeat(game.lives) + '♡'.repeat(3 - game.lives), 1264, 44);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#d8d8d8';
    ctx.font = '13px Georgia, serif';
    const mins = Math.floor(game.timer / 60);
    const secs = Math.floor(game.timer % 60).toString().padStart(2, '0');
    ctx.fillText(`TIME ${mins}:${secs}`, 720, 24);
    ctx.fillText(`COIN ×${p.coins}   SMOKE ×${p.smokes}`, 720, 44);
    // Objective line under the bar.
    ctx.fillStyle = 'rgba(8, 6, 16, 0.66)';
    ctx.fillRect(0, 52, WORLD_W, 24);
    ctx.fillStyle = '#e8dcc0';
    ctx.font = 'italic 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.objectiveText(), WORLD_W / 2, 69);
    // Grab prompt.
    if (game.grabTarget) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Georgia, serif';
      ctx.fillText(`Press E — grab ${game.grabTarget.name}`, WORLD_W / 2, 700);
    }
  }

  drawTitle(ctx, game) {
    ctx.fillStyle = 'rgba(6, 4, 14, 0.82)';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('VELVET VAULT', WORLD_W / 2, 210);
    ctx.fillStyle = '#e8dcc0';
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText('steal the Aurora Emerald — 1 heist, 8 guards, 24 treasures, 3 gadgets', WORLD_W / 2, 258);
    ctx.fillStyle = '#b9b9d8';
    ctx.font = '17px Georgia, serif';
    ctx.fillText('Cross the night museum. Read the patrols. Dodge the cameras.', WORLD_W / 2, 320);
    ctx.fillText('Crack the vault, pocket the emerald, and reach the getaway door.', WORLD_W / 2, 348);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('WASD move  ·  Shift sneak  ·  E grab / crack vault', WORLD_W / 2, 420);
    ctx.fillText('F toss a coin to lure guards  ·  Q smoke bomb  ·  R restart', WORLD_W / 2, 448);
    ctx.fillStyle = COLORS.emerald;
    ctx.font = 'bold 22px Georgia, serif';
    const blink = Math.floor(game.time * 1.6) % 2 === 0;
    if (blink) ctx.fillText('Press ENTER or click to begin the heist', WORLD_W / 2, 520);
  }

  drawEndCard(ctx, game, won) {
    ctx.fillStyle = won ? 'rgba(6, 20, 12, 0.85)' : 'rgba(20, 6, 6, 0.85)';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? COLORS.emerald : '#ff6b6b';
    ctx.font = 'bold 56px Georgia, serif';
    ctx.fillText(won ? 'CLEAN GETAWAY!' : 'THE HEIST FAILED', WORLD_W / 2, 280);
    ctx.fillStyle = '#e8dcc0';
    ctx.font = '20px Georgia, serif';
    if (won) {
      ctx.fillText(`The Aurora Emerald is yours. Loot $${game.lootValue} in ${game.timerText()}.`, WORLD_W / 2, 330);
      ctx.fillText(`Treasures ${game.lootCount}/24  •  Lives left ${game.lives}`, WORLD_W / 2, 362);
    } else {
      ctx.fillText('The guards closed in. The museum keeps its emerald… this time.', WORLD_W / 2, 330);
      ctx.fillText(`Loot $${game.lootValue}  •  Treasures ${game.lootCount}/24`, WORLD_W / 2, 362);
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('Press R to run it again', WORLD_W / 2, 440);
  }

  drawCaughtFlash(ctx, game) {
    ctx.fillStyle = `rgba(255, 30, 30, ${0.22 * game.caughtFlash})`;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText('CAUGHT!', WORLD_W / 2, 330);
    ctx.font = '18px Georgia, serif';
    ctx.fillText('The guards drag you back to the door…', WORLD_W / 2, 368);
  }

  drawAlarmVignette(ctx) {
    const g = ctx.createRadialGradient(640, 360, 240, 640, 360, 560);
    g.addColorStop(0, 'rgba(255, 30, 30, 0)');
    g.addColorStop(1, 'rgba(255, 30, 30, 0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
}
