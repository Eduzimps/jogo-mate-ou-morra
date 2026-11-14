/**
 * Absolute route for Operação Guanabara.
 *
 * Coordinates use the existing 540 × 960 battlefield. The camera starts at the
 * bottom of a 6,400-unit world and travels north once; nothing wraps or resets
 * when a boss fight lasts beyond the nominal mission duration.
 */
export const RIO_WORLD_HEIGHT = 6400;
export const RIO_FIELD_HEIGHT = 960;
export const RIO_FIELD_WIDTH = 540;
export const RIO_LANDMARK_Y = 1700;
export const RIO_DEFAULT_DURATION = 48;

export type RioSection = "ocean" | "coast" | "hills" | "christ" | "finale";

export type RioRouteState = {
  progress: number;
  section: RioSection;
  label: string;
  /** Top edge of the visible world, not the camera centre. */
  cameraY: number;
  /** Independent cloud drift in logical units per second. */
  cloudSpeed: number;
  bossReady: boolean;
  /** Position of the landmark relative to the battlefield's top edge. */
  landmarkScreenY: number;
};

const SECTIONS: ReadonlyArray<{
  startsAt: number;
  section: RioSection;
  label: string;
  cloudSpeed: number;
}> = [
  {
    startsAt: 0,
    section: "ocean",
    label: "Oceano Atlântico",
    cloudSpeed: 30,
  },
  {
    startsAt: 0.2,
    section: "coast",
    label: "Costa de Copacabana",
    cloudSpeed: 30,
  },
  {
    startsAt: 0.42,
    section: "hills",
    label: "Mata do Corcovado",
    cloudSpeed: 27,
  },
  {
    startsAt: 0.65,
    section: "christ",
    label: "Sobrevoo do Cristo",
    cloudSpeed: 18,
  },
  {
    startsAt: 0.85,
    section: "finale",
    label: "Defesa da Guanabara",
    cloudSpeed: 24,
  },
];

const TIME_KNOTS = [0, 0.2, 0.42, 0.65, 0.85, 1] as const;
const CAMERA_KNOTS = [5440, 4100, 2800, 1550, 850, 0] as const;
const slopes = TIME_KNOTS.slice(0, -1).map(
  (time, i) =>
    (CAMERA_KNOTS[i + 1] - CAMERA_KNOTS[i]) / (TIME_KNOTS[i + 1] - time),
);

// Monotone cubic Hermite interpolation preserves a continuous scroll speed at
// section boundaries. Harmonic mean tangents prevent overshoot or reversing.
const tangents = TIME_KNOTS.map((_, i) => {
  if (i === 0) return slopes[0];
  if (i === TIME_KNOTS.length - 1) return slopes[slopes.length - 1];
  const previousWidth = TIME_KNOTS[i] - TIME_KNOTS[i - 1];
  const nextWidth = TIME_KNOTS[i + 1] - TIME_KNOTS[i];
  const firstWeight = 2 * nextWidth + previousWidth;
  const secondWeight = nextWidth + 2 * previousWidth;
  return (
    (firstWeight + secondWeight) /
    (firstWeight / slopes[i - 1] + secondWeight / slopes[i])
  );
});

function cameraAt(progress: number): number {
  if (progress <= 0) return CAMERA_KNOTS[0];
  if (progress >= 1) return CAMERA_KNOTS[CAMERA_KNOTS.length - 1];
  const segment =
    TIME_KNOTS.findIndex((time, i) => (i === 0 ? false : progress < time)) - 1;
  const width = TIME_KNOTS[segment + 1] - TIME_KNOTS[segment];
  const t = (progress - TIME_KNOTS[segment]) / width;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * CAMERA_KNOTS[segment] +
    (t3 - 2 * t2 + t) * width * tangents[segment] +
    (-2 * t3 + 3 * t2) * CAMERA_KNOTS[segment + 1] +
    (t3 - t2) * width * tangents[segment + 1]
  );
}

/**
 * Sample the route from absolute mission time. Pausing requires no extra route
 * state: call again with unchanged elapsed time. Invalid inputs safely fall
 * back to elapsed zero or the established 48-second mission duration.
 */
export function getRioRoute(
  elapsed: number,
  duration: number = RIO_DEFAULT_DURATION,
): RioRouteState {
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const safeDuration =
    Number.isFinite(duration) && duration > 0 ? duration : RIO_DEFAULT_DURATION;
  const progress = Math.min(1, safeElapsed / safeDuration);
  const current =
    [...SECTIONS].reverse().find((entry) => progress >= entry.startsAt) ||
    SECTIONS[0];
  const cameraY = cameraAt(progress);
  return {
    progress,
    section: current.section,
    label: current.label,
    cameraY,
    cloudSpeed: current.cloudSpeed,
    bossReady: progress >= 1,
    landmarkScreenY: RIO_LANDMARK_Y - cameraY,
  };
}
