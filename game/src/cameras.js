// Wall-mounted security cameras. They sweep, they blink, and when one
// catches the thief in its cone the alarm meter climbs fast.
import { CAMERA_RANGE, CAMERA_HALF_ANGLE, CAMERA_ALARM_RATE, SHADOW_RANGE_FACTOR } from './config.js';
import { conePolygon, lineBlocked, pointInCone } from './sight.js';

export class Camera {
  constructor(def) {
    this.id = def.id;
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.sweep = def.sweep;
    this.period = def.period;
    this.phase = def.phase;
    this.angle = def.baseAngle;
    this.seesPlayer = false;
    this.cone = [];
    this.blink = 0;
  }

  update(dt, time, ctx) {
    const { player, blockers, smokes } = ctx;
    this.angle = this.baseAngle + this.sweep * Math.sin((2 * Math.PI * time) / this.period + this.phase);
    this.blink += dt;
    let range = CAMERA_RANGE;
    if (player.inShadow) range *= SHADOW_RANGE_FACTOR;
    this.cone = conePolygon(this.x, this.y, this.angle, CAMERA_HALF_ANGLE, range, blockers);
    this.seesPlayer = false;
    if (!ctx.grace && pointInCone(player.x, player.y, this.x, this.y, this.angle, CAMERA_HALF_ANGLE, range)) {
      if (!lineBlocked(this.x, this.y, player.x, player.y, blockers)) {
        let smoked = false;
        for (const s of smokes) {
          if (segmentHitsCircle(this.x, this.y, player.x, player.y, s.x, s.y, s.r)) { smoked = true; break; }
        }
        this.seesPlayer = !smoked;
      }
    }
    if (this.seesPlayer) {
      ctx.alarmDelta += CAMERA_ALARM_RATE * dt;
    }
  }
}

function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  return Math.hypot(px - cx, py - cy) < r;
}
