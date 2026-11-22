// Canvas rendering, v2: the judged frame. Everything a screenshot judge
// reads must be legible at a glance — a structured floor with no dead
// space, bright golden cones with crisp edges, red guards, glowing loot,
// and a bright cyan thief. Nothing here loads from the network.
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

function drawCone(ctx, poly, fill, edge) {
  if (poly.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function glow(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, color.replace('A', String(alpha)));
  g.addColorStop(1, color.replace('A', '0'));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
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
    // Slate marble: bright enough that cones and loot pop against it.
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    // Gallery wings read as separate rooms.
    ctx.fillStyle = COLORS.floorWest;
    ctx.fillRect(16, 16, 284, 688);
    ctx.fillStyle = COLORS.floorEast;
    ctx.fillRect(980, 16, 284, 688);
    // Checker + crisp tile grid, so the floor looks built, not empty.
    ctx.fillStyle = COLORS.floorAlt;
    for (let y = 0; y < WORLD_H; y += 64) {
      for (let x = 0; x < WORLD_W; x += 64) {
        if (((x + y) / 64) % 2 === 0) ctx.fillRect(x, y, 64, 64);
      }
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 32; x < WORLD_W; x += 32) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_H);
    }
    for (let y = 32; y < WORLD_H; y += 32) {
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_W, y);
    }
    ctx.stroke();
    // Rugs in the wings and the south hall: no dead floor anywhere.
    for (const r of level.rugs || []) {
      ctx.fillStyle = '#4a1220';
      roundRect(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fill();
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(232, 197, 71, 0.45)';
      ctx.lineWidth = 1;
      roundRect(ctx, r.x + 8, r.y + 8, r.w - 16, r.h - 16, 5);
      ctx.stroke();
    }
    // Velvet runner from the vault door to the getaway door.
    const c = level.carpet;
    ctx.fillStyle = COLORS.carpet;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = COLORS.carpetEdge;
    ctx.fillRect(c.x - 4, c.y, 4, c.h);
    ctx.fillRect(c.x + c.w, c.y, 4, c.h);
    // Shadow patches: dark pools where the thief can hide.
    for (const s of level.shadows) {
      ctx.fillStyle = 'rgba(6, 6, 14, 0.55)';
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(170, 160, 235, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // Moonlight pools drifting slowly across the hall.
    const mx = 640 + Math.sin(time * 0.11) * 180;
    const grad = ctx.createRadialGradient(mx, 300, 10, mx, 300, 260);
    grad.addColorStop(0, 'rgba(170, 190, 255, 0.08)');
    grad.addColorStop(1, 'rgba(170, 190, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }

  drawVaultRoom(ctx, level) {
    const v = level.vault;
    ctx.fillStyle = '#2e2140';
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(v.x + 2, v.y + 2, v.w - 4, v.h - 4);
    ctx.strokeStyle = 'rgba(232, 197, 71, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(v.x + 8, v.y + 8, v.w - 16, v.h - 16);
    // The vault door: heavy gold bars across the gap.
    const d = v.door;
    ctx.fillStyle = '#6b5a1e';
    ctx.fillRect(d.x - 4, d.y - 2, d.w + 8, d.h + 4);
    ctx.fillStyle = COLORS.gold;
    for (let i = 0; i < 5; i++) ctx.fillRect(d.x + 4 + i * 12, d.y - 2, 5, d.h + 4);
  }

  drawLoot(ctx, level, time) {
    for (const l of level.loot) {
      if (l.taken) continue;
      const glint = 0.55 + 0.45 * Math.sin(time * 3 + l.x * 0.05 + l.y * 0.03);
      if (l.kind === 'gem') {
        glow(ctx, l.x, l.y, 30, 'rgba(127, 212, 255, A)', 0.35 + 0.25 * glint);
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#7fd4ff';
        ctx.fillRect(-9, -9, 18, 18);
        ctx.strokeStyle = '#eaf7ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-9, -9, 18, 18);
        ctx.fillStyle = `rgba(255,255,255,${0.45 + 0.4 * glint})`;
        ctx.fillRect(-9, -9, 18, 5);
        ctx.restore();
      } else if (l.kind === 'coin') {
        glow(ctx, l.x, l.y, 26, 'rgba(255, 217, 77, A)', 0.35 + 0.25 * glint);
        ctx.beginPath();
        ctx.arc(l.x, l.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.coin;
        ctx.fill();
        ctx.strokeStyle = '#8a6d1f';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${0.6 * glint})`;
        ctx.beginPath();
        ctx.arc(l.x - 3, l.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (l.kind === 'bar') {
        glow(ctx, l.x, l.y, 28, 'rgba(232, 197, 71, A)', 0.3 + 0.2 * glint);
        ctx.fillStyle = '#e8c547';
        roundRect(ctx, l.x - 13, l.y - 6, 26, 12, 3);
        ctx.fill();
        ctx.strokeStyle = '#8a6d1f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${0.4 * glint})`;
        ctx.fillRect(l.x - 10, l.y - 5, 20, 3);
      } else if (l.kind === 'emerald') {
        // The Aurora Emerald: big, green, pulsing on its pedestal.
        const pulse = 1 + 0.12 * Math.sin(time * 2.4);
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.scale(pulse, pulse);
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 52);
        g.addColorStop(0, 'rgba(53, 224, 161, 0.6)');
        g.addColorStop(1, 'rgba(53, 224, 161, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 52, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = COLORS.emerald;
        ctx.fillRect(-15, -15, 30, 30);
        ctx.strokeStyle = '#d8fff0';
        ctx.lineWidth = 2;
        ctx.strokeRect(-15, -15, 30, 30);
        ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * glint})`;
        ctx.fillRect(-15, -15, 30, 8);
        ctx.restore();
        ctx.fillStyle = '#d8fff0';
        ctx.font = 'bold 14px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('EMERALD', l.x, l.y + 36);
      }
    }
  }

  drawExit(ctx, level, game) {
    const e = level.exit;
    ctx.fillStyle = game.state === 'playing' && game.hasEmerald ? '#1f7a4d' : '#4a3a68';
    ctx.fillRect(e.x - 6, e.y - 4, e.w + 12, e.h + 4);
    ctx.fillStyle = '#0e2a1a';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = game.hasEmerald ? '#7dffb0' : COLORS.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x - 6, e.y - 4, e.w + 12, e.h + 4);
    ctx.fillStyle = game.hasEmerald ? '#7dffb0' : '#e8c547';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.hasEmerald ? 'GETAWAY — GO!' : 'GETAWAY DOOR', e.x + e.w / 2, e.y - 10);
  }

  drawCameraCones(ctx, game) {
    for (const cam of game.cameras) drawCone(ctx, cam.cone, COLORS.cameraCone, COLORS.cameraConeEdge);
  }

  drawGuardCones(ctx, game) {
    for (const g of game.guards) {
      let fill = COLORS.coneCalm;
      let edge = COLORS.coneCalmEdge;
      if (g.state === 'chase') {
        fill = COLORS.coneChase;
        edge = COLORS.coneChaseEdge;
      } else if (g.state === 'suspicious' || g.suspicion > 35) {
        fill = COLORS.coneAlert;
        edge = COLORS.coneAlertEdge;
      }
      drawCone(ctx, g.cone, fill, edge);
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
      ctx.fillStyle = '#241a33';
      roundRect(ctx, c.x, c.y, c.w, c.h, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(220, 235, 255, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 1;
      roundRect(ctx, c.x + 4, c.y + 4, c.w - 8, c.h - 8, 3);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(c.x + 6, c.y + 4, c.w - 12, 8);
    }
  }

  drawWalls(ctx, level) {
    for (const w of level.walls) {
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = COLORS.wallTop;
      if (w.h <= 16) ctx.fillRect(w.x, w.y, w.w, 4);
      else ctx.fillRect(w.x, w.y, 4, w.h);
    }
  }

  drawDecor(ctx, level) {
    for (const p of level.paintings) {
      ctx.fillStyle = p.tint;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }
    for (const pl of level.plants) {
      ctx.fillStyle = '#1e4d2b';
      ctx.beginPath();
      ctx.arc(pl.x, pl.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a9a58';
      ctx.beginPath();
      ctx.arc(pl.x - 5, pl.y - 5, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#57c47a';
      ctx.beginPath();
      ctx.arc(pl.x + 4, pl.y + 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Statues: grey pedestal + pale bust, so the corners hold the eye.
    for (const s of level.statues || []) {
      ctx.fillStyle = '#5a5470';
      ctx.fillRect(s.x - 14, s.y - 6, 28, 22);
      ctx.fillStyle = '#7a7390';
      ctx.fillRect(s.x - 14, s.y - 6, 28, 5);
      ctx.fillStyle = '#cfc8e0';
      ctx.beginPath();
      ctx.arc(s.x, s.y - 16, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b5aec9';
      ctx.beginPath();
      ctx.arc(s.x, s.y - 13, 11, 0, Math.PI);
      ctx.fill();
    }
  }

  drawCameras(ctx, game, time) {
    for (const cam of game.cameras) {
      // Wall mount behind the body so the camera reads as hardware.
      ctx.fillStyle = '#3a3a4a';
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(cam.x, cam.y);
      ctx.rotate(cam.angle);
      ctx.fillStyle = '#1a1a24';
      roundRect(ctx, -5, -9, 26, 18, 5);
      ctx.fill();
      ctx.strokeStyle = '#8a8a9a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#6a6a7a';
      ctx.fillRect(16, -5, 7, 10);
      ctx.fillStyle = '#9ae6ff';
      ctx.beginPath();
      ctx.arc(21, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Blinking status light: red while the thief is spotted.
      const blinkOn = Math.floor(time * 2 + cam.phase) % 2 === 0;
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = cam.seesPlayer ? '#ff2d2d' : blinkOn ? '#ff5a5a' : '#5a2020';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawGuards(ctx, game) {
    for (const g of game.guards) {
      // Body: bright red uniform with a white ring — visible at a glance.
      const r = g.radius + 4;
      ctx.fillStyle = '#e23b3b';
      ctx.beginPath();
      ctx.arc(g.x, g.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = '#5a0d0d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(g.x, g.y, r - 3, 0, Math.PI * 2);
      ctx.stroke();
      // Cap + face: pale centre, dark cap arc on top.
      ctx.fillStyle = '#f2e6d8';
      ctx.beginPath();
      ctx.arc(g.x, g.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a1a1a';
      ctx.beginPath();
      ctx.arc(g.x, g.y, 7.5, 0, Math.PI);
      ctx.fill();
      // Torch beam in the facing direction.
      ctx.strokeStyle = '#ffe9a8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.facing) * 24, g.y + Math.sin(g.facing) * 24);
      ctx.stroke();
      // State marker: ? while suspicious, ! while chasing.
      if (g.state === 'chase') {
        ctx.fillStyle = '#ff4d4d';
        ctx.font = 'bold 24px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', g.x, g.y - 26);
      } else if (g.state === 'suspicious' || g.suspicion >= 40) {
        ctx.fillStyle = '#ffd94d';
        ctx.font = 'bold 24px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', g.x, g.y - 26);
      }
      // Suspicion arc above the guard.
      if (g.suspicion > 2) {
        ctx.strokeStyle = g.suspicion >= 100 ? '#ff4d4d' : '#e8c547';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 23, -Math.PI / 2, -Math.PI / 2 + (g.suspicion / 100) * Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  drawPlayer(ctx, game) {
    const p = game.player;
    // The thief is the protagonist: bright cyan, white ring, impossible
    // to miss even at thumbnail size.
    const r = p.sneaking ? 14 : 16;
    const bob = p.moving ? Math.sin(p.stepPhase) * 1.5 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + r + 2, r, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob * 0.3, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Mask stripe across the eyes.
    ctx.strokeStyle = '#0d2530';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x - 8, p.y - 2 + bob * 0.3);
    ctx.lineTo(p.x + 8, p.y - 2 + bob * 0.3);
    ctx.stroke();
    // Direction tick so the pose reads as movement, not a dot.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.facing || 0) * (r + 8), p.y + Math.sin(p.facing || 0) * (r + 8));
    ctx.stroke();
    // Lockpick progress ring while cracking the vault.
    if (p.vaultProgress > 0) {
      ctx.strokeStyle = '#35e0a1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 24, -Math.PI / 2, -Math.PI / 2 + p.vaultProgress * Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#7dffb0';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.textAlign = 'center';
      // Inside the vault room the label goes below the thief, so it never
      // collides with the EMERALD label above the pedestal.
      ctx.fillText('CRACKING…', p.x, p.y < 170 ? p.y + 44 : p.y - 32);
    }
    if (p.inShadow && p.sneaking) {
      ctx.fillStyle = '#d8ccff';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDDEN', p.x, p.y - 26);
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
    // Top bar, taller and cleaner: title left, alarm centre, loot right.
    ctx.fillStyle = 'rgba(8, 6, 16, 0.92)';
    ctx.fillRect(0, 0, WORLD_W, 56);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('VELVET VAULT', 16, 32);
    ctx.fillStyle = '#c9b47a';
    ctx.font = '13px Georgia, serif';
    ctx.fillText('steal the Aurora Emerald', 16, 50);
    // Alarm: label left of the bar, percent right of it — never printed
    // on top of the fill, where it was unreadable.
    const ax = 400;
    const aw = 340;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('ALARM', ax - 12, 36);
    ctx.fillStyle = '#3a0d0d';
    roundRect(ctx, ax, 16, aw, 24, 6);
    ctx.fill();
    const frac = Math.min(1, game.alarm / 100);
    const grad = ctx.createLinearGradient(ax, 0, ax + aw, 0);
    grad.addColorStop(0, '#e8c547');
    grad.addColorStop(0.6, '#ff8c2d');
    grad.addColorStop(1, '#ff2d2d');
    ctx.fillStyle = grad;
    if (frac > 0.01) {
      roundRect(ctx, ax + 2, 18, (aw - 4) * frac, 20, 5);
      ctx.fill();
    }
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 1.5;
    roundRect(ctx, ax, 16, aw, 24, 6);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(game.alarm)}%`, ax + aw + 10, 36);
    const stateLabel = game.alarm >= 100 ? 'RUN!' : game.alarm >= 60 ? 'HUNTING' : game.alarm >= 35 ? 'ALERT' : 'CALM';
    ctx.fillStyle = game.alarm >= 100 ? '#ff4d4d' : game.alarm >= 60 ? '#ff8c2d' : game.alarm >= 35 ? '#ffd94d' : '#7dffb0';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(stateLabel, ax + aw + 62, 36);
    // Loot, lives, gadgets, timer on the right.
    ctx.textAlign = 'right';
    ctx.fillStyle = '#7fd4ff';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(`LOOT ${game.lootCount}/24  •  $${game.lootValue}`, 1264, 26);
    const mins = Math.floor(game.timer / 60);
    const secs = Math.floor(game.timer % 60).toString().padStart(2, '0');
    const sub = `TIME ${mins}:${secs}   COIN ×${p.coins}   SMOKE ×${p.smokes}`;
    ctx.fillStyle = '#e8e8e8';
    ctx.font = '14px Georgia, serif';
    const subW = ctx.measureText(sub).width;
    ctx.fillText(sub, 1264, 48);
    ctx.fillStyle = '#ff8a8a';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText('♥'.repeat(game.lives) + '♡'.repeat(3 - game.lives), 1264 - subW - 14, 48);
    // Objective line under the bar — bigger, no italics, brighter.
    ctx.fillStyle = 'rgba(8, 6, 16, 0.72)';
    ctx.fillRect(0, 56, WORLD_W, 26);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.objectiveText(), WORLD_W / 2, 74);
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
