// Shared tuning for Velvet Vault: one night, one museum, one emerald.
export const WORLD_W = 1280;
export const WORLD_H = 720;

export const PLAYER_RADIUS = 13;
export const PLAYER_WALK_SPEED = 165;
export const PLAYER_SNEAK_SPEED = 92;
export const PLAYER_NOISE_WALK = 150;
export const PLAYER_NOISE_SNEAK = 55;

export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 148;
export const GUARD_VIEW_RANGE = 185;
export const GUARD_VIEW_HALF_ANGLE = 0.52; // ~30 degrees each side
export const GUARD_SUSPICION_RATE = 55; // per second while the thief is seen
export const GUARD_SUSPICION_DECAY = 16;
export const GUARD_ALARM_AT = 100;
export const GUARD_LOSE_SIGHT_AFTER = 2.5; // seconds before a chasing guard gives up
export const GUARD_HEAR_RADIUS = 190;

export const CAMERA_RANGE = 210;
export const CAMERA_HALF_ANGLE = 0.42;
export const CAMERA_ALARM_RATE = 70; // per second while the thief is seen

export const ALARM_DECAY = 9; // per second while nobody sees the thief
export const ALARM_CHASE_AT = 100; // alarm meter full: every guard hunts
export const SHADOW_RANGE_FACTOR = 0.45; // guards see much less far into shadows
export const SNEAK_RANGE_FACTOR = 0.7;

export const VAULT_CRACK_SECONDS = 3.0;
export const PICKUP_RADIUS = 30;
export const MAX_LIVES = 3;
export const COIN_COUNT = 3;
export const SMOKE_COUNT = 2;
export const SMOKE_RADIUS = 110;
export const SMOKE_SECONDS = 6;

export const COLORS = {
  floor: '#3d4457',
  floorAlt: '#363d4f',
  floorWest: '#414963',
  floorEast: '#414963',
  carpet: '#7a1a2b',
  carpetEdge: '#e8c547',
  wall: '#191324',
  wallTop: '#6b5a94',
  gold: '#e8c547',
  emerald: '#35e0a1',
  gem: '#7fd4ff',
  coin: '#ffd94d',
  alarmLow: '#e8c547',
  alarmHigh: '#ff4d4d',
  coneCalm: 'rgba(255, 205, 60, 0.42)',
  coneCalmEdge: 'rgba(255, 230, 130, 0.9)',
  coneAlert: 'rgba(255, 140, 40, 0.5)',
  coneAlertEdge: 'rgba(255, 180, 90, 0.95)',
  coneChase: 'rgba(255, 60, 60, 0.55)',
  coneChaseEdge: 'rgba(255, 120, 120, 0.95)',
  cameraCone: 'rgba(110, 220, 255, 0.30)',
  cameraConeEdge: 'rgba(170, 235, 255, 0.85)',
};
