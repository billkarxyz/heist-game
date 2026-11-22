// Line-of-sight and vision-cone geometry. Walls and display cases are the
// only things that block sight; loot, plants and carpet never do.
import { WORLD_W, WORLD_H } from './config.js';

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment (x1,y1)-(x2,y2) cross the rectangle r?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  for (const [p, d, lo, hi] of [[x1, dx, r.x, r.x + r.w], [y1, dy, r.y, r.y + r.h]]) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return false;
    } else {
      let t1 = (lo - p) / d;
      let t2 = (hi - p) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

export function lineBlocked(x1, y1, x2, y2, blockers) {
  for (const b of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return true;
  }
  return false;
}

// Distance from (ox,oy) along angle `a` to the first blocker (or maxDist).
export function rayDistance(ox, oy, a, maxDist, blockers) {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let best = maxDist;
  const ex = ox + dx * maxDist;
  const ey = oy + dy * maxDist;
  for (const b of blockers) {
    // Cheap reject: ray end-box vs rect expanded by nothing.
    const minX = Math.min(ox, ex);
    const maxX = Math.max(ox, ex);
    const minY = Math.min(oy, ey);
    const maxY = Math.max(oy, ey);
    if (b.x > maxX || b.x + b.w < minX || b.y > maxY || b.y + b.h < minY) continue;
    // March in small steps; the museum is small and this stays fast.
    for (let d = 8; d < best; d += 8) {
      const px = ox + dx * d;
      const py = oy + dy * d;
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
        best = d;
        break;
      }
    }
  }
  return best;
}

// Vision cone polygon from (ox,oy), facing `angle`, half-angle `half`,
// range `range`, clipped by blockers. 17 rays give a smooth edge.
export function conePolygon(ox, oy, angle, half, range, blockers) {
  const pts = [{ x: ox, y: oy }];
  const rays = 16;
  for (let i = 0; i <= rays; i++) {
    const a = angle - half + (2 * half * i) / rays;
    const d = rayDistance(ox, oy, a, range, blockers);
    pts.push({ x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d });
  }
  return pts;
}

export function pointInCone(px, py, ox, oy, angle, half, range) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range || dist < 1) return false;
  let da = Math.atan2(dy, dx) - angle;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  return Math.abs(da) <= half;
}

export function clampToWorld(x, y, r) {
  return {
    x: Math.min(WORLD_W - r, Math.max(r, x)),
    y: Math.min(WORLD_H - r, Math.max(r, y)),
  };
}

// Push a circle out of every solid rectangle it overlaps.
export function resolveCollisions(x, y, r, solids) {
  for (const s of solids) {
    const cx = Math.min(s.x + s.w, Math.max(s.x, x));
    const cy = Math.min(s.y + s.h, Math.max(s.y, y));
    const dx = x - cx;
    const dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 < 1e-6) {
        // Dead centre: push out along the smallest penetration axis.
        const left = x - s.x;
        const right = s.x + s.w - x;
        const top = y - s.y;
        const bottom = s.y + s.h - y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) x = s.x - r;
        else if (m === right) x = s.x + s.w + r;
        else if (m === top) y = s.y - r;
        else y = s.y + s.h + r;
      } else {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r;
        y = cy + (dy / d) * r;
      }
    }
  }
  return { x, y };
}
