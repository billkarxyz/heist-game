// Guard patrols, vision, suspicion and pursuit. A guard never knows where
// the thief is until it sees or hears them; the suspicion meter is the
// player's warning, and the chase is the price of ignoring it.
import {
  GUARD_RADIUS, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_VIEW_RANGE,
  GUARD_VIEW_HALF_ANGLE, GUARD_SUSPICION_RATE, GUARD_SUSPICION_DECAY,
  GUARD_LOSE_SIGHT_AFTER, GUARD_HEAR_RADIUS, SHADOW_RANGE_FACTOR,
  SNEAK_RANGE_FACTOR,
} from './config.js';
import { conePolygon, lineBlocked, pointInCone } from './sight.js';

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.x = def.x;
    this.y = def.y;
    this.waypoints = def.waypoints;
    this.wp = 0;
    this.speed = def.speed || GUARD_PATROL_SPEED;
    this.facing = 0;
    this.state = 'patrol'; // patrol | suspicious | chase | investigate | return
    this.suspicion = 0;
    this.lostSightFor = 0;
    this.investigateX = 0;
    this.investigateY = 0;
    this.waitFor = 0;
    this.lastSeenX = 0;
    this.lastSeenY = 0;
    this.seesPlayer = false;
    this.cone = [];
  }

  effectiveRange(player) {
    let range = GUARD_VIEW_RANGE;
    if (player.inShadow) range *= SHADOW_RANGE_FACTOR;
    if (player.sneaking) range *= SNEAK_RANGE_FACTOR;
    return range;
  }

  canSee(player, blockers, smokes) {
    const range = this.effectiveRange(player);
    if (!pointInCone(player.x, player.y, this.x, this.y, this.facing, GUARD_VIEW_HALF_ANGLE, range)) {
      return false;
    }
    if (lineBlocked(this.x, this.y, player.x, player.y, blockers)) return false;
    for (const s of smokes) {
      if (segmentHitsCircle(this.x, this.y, player.x, player.y, s.x, s.y, s.r)) return false;
    }
    return true;
  }

  update(dt, ctx) {
    const { player, blockers, smokes, alarmFull } = ctx;
    this.seesPlayer = ctx.grace ? false : this.canSee(player, blockers, smokes);
    this.cone = conePolygon(this.x, this.y, this.facing, GUARD_VIEW_HALF_ANGLE, this.effectiveRange(player), blockers);

    if (this.seesPlayer) {
      this.suspicion = Math.min(100, this.suspicion + GUARD_SUSPICION_RATE * dt);
      this.lastSeenX = player.x;
      this.lastSeenY = player.y;
      this.lostSightFor = 0;
    } else {
      this.suspicion = Math.max(0, this.suspicion - GUARD_SUSPICION_DECAY * dt);
      this.lostSightFor += dt;
    }

    if (alarmFull && this.state !== 'chase') this.state = 'chase';

    switch (this.state) {
      case 'patrol': {
        if (this.suspicion >= 100) {
          this.state = 'chase';
        } else if (this.suspicion >= 40) {
          this.state = 'suspicious';
          this.waitFor = 1.2;
        } else {
          this.walkPatrol(dt, ctx.solids);
        }
        break;
      }
      case 'suspicious': {
        this.face(player.x, player.y);
        this.waitFor -= dt;
        if (this.suspicion >= 100) this.state = 'chase';
        else if (this.waitFor <= 0) {
          if (this.seesPlayer) this.state = 'chase';
          else this.state = 'patrol';
        }
        break;
      }
      case 'chase': {
        this.moveToward(player.x, player.y, GUARD_CHASE_SPEED, dt, ctx.solids);
        if (!this.seesPlayer && this.lostSightFor > GUARD_LOSE_SIGHT_AFTER) {
          this.state = 'investigate';
          this.investigateX = this.lastSeenX;
          this.investigateY = this.lastSeenY;
          this.waitFor = 2.0;
        }
        break;
      }
      case 'investigate': {
        const arrived = this.moveToward(this.investigateX, this.investigateY, this.speed, dt, ctx.solids);
        if (arrived) {
          this.waitFor -= dt;
          this.facing += dt * 1.5; // scan the room
          if (this.waitFor <= 0) this.state = 'return';
        }
        break;
      }
      case 'return': {
        const [tx, ty] = this.waypoints[this.wp];
        const arrived = this.moveToward(tx, ty, this.speed, dt, ctx.solids);
        if (arrived) this.state = 'patrol';
        break;
      }
    }

    // A thrown coin is the loudest thing in the museum.
    for (const n of ctx.noises) {
      if (n.consumed) continue;
      const d = Math.hypot(n.x - this.x, n.y - this.y);
      if (d < GUARD_HEAR_RADIUS && this.state !== 'chase') {
        this.state = 'investigate';
        this.investigateX = n.x;
        this.investigateY = n.y;
        this.waitFor = 2.5;
        n.consumed = true;
      }
    }

    // Walking loudly right next to a guard gives the thief away.
    if (player.noiseRadius > 0 && this.state === 'patrol') {
      const d = Math.hypot(player.x - this.x, player.y - this.y);
      if (d < player.noiseRadius && !lineBlocked(this.x, this.y, player.x, player.y, blockers)) {
        this.state = 'investigate';
        this.investigateX = player.x;
        this.investigateY = player.y;
        this.waitFor = 1.5;
      }
    }
  }

  walkPatrol(dt, solids) {
    const [tx, ty] = this.waypoints[this.wp];
    const arrived = this.moveToward(tx, ty, this.speed, dt, solids);
    if (arrived) this.wp = (this.wp + 1) % this.waypoints.length;
  }

  moveToward(tx, ty, speed, dt, solids) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 4) return true;
    const step = Math.min(d, speed * dt);
    this.facing = Math.atan2(dy, dx);
    const nx = this.x + (dx / d) * step;
    const ny = this.y + (dy / d) * step;
    const solved = resolve(this, nx, ny, solids);
    this.x = solved.x;
    this.y = solved.y;
    return false;
  }

  face(tx, ty) {
    this.facing = Math.atan2(ty - this.y, tx - this.x);
  }

  get radius() {
    return GUARD_RADIUS;
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

// Local collision helper: keeps this module free of a circular import.
import { resolveCollisions } from './sight.js';
function resolve(guard, nx, ny, solids) {
  return resolveCollisions(nx, ny, GUARD_RADIUS, solids);
}
