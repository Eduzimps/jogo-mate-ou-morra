/** Campaign identity is separate from persistent mission IDs/rewards. */
export type BrazilRegion =
  "amazon" | "pantanal" | "brasilia" | "iguacu" | "atlantic";
export type BrazilRegionInfo = {
  id: BrazilRegion;
  label: string;
  mission: string;
  sections: readonly [string, string, string, string];
  mist: number;
  seed: number;
};
export const brazilRegions: Record<BrazilRegion, BrazilRegionInfo> = {
  amazon: {
    id: "amazon",
    label: "Amazônia · Brasil",
    mission: "Operação Rio Negro",
    sections: [
      "Patrulha do Rio Negro",
      "Pontes da floresta",
      "Pista camuflada",
      "Defesa da Amazônia",
    ],
    mist: 0.19,
    seed: 110,
  },
  pantanal: {
    id: "pantanal",
    label: "Pantanal · Brasil",
    mission: "Operação Águas Douradas",
    sections: [
      "Águas douradas",
      "Passarelas alagadas",
      "Plataformas do Pantanal",
      "Forte dos alagados",
    ],
    mist: 0.12,
    seed: 220,
  },
  brasilia: {
    id: "brasilia",
    label: "Brasília · Brasil",
    mission: "Operação Eixo Monumental",
    sections: [
      "Avenida de aproximação",
      "Eixo Monumental",
      "Espelhos d’água",
      "Comando tecnológico",
    ],
    mist: 0.075,
    seed: 330,
  },
  iguacu: {
    id: "iguacu",
    label: "Foz do Iguaçu · Brasil",
    mission: "Operação Garganta do Diabo",
    sections: [
      "Cânion do Iguaçu",
      "Véu das cataratas",
      "Pontes sobre o rio",
      "Complexo hidrelétrico",
    ],
    mist: 0.24,
    seed: 440,
  },
  atlantic: {
    id: "atlantic",
    label: "Fortaleza Atlântica · Brasil",
    mission: "Operação Fortaleza Atlântica",
    sections: [
      "Atlântico aberto",
      "Arquipélago tropical",
      "Muralhas costeiras",
      "Porto fortificado",
    ],
    mist: 0.13,
    seed: 550,
  },
};
const regions: readonly BrazilRegion[] = [
  "amazon",
  "pantanal",
  "brasilia",
  "iguacu",
  "atlantic",
];
export function brazilRegionForStage(id: number): BrazilRegion | null {
  return Number.isInteger(id) && id >= 1 && id <= 5 ? regions[id - 1] : null;
}
export const BRAZIL_WORLD_WIDTH = 720;
export const BRAZIL_WORLD_HEIGHT = 2160;
export const BRAZIL_VIEW_HEIGHT = 960;
export type BrazilRouteState = {
  progress: number;
  cameraY: number;
  cameraX: number;
  section: number;
  label: string;
  finished: boolean;
};
/** Absolute time gives deterministic scenery and a stable last frame during the boss. */
export function getBrazilRoute(
  region: BrazilRegion,
  elapsed: number,
  duration: number,
): BrazilRouteState {
  const t = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const d = Number.isFinite(duration) && duration > 0 ? duration : 50;
  const progress = Math.min(1, t / d);
  const section = Math.min(3, Math.floor(progress * 4));
  // Smooth acceleration/deceleration avoids a visible jolt at mission boundaries.
  const travel = progress * progress * (3 - 2 * progress);
  const cameraY = (BRAZIL_WORLD_HEIGHT - BRAZIL_VIEW_HEIGHT) * (1 - travel);
  const cameraX =
    90 + Math.sin(progress * Math.PI * 2 + brazilRegions[region].seed) * 28;
  return {
    progress,
    cameraY,
    cameraX,
    section,
    label: brazilRegions[region].sections[section],
    finished: progress === 1,
  };
}
