/** Semantic chess audio events (mapped to files under `client/public/sounds/`). */
export const AudioEvent = {
  MOVE: "MOVE",
  CAPTURE: "CAPTURE",
  CHECK: "CHECK",
  CASTLE: "CASTLE",
  PROMOTION: "PROMOTION",
  GAME_END: "GAME_END",
  ILLEGAL: "ILLEGAL",
} as const;

export type AudioEvent = (typeof AudioEvent)[keyof typeof AudioEvent];

/** Public URL → static file in `client/public/sounds/` (served from site root in Next.js). */
export const AUDIO_URLS: Record<AudioEvent, string> = {
  [AudioEvent.MOVE]: "/sounds/move.webm",
  [AudioEvent.CAPTURE]: "/sounds/capture.webm",
  [AudioEvent.CHECK]: "/sounds/check.webm",
  [AudioEvent.CASTLE]: "/sounds/castle.webm",
  [AudioEvent.PROMOTION]: "/sounds/promotion.webm",
  [AudioEvent.GAME_END]: "/sounds/game-end.webm",
  [AudioEvent.ILLEGAL]: "/sounds/illegal.webm",
};
